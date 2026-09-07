# Culpa · Tickets

Venta de entradas para Culpa: reggaeton nostálgico, público general, en
Montevideo. Next.js + Prisma + Postgres, pagos con MercadoPago, entrega del QR
por mail con Resend y validación en la puerta con la cámara del celular.

Es un fork de `fyf-tickets`. El remoto `fyf` apunta al repo original, así que
los arreglos que valgan para las dos marcas se pueden portar con
`git cherry-pick`.

## Identidad

La web es un teléfono de los 2000: cuerpo de color, pantalla LCD, texto
pixelado en tinta, softkeys *Menu* y *Back*. En desktop se dibuja el celular
completo y el contenido scrollea dentro de la pantalla; en mobile el cuerpo
desaparece y el LCD ocupa el viewport entero — el celular del usuario es el
Nokia.

Hay dos pieles, **Clásico** (cuerpo azul, LCD lima) y **Halloween** (cuerpo
violeta, LCD calabaza, murciélago en la barra de estado, otro guion en el
inbox). Se eligen desde el Panel de `/admin` y el cambio alcanza al sitio,
los mails, la imagen del link compartido y el favicon. Los links ya
compartidos pueden tardar en actualizarse: las redes cachean la imagen. Sin
elegir nada, el sitio es Clásico. La fuente de verdad de hex y copy es
`src/lib/theme.ts`; `globals.css` repite los hex porque CSS no puede
importarlos.

Los tokens llevan nombre de rol, no de color, porque cambian con el tema:

| Token | Clásico | Halloween | Uso |
| --- | --- | --- | --- |
| `culpa-lcd` | `#C9D92C` | `#F4841F` | pantalla LCD, fondo del contenido |
| `culpa-body` | `#2B3AD8` | `#5B2A86` | cuerpo del teléfono, botones, links |
| `culpa-ink` | `#0D0D0D` | `#0D0D0D` | texto pixelado, bordes |
| `culpa-cream` | `#F4E3D7` | `#EFE6CF` | texto sobre el cuerpo y sobre noche |
| `culpa-night` | `#080808` | `#070409` | fondo alrededor del celu |
| `culpa-yellow` | `#FFDE59` | `#FFDE59` | el amarillo del logo, destacados |
| `culpa-alert` | `#E23B2E` | `#A8101C` | errores, escaneo inválido |

El wordmark es la gráfica de la marca, no una fuente: vive en
`public/culpa-wordmark.png` (amarillo con extrusión negra, fondo transparente)
y se usa con el componente `Wordmark`, que se dimensiona por ancho. El keyline
negro es lo que lo hace legible contra cualquier LCD, así que no se recolorea
ni se le agrega sombra, y no cambia con el tema.

Dos voces tipográficas: **Silkscreen** (`font-pixel`) para datos, labels y
menús, y **Tahoma/Verdana** (`font-ui`) para párrafos y softkeys, como
mezclaban los teléfonos de la época. Las piezas reutilizables del LCD están en
`src/components/nokia/`.

El admin y el validador comparten paleta y tipografía pero no el marco del
teléfono: son herramientas, van sobre fondo noche con el LCD como acento.

## Correr en local

```bash
npm install
cp .env.example .env      # completá las credenciales
npm run db:migrate
npm run db:seed           # admin@culpa.uy / admin123 + la fecha de prueba
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El panel está en `/admin`
y el escáner de puerta en `/validator`.

> El seed crea una fecha pública con un tipo de entrada a precio **placeholder**.
> Ajustá el precio en `/admin` antes de abrir la venta.

Los tests unitarios corren con `npm test`.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `JWT_SECRET` | sesión de staff |
| `QR_SIGNING_SECRET` | firma de los QR (distinto al de sesión) |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET` | MercadoPago |
| `RESEND_API_KEY`, `EMAIL_FROM` | envío de mails |
| `NEXT_PUBLIC_APP_URL` | URL pública, usada en links y metadata |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` | `prisma generate` + build de Next |
| `npm run start` | aplica migraciones y arranca en producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | aplica migraciones |
| `npm run db:seed` | crea el admin y la fecha de prueba |
| `npm run db:studio` | Prisma Studio |

## Deploy

DigitalOcean App Platform, definido en `.do/app.yaml`: servicio `web` desde
`juanmanuelrot/culpa-tickets` con deploy automático en `main`, y base
`culpa-db` (Postgres 16). Los secretos se cargan en el panel de DO; `EMAIL_FROM`
y `NEXT_PUBLIC_APP_URL` hay que apuntarlos al dominio real de Culpa.
