# monje·io — landing

Landing de una pantalla para **monje.io**: orbe animado + chat que lleva a reservar una
llamada de consultoría gratis. HTML/CSS/JS vanilla, sin build.

## Arrancar
```bash
python3 -m http.server 8000   # http://localhost:8000  (usa el mock del chat)
# o simplemente abre index.html

vercel dev                    # opcional: levanta también /api/chat de verdad
```

## El chat
`chat.js` llama a **`POST /api/chat`** (`{message, pillar, history}` → `{reply, offerCall}`).
Sin backend cae a un **mock local** on-voice, así que la landing funciona abriéndola sin más.

El endpoint (`api/chat.js`, Vercel, sin dependencias) responde con el **guion de marca** por
defecto. Define **`ANTHROPIC_API_KEY`** (y opcional `ANTHROPIC_MODEL`, por defecto
`claude-sonnet-4-6`) para activar a Monje con Claude. Si Claude falla, vuelve al guion.

La cadencia está cerrada por producto: la primera respuesta de Alex pregunta y la opción
**"Reservar mi llamada"** aparece como máximo en su segunda respuesta.

En Vercel añade estas variables en **Project Settings → Environment Variables**:
```bash
ANTHROPIC_API_KEY=tu_clave
ANTHROPIC_MODEL=claude-sonnet-4-6 # opcional
```

> Es **persona-real, no bot**: no cambies el tono ni hagas que el chat parezca un chatbot.

## Estructura
- `index.html` — markup
- `assets/css/styles.css` — estilos (tokens de marca en `:root`)
- `assets/js/orb.js` — orbe WebGL
- `assets/js/chat.js` — chat → `POST /api/chat` (mock local si no hay backend)
- `api/chat.js` — endpoint del chat (Vercel): `{reply, offerCall}`
- `vercel.json` — config de Vercel (cleanUrls, cache, headers)
- `assets/img/avatar.jpg` — foto del chip "te responde una persona"
- `assets/logo/` — referencias y exports del logo
- `brand/monje-marca-v2.md` — documento de marca

👉 **Lee `CLAUDE.md`** para el contexto completo, el sistema de marca y los TODOs.

## Por dónde empezar en Claude Code
Ve a **`PROMPTS.md`** — tiene los prompts listos para pegar (el primero es el de arranque).
