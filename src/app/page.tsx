"use client";

import { useRouter } from "next/navigation";
import { HaringBorder } from "@/components/decorative/haring-border";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-fyf-red flex flex-col items-center justify-center relative overflow-hidden">
      <HaringBorder />
      <div className="relative z-10 text-center px-6">
        <h1 className="text-7xl md:text-9xl font-black text-white tracking-wider mb-4">
          F&F
        </h1>
        <p className="text-xl md:text-2xl text-white/90 italic mb-12">
          Solo para nosotros
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-fyf-red font-bold text-lg uppercase tracking-widest px-10 py-4 rounded-none hover:bg-fyf-cream transition-colors"
        >
          Admin Login
        </button>
      </div>
    </div>
  );
}
