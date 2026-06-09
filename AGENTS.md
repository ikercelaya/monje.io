# monje·io — Landing (handoff para Codex)

Landing premium de **monje.io** (rebrand de la agencia monje360). Página de una sola
pantalla: orbe animado + un chat que recoge el problema del usuario y lo lleva a
**reservar una llamada de consultoría gratis**. Sin build step: HTML/CSS/JS vanilla.

> Idioma del proyecto: **español**. Tono de marca: seguro y pícaro (estilo Ira Bravo /
> Putos Modernos) pero **premium**, casi sin tacos. "No ataca, desarma."

---

## Cómo arrancar

No hay dependencias ni compilación. Dos opciones:

```bash
# opción rápida
open index.html            # (mac)  /  xdg-open index.html (linux)

# opción recomendada (evita restricciones file:// y sirve los assets bien)
python3 -m http.server 8000
# luego abre http://localhost:8000
```

Las fuentes (Sora + JetBrains Mono) se cargan desde Google Fonts por CDN → hace falta internet.

---

## Mapa de archivos

```
index.html                     Markup de la landing (nav · hero · chat · footer)
assets/css/styles.css          TODO el estilo (tokens de marca como CSS vars arriba)
assets/js/orb.js               Intro gamificada por scroll (img-swap de la secuencia + reveal de fases) + tilt 3D
assets/orb-seq/f-01..36.jpg    Secuencia "formación": canica → cara del monje (36 frames, 760px, ~1.6 MB)
assets/js/chat.js              Lógica del chat → llama a POST /api/chat (mock local si no hay backend)
api/chat.js                    Endpoint del chat (Vercel) → {reply, offerCall}. Guion on-voice; LLM si hay clave
vercel.json                    Config de Vercel (cleanUrls, cache de assets, headers)
assets/img/avatar.jpg          Foto real para el chip "te responde una persona"
assets/logo/preview-*.png      Referencias visuales del logo (3 variantes)
assets/logo/source/*.html      Exports originales del logo (fuente para vectorizar)
brand/monje-marca-v2.md        Documento maestro de marca (concepto, voz, guion)
```

---

## Sistema de marca (no inventar, respetar)

**Colores** (definidos como CSS vars en `styles.css :root`):
- `--black` Pilo Black `#0F0F0F`
- `--green` Electric Green / lima `#C7FF2E`  ← color de marca, úsalo con criterio
- `--white` `#FFFFFF` · `--charcoal` `#2E2E2E` · `--gray` `#808080`

**Tipografía**:
- **Una sola tipografía en TODO: Sora** (`--disp`). El logotipo está hecho en Sora.
- (Antes había una secundaria mono —JetBrains Mono— para eyebrow/footer/status; **eliminada**.
  El var `--mono` se mantiene como alias de Sora por compatibilidad; no reintroducir mono.)

**Logotipo** = `monje` + `.io` dentro de una **pastilla lima** (componente `.logo` en CSS,
reconstruido en vector con texto Sora, nítido y escalable). Variantes:
- Sobre fondo claro → `monje` negro + pastilla lima (nav).
- Sobre fondo oscuro → `monje` blanco + pastilla lima (footer).
- (Existe variante "sobre lima": pastilla negra. Ver `assets/logo/`.)
Los `.html` en `assets/logo/source/` son los exports oficiales; si necesitas SVG sueltos,
vectorízalos desde ahí (la copyright/propiedad del logo es del cliente).

**Claims / north star**:
- "Tu marca hace ruido. Monje la hace sonar."
- "No es una agencia. Es Monje." · "Tienes el talento. Te falta la batuta."
- Posicionamiento (en la web): **"Especialistas en Marketing, IA y optimización de empresas."**
- Pilares: **Atraer · Convertir · Automatizar · Escalar** (son los chips del hero).

---

## La intro gamificada por scroll (`assets/js/orb.js`)

La home es una **intro por scroll** (scrollytelling). Estructura: `nav` (logo fijo) + `#hero`
(alto, `260vh` con JS) con un `.pin` **sticky 100vh** dentro. El orbe es el vídeo de "formación"
(`orb-form.mp4`): empieza como **canica** abstracta y, al avanzar, **se forma la cara del monje**.

