# Culpa · Tickets

Venta de entradas para Culpa: reggaeton nostálgico, público general, en
Montevideo. Next.js + Prisma + Postgres, pagos con MercadoPago, entrega del QR
por mail con Resend y validación en la puerta con la cámara del celular.

Es un fork de `fyf-tickets`. El remoto `fyf` apunta al repo original, así que
los arreglos que valgan para las dos marcas se pueden portar con
`git cherry-pick`.

## Identidad

La web es un teléfono de los 2000: cuerpo azul, pantalla LCD lima, texto
pixelado en tinta, softkeys *Menu* y *Back*. En desktop se dibuja el celular
completo y el contenido scrollea dentro de la pantalla; en mobile el cuerpo
desaparece y el LCD ocupa el viewport entero — el celular del usuario es el
Nokia.

| Token | Hex | Uso |
| --- | --- | --- |
| `culpa-lime` | `#C9D92C` | pantalla LCD, fondo del contenido |
| `culpa-blue` | `#2B3AD8` | cuerpo del teléfono, botones, links |
| `culpa-ink` | `#0D0D0D` | texto pixelado, bordes |
| `culpa-cream` | `#F4E3D7` | texto sobre azul y sobre noche |
| `culpa-night` | `#080808` | fondo alrededor del celu |
| `culpa-yellow` | `#FFDE59` | el amarillo del logo, destacados |
| `culpa-alert` | `#E23B2E` | errores, escaneo inválido |

El wordmark es la gráfica de la marca, no una fuente: vive en
`public/culpa-wordmark.png` (amarillo con extrusión negra, fondo transparente)
y se usa con el componente `Wordmark`, que se dimensiona por ancho. El keyline
negro es lo que lo hace legible contra el lima, así que no se recolorea ni se
le agrega sombra.

Dos voces tipográficas: **Silkscreen** (`font-pixel`) para datos, labels y
menús, y **Tahoma/Verdana** (`font-ui`) para párrafos y softkeys, como
mezclaban los teléfonos de la época. Las piezas reutilizables del LCD están en
`src/components/nokia/`.

El admin y el validador comparten paleta y tipografía pero no el marco del
teléfono: son herramientas, van sobre fondo noche con lima como acento.

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
