import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// La página de un evento es igual para todos, así que Cloudflare puede servirla
// unos segundos sin llegar al origen. El agotado puede verse hasta ~10s tarde
// (más mientras revalida), pero el checkout igual valida el cupo. El navegador
// no la guarda (max-age=0). Los payloads RSC no se pisan con el HTML aunque
// Cloudflare ignore Vary: Next solo los sirve con un ?_rsc= propio.
const EVENT_PAGE = /^\/event\/[^/]+$/;
const EVENT_PAGE_CACHE = "public, max-age=0, s-maxage=10, stale-while-revalidate=30";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EVENT_PAGE.test(pathname)) {
    const response = NextResponse.next();
    response.headers.set("cache-control", EVENT_PAGE_CACHE);
    return response;
  }

  // Protected routes
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isValidatorRoute = pathname.startsWith("/validator") || pathname.startsWith("/api/validator");

  if (!isAdminRoute && !isValidatorRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("culpa-session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (isAdminRoute && role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isValidatorRoute && role !== "VALIDATOR" && role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/event/:slug", "/admin/:path*", "/validator/:path*", "/api/admin/:path*", "/api/validator/:path*"],
};