**Estado inicial (sin scroll):** logo arriba, orbe en su 1er frame (canica), copy **"Quiero a
monje·io"** + flecha de scroll. Nada más (sensación de vacío).

**Al hacer scroll** (`orb.js`, desktop Y móvil): se calcula un progreso `p` 0→1 sobre el `#hero` y:
- **img-swap de la secuencia:** `orb.src = frames[round(p·35)]` → la cara se forma con el scroll.
  ⚠️ Es una **secuencia de imágenes** (no vídeo) a propósito: el *scrub* de vídeo **no funciona en
  iOS Safari** (no repinta el frame al hacer seek). El img-swap sí.
- **reveal por fases** (opacity + translateY): intro-hint se va (p 0–0.12), eyebrow (0.46–0.60),
  titular (0.60–0.73), botón "Fichar" (0.55–0.66), chat/stage (0.74–0.90).

**Activación / fallbacks:**
- Gamificado si `!prefers-reduced-motion` (también en móvil) → `orb.js` añade `html.gamified`
  (de ahí cuelgan `#hero{height:260vh}`, `.pin` sticky `100dvh` y `.ph{opacity:0}` en el CSS).
- **reduced-motion / sin JS:** todo visible, cara ya formada (último frame). Mejora progresiva.
- ⚠️ `html,body{height:100%}` fijaba la altura y el `#hero` no podía crecer → con JS se libera con
  `html.gamified,html.gamified body{height:auto}`. No volver a poner height fijo al body.
- ⚠️ Pin a `100dvh` (no `100vh`) para que la barra de Safari iOS no descuadre la pantalla.

**El orbe (común):** `#mjOrb` con `object-fit:cover` + **máscara circular** (funde el borde blanco);
sombra de contacto vía `.orb-wrap::after`; `floaty` + `glowpulse` en CSS. Leve **tilt 3D** hacia el
cursor (`perspective + rotateX/rotateY` vía `--rx/--ry`, máx 7°) + el halo le sigue.

**Modo chat (tras la 1ª respuesta de Monje):** `chat.js` llama a `window.__monjeEnterChat()` (en
`orb.js`). Quita `gamified`, limpia los estilos inline del scroll-intro y añade `html.chatting`:
el orbe se **encoge y sube** (cabecera ~78px), el eyebrow/título se ocultan y la conversación pasa
a ocupar la pantalla tipo **WhatsApp** (`#chat` con scroll propio, composer abajo, sin scroll de
página). Los CTAs de esquina se ocultan; "Contacta" del nav se mantiene. Ver `html.chatting` en CSS.

Para regenerar los vídeos: ffmpeg vía `imageio-ffmpeg` (crop centrado a cuadrado + scale 760 +
`-x264-params keyint=1:scenecut=0` para que el scrub sea fluido).

(El shader WebGL original y las versiones de orbe intermedias —vídeo churn, imagen fija— quedan en git.)

---

## El chat (`assets/js/chat.js`) — conectado a `/api/chat`

`handle()` envía cada turno a **`POST /api/chat`** con `{message, pillar, history}` y pinta
`{reply, offerCall}`. Si `offerCall` es `true`, muestra la tarjeta CTA. Los chips
(Atraer/Convertir/…) precargan un mensaje y mandan su `pillar`.

**Mock local (sin backend):** si el `fetch` falla (abrir por `file://`, 404 al servir estático,
error de red) cae automáticamente a un guion on-voice (`openers` + `second`) idéntico al de
antes, así la landing se puede probar sin servidor. La UI y las funciones `typing()`, `add()`
y `showCTA()` quedan **intactas**. (El texto del usuario se escapa antes de pintarlo.)

### Requisito de marca CLAVE: "persona real, no bot"
El usuario quiere que se perciba que **detrás hay UNA PERSONA (Monje)**, no software/IA. El chat
es solo la forma de ir al grano y no hacer perder el tiempo. Esto está implementado con:
1. chip de presencia (avatar foto + "Te responde una persona, no un bot" + punto verde "en línea"),
2. nota gris bajo el chat ("No es un bot ni un software: detrás estoy yo, una persona…"),
3. el primer mensaje del bot se presenta como persona y la CTA dice "hablas con quien va a estar
   en tu negocio".
