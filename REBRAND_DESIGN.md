# Spec: Rebrand emerald de Suite Operativa Frontend (dev harness)

Generado 2026-07-28. Complementa `RECONCILIACION_BLUEPRINT.md` (no lo reemplaza — este spec es solo de identidad visual, el blueprint sigue gobernando la reconciliación de código/sync).

## Contexto y motivación

El diseño actual de `Suite_Operativa_Frontend/styles.css` usa una identidad "atmósfera nocturna" inventada de forma independiente (negro verdoso + acento chartreuse eléctrico `#c6ff3d`, tipografía editorial Fraunces). El usuario pidió alinear el look de la app interna con el sitio público real de la empresa, `superozonoglobal.com/super-ozono`.

**Corrección importante durante el brainstorm:** un primer análisis de texto (WebFetch) del sitio dijo "predominantemente blanco, azul/verde" — esto era **incorrecto**. Se verificó descargando el HTML real (`curl`) y el logo real (`/images/logo_ozono.png`) y viendo la imagen directamente:

- El fondo real es casi negro-verdoso (`#020d06`, footer en gradiente `#060f0a → #030a06`), **no blanco**.
- Los acentos reales son verde esmeralda/menta (`#10b981`, `#45fc9c`, botones `#00a050 → #037a3a`), **no azul-verde**.
- El logo real **es el mismo personaje mascota** que ya usa Suite Operativa (`logo.js`), solo que en un tono esmeralda apagado en vez del chartreuse eléctrico — no es un símbolo O₃ minimalista como sugería el resumen inicial.

Esta corrección se le presentó al usuario a mitad del brainstorm (con capturas de ambos logos) y se re-confirmaron las decisiones de tema y logo con la información correcta.

## Decisiones confirmadas con el usuario

1. **Alcance**: todo `Suite_Operativa_Frontend` (rebrand completo, no solo login).
2. **Profundidad**: rebrand completo de identidad (paleta, tipografía, logo, tono), no solo cambio de acentos.
3. **Tema base**: modo oscuro esmeralda, fiel al sitio real (no modo claro — se corrigió después de ver la paleta real).
4. **Logo**: usar el logo real descargado de `superozonoglobal.com/images/logo_ozono.png` (mascota recoloreada a esmeralda por la propia empresa), reemplazando el PNG chartreuse actual en `logo.js`.
5. **Cuándo se publica**: solo en `Suite_Operativa_Frontend/index.dev.html` (arnés de desarrollo, Paso 0 del blueprint de reconciliación) por ahora. **No se toca el `index.html` de 4MB en producción** — ese cambio es un paso posterior, después de completar la reconciliación y migración a Vite del `RECONCILIACION_BLUEPRINT.md`.
6. **Enfoque técnico**: Enfoque B — swap de tokens CSS existentes + ajuste de los efectos que dependen del tono exacto (glow, gradiente de botón, logo), sin tocar la estructura de `styles.css` ni ningún archivo `.jsx`. Se descartó el enfoque C (rediseño completo tocando también estilos inline en JSX) por ser innecesario para el objetivo y por aumentar el riesgo mientras la reconciliación de código sigue pendiente.

## Paleta de color (reemplaza el bloque `:root` de `styles.css`)

| Token | Valor actual | Valor nuevo | Origen |
|---|---|---|---|
| `--bg` | `#0a0d08` | `#020d06` | root real del sitio |
| `--bg-elevated` | `#11150d` | `#071409` | interpolado, mismo paso relativo que el original |
| `--surface` | `#171c12` | `#0c1c11` | interpolado |
| `--surface-hover` | `#1e2417` | `#12271a` | interpolado |
| `--border` | `#262e1c` | `#1d3524` | interpolado |
| `--border-soft` | `#1c2215` | `#17291d` | interpolado |
| `--accent` | `#c6ff3d` (chartreuse) | `#10b981` (emerald-500) | botón/badge circular real del sitio |
| `--accent-dim` | `#8fb82c` | `#037a3a` | extremo oscuro del gradiente de CTA real |
| `--accent-bright` (nuevo token) | — | `#45fc9c` | verde menta brillante real, para glow/pulso |
| `--accent-ink` | `#10150a` (negro) | `#ffffff` (blanco) | el sitio real usa texto blanco sobre sus botones verdes — con emerald-500 el contraste con negro ya no es el adecuado |
| `--text` | `#f2f4e8` | `#eef7f1` | mismo rol, tinte ajustado al nuevo verde |
| `--text-muted` | `#9aa08c` | `#8fae9c` | ídem |
| `--text-faint` | `#656e54` | `#5c7568` | ídem |

Sin cambios: `--coral`, `--sky`, `--violet`, `--amber`, `--danger`, `--mint` (colores de estado funcional — tareas, notificaciones — no forman parte de la identidad de marca y no se tocan en este spec). `--radius-*` y `--shadow-*` tampoco cambian.

**Hallazgo adicional de consistencia:** `.avatar { color: #0a0d08; }` (línea 204) reutiliza el valor viejo de `--bg` hardcodeado como color de texto legible sobre el fondo de color aleatorio de cada avatar (no relacionado con el fondo de página, es una coincidencia de valor reutilizado a propósito por contraste). Se actualiza a `color: var(--bg);` para que seguir tomando automáticamente el tono oscuro correcto sin quedar desincronizado si `--bg` vuelve a cambiar en el futuro.

## Tipografía

El sitio real no usa ninguna serif editorial (todo el texto visible es sans-serif, con mucho peso `font-light`). Se elimina Fraunces:

| Token | Actual | Nuevo |
|---|---|---|
| `--font-display` | `'Fraunces', serif` | `'Plus Jakarta Sans', sans-serif` |
| `--font-body` | `'IBM Plex Sans', sans-serif` | sin cambio |
| `--font-mono` | `'Space Mono', monospace` | sin cambio |

El wordmark especial (`.brand-wordmark` / `.wordmark-ozono`, "Super" en Poppins Regular + "OZONO" en Poppins Black) se mantiene — es un detalle tipográfico de marca independiente del color, y el usuario no pidió cambiarlo. Se actualiza el `@import` de Google Fonts en `styles.css` para cargar Plus Jakarta Sans en vez de Fraunces (mantener IBM Plex Sans, Space Mono, Poppins).

## Logo

- Reemplazar el contenido de `Suite_Operativa_Frontend/logo.js` (`OZONO_LOGO_DATA_URI`): en vez del PNG chartreuse actual, usar el PNG real descargado de `https://www.superozonoglobal.com/images/logo_ozono.png` (convertido a base64 data URI, mismo formato que hoy).
- `.logo-mark` y `.logo-pulse` (glow/animación de pulso del logo en `styles.css`): cambiar `rgba(198, 255, 61, ...)` (chartreuse) por `rgba(69, 252, 156, ...)` (`--accent-bright`, el verde menta real).
- No se toca `components.jsx` (el componente `LogoMark` ya consume `OZONO_LOGO_DATA_URI` como variable, no como color hardcodeado — el cambio queda contenido en `logo.js` + `styles.css`).

## Efectos y componentes clave

- **`.ozono-atmosphere`** (blobs de fondo animados): el blob principal (`rgba(198, 255, 61, 0.10)`) pasa a `rgba(16, 185, 129, 0.10)` (`--accent`). Se mantienen los blobs secundarios sky (`rgba(92, 201, 255, 0.08)`) y coral (`rgba(255, 92, 61, 0.06)`) sin cambio, para conservar la profundidad visual — no son parte de la identidad de marca, son variedad cromática decorativa ya presente en el diseño original.
- **`.btn-accent`**: pasa de `background: var(--accent)` plano a `background: linear-gradient(-45deg, var(--accent-dim), #00a050)`, replicando el gradiente diagonal de los CTA reales del sitio (`linear-gradient(-45deg,#00a050,#037a3a)`). Color de texto pasa de `var(--accent-ink)` (ahora blanco, ver tabla de paleta) sin necesitar cambio adicional en la regla, porque el token ya se actualiza.
- **`.btn-accent:hover`** (línea 234, `background: #d4ff66;` hardcodeado — no capturado por el grep de `rgba(198,255,61,*)` de arriba, es un hex plano): pasa a `background: linear-gradient(-45deg, var(--accent), var(--accent-bright));` — mantiene la misma lógica de "hover más brillante que el reposo" del original, ahora con el verde esmeralda/menta reales.
- **`.progress-fill`**, `.nav-item.active::before`, `.stat-card::before`: sin cambios — ya usan `var(--accent)`/`var(--accent-dim)`, heredan el nuevo verde automáticamente.
- **Lista completa y cerrada de `rgba(198, 255, 61, *)` (chartreuse) hardcodeado a reemplazar por `rgba(16, 185, 129, *)` (`--accent`) o `rgba(69, 252, 156, *)` (`--accent-bright`) según el efecto** (verificado por grep sobre `styles.css`, son 9 ocurrencias en total, ninguna más en el archivo):
  - Línea 74 — `.ozono-atmosphere::before`, blob principal → `--accent`.
  - Línea 322 — `.kanban-col.drag-over` → `--accent`.
  - Línea 456 — `.cal-cell.drag-over` → `--accent`.
  - Línea 477 — `.logo-mark` (drop-shadow) → `--accent-bright`.
  - Líneas 479-480 — `@keyframes logoPulse` (2 ocurrencias) → `--accent-bright`.
  - Líneas 505-507 — `@keyframes approvePulse` (3 ocurrencias) → `--accent`.

## Fuera de alcance (explícito)

- No se toca ningún archivo `.jsx` (`app.jsx`, `components.jsx`, `views.jsx`, `icons.jsx`) — cero riesgo de interferir con la reconciliación pendiente del `RECONCILIACION_BLUEPRINT.md`.
- No se toca `Super_Ozono_Backend/Code.gs` ni `Control_Retos_Y_KPIs/` — sin relación con este spec.
- No se toca el `index.html` de producción (4MB) — el rebrand vive solo en `styles.css` + `logo.js`, visible a través de `index.dev.html`.
- No se cambian los colores de estado funcional (`--coral`, `--sky`, `--violet`, `--amber`, `--danger`, `--mint`) ni el layout/estructura de ningún componente.

## Verificación

Abrir `Suite_Operativa_Frontend/index.dev.html` en un navegador después de aplicar los cambios y confirmar visualmente:
1. Fondo casi negro-verdoso (no el negro puro anterior, ligero tinte distinto).
2. Acentos (botón activo del nav, botón "Iniciar sesión", barra de progreso) en verde esmeralda `#10b981`, no chartreuse.
3. Logo del sidebar/login muestra el personaje mascota en tono esmeralda apagado (no el chartreuse brillante anterior).
4. Texto en botones de acento es blanco, legible sobre el verde.
5. Sin errores de consola nuevos respecto a la carga base ya verificada en el Paso 0 del blueprint.

## Nota sobre control de versiones

`PROYECTOS/src` no es un repositorio git (confirmado al iniciar este trabajo) — no aplica el paso de "commit del spec" del proceso estándar de brainstorming. Este archivo es la única fuente de verdad versionada informalmente junto a `PENDIENTES.md` y `RECONCILIACION_BLUEPRINT.md`.