**No 'botifiques' el copy.** Mantén el tono humano y directo.

### El backend (`api/chat.js`)
Función serverless de Vercel, **sin dependencias** (usa `fetch` global). Contrato:

```
POST /api/chat   { message, pillar, history:[{role,content}] }  ->  { reply, offerCall }
```

Dos modos, conmuta solo según haya clave:
- **Sin `ANTHROPIC_API_KEY`** → responde con el **guion on-voice** (mismo texto que el mock).
  Despliega y funciona tal cual, gratis, sin tocar nada.
- **Con `ANTHROPIC_API_KEY`** → Monje "de verdad": llama a Codex con el system prompt de marca
  (voz persona-real, el guion como tono base) vía *tool use* para devolver `{reply, offerCall}`
  fiable. Modelo configurable con `ANTHROPIC_MODEL` (por defecto `Codex-sonnet-4-6`). Si el LLM
  falla, cae al guion: el chat **nunca** se rompe.

> ⚠️ El system prompt es la voz de marca. **No lo 'botifiques'.** Monje es una persona: el prompt
> le prohíbe decir que es una IA/bot/asistente. Si lo editas, mantén ese tono (ver §"La voz" en
> `brand/monje-marca-v2.md`).

Local: el servidor estático (`python3 -m http.server`) **no** ejecuta `/api/chat` → se usa el
mock. Para probar el endpoint de verdad en local: `vercel dev` (o despliega en Vercel).

---

## TODO (pendientes para terminar)

- [x] **Conectar el chat al bot real** — `chat.js` ya llama a `POST /api/chat` (con mock local de
      fallback) y `api/chat.js` sirve el endpoint. Falta solo poner `ANTHROPIC_API_KEY` en Vercel
      para activar el LLM (sin ella, responde con el guion on-voice).
- [ ] **Enlaces de reserva**: los botones "Fichar a Monje", "Reservar mi llamada" y la CTA del
      chat apuntan a `#`. Cambiar por la agenda real (Calendly / Cal.com).
- [x] **Footer ELIMINADO** — la página es una sola pantalla limpia (sin scroll a footer). El
      contacto vive ahora en dos CTAs flotantes de esquina: **"Contacta"** (abajo-izq, `mailto:`)
      y **WhatsApp** (abajo-dcha, FAB → `wa.me/34619814199`). Ver `index.html` (`.corner-cta`).
- [x] **Logo en SVG sueltos** (primaria + reversa) — generados en `assets/logo/monje-io-primaria.svg`
      y `monje-io-reversa.svg`, con Sora outlineada a trazados (sin dependencia de fuente).
- [x] **Titular en móvil** — en <560px parte en 2 líneas a buen tamaño; en desktop/tablet sigue
      en 1 línea (`white-space:nowrap`). Resuelto en `styles.css`.
- [x] (Opcional) mini-avatar (foto) junto a cada burbuja del bot — implementado (`.bot-row` en
      `chat.js`/`styles.css`). El nombre por burbuja se descartó por mantener el aire (ya está en el chip).
- [ ] Páginas legales (Aviso legal / Privacidad / Cookies) si se publica.

## Decisiones ya tomadas (no deshacer sin querer)
- Estética **minimal premium, fondo blanco**. El usuario rechazó versiones "cargadas"
  (eyebrows largos, subtítulos, grano, halos fuertes). Mantener aire.
- Orbe **verde+carbón** (no humo plano, no canica, no contorno de energía sobre negro).
- **Sin footer**: la home cabe en una sola pantalla (16:9 en desktop, responsive en móvil), súper
  limpia. El contacto son dos CTAs flotantes de esquina (Contacta = `mailto:info@monje360.com`,
  WhatsApp = `wa.me/34619814199`). En modo gamificado aparecen al final del scroll; en móvil, siempre.
  Datos reales de monje360.com: tel/WhatsApp 619 814 199 · info@monje360.com · IG @monje.360.
