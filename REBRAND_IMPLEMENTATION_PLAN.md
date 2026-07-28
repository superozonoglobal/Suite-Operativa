# Rebrand Emerald de Suite Operativa Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la identidad visual chartreuse/Fraunces de `Suite_Operativa_Frontend` por la paleta esmeralda y el logo real de `superozonoglobal.com`, tocando solo `styles.css` y `logo.js`, verificado en `index.dev.html`.

**Architecture:** Cambio de tokens CSS en `:root` (mismo sistema de variables existente, solo valores nuevos + un token nuevo `--accent-bright`), barrido de los ~11 valores de color hardcodeados que no pasan por variables, y reemplazo del asset de logo en `logo.js` por el PNG real de la empresa. Cero cambios estructurales o de layout.

**Tech Stack:** CSS plano con custom properties (sin preprocesador, sin build). Node disponible vía `node -e` para el paso de conversión de imagen a base64.

## Global Constraints

- **No hay repositorio git en `PROYECTOS/src`** (confirmado: `git rev-parse --is-inside-work-tree` falla). Ningún paso de este plan incluye `git commit` — los cambios se guardan directo a disco y se verifican con grep/scripts, no con un VCS.
- Alcance cerrado a `Suite_Operativa_Frontend/styles.css` y `Suite_Operativa_Frontend/logo.js`. No tocar ningún `.jsx`, ni `Super_Ozono_Backend/`, ni `Control_Retos_Y_KPIs/`, ni `Suite_Operativa_Frontend/index.html` (el bundle de 4MB en producción).
- Al terminar, un grep de `c6ff3d|8fb82c|d4ff66|198, 255, 61|Fraunces` sobre `styles.css` debe devolver **cero resultados** (ver Task 5).
- Spec de referencia: `PROYECTOS/src/REBRAND_DESIGN.md`. Blueprint de reconciliación (no afectado por este plan): `PROYECTOS/src/RECONCILIACION_BLUEPRINT.md`.

---

### Task 1: Reemplazar el asset del logo por el real de la marca

**Files:**
- Modify: `Suite_Operativa_Frontend/logo.js` (reescritura completa, archivo de una sola línea)

**Interfaces:**
- Consumes: nada de otras tasks.
- Produces: el global `OZONO_LOGO_DATA_URI` (mismo nombre que ya consumen `components.jsx` y `reports.js` — no cambia, solo cambia el valor del data URI).

- [ ] **Step 1: Descargar el logo real de la empresa**

Run:
```bash
curl -sL "https://www.superozonoglobal.com/images/logo_ozono.png" -o "/tmp/superozono_logo_real.png" -w "http_code=%{http_code} size=%{size_download}\n"
```
Expected: `http_code=200 size=87764`

- [ ] **Step 2: Generar `logo.js` con el mismo formato exacto que el archivo original**

El archivo original es una sola línea: `const OZONO_LOGO_DATA_URI = "data:image/png;base64,...";` seguida de un salto de línea final, sin ningún wrapper adicional (no es un IIFE como `data.js`/`reports.js`).

Run:
```bash
node -e '
const fs = require("fs");
const buf = fs.readFileSync("/tmp/superozono_logo_real.png");
const b64 = buf.toString("base64");
const out = "const OZONO_LOGO_DATA_URI = \"data:image/png;base64," + b64 + "\";\n";
fs.writeFileSync("Suite_Operativa_Frontend/logo.js", out);
console.log("written, bytes:", out.length);
'
```
(Ejecutar desde `PROYECTOS/src`, o ajustar la ruta de salida a la ruta absoluta de `Suite_Operativa_Frontend/logo.js`.)

- [ ] **Step 3: Verificar estructura e integridad del PNG embebido**

Run:
```bash
node -e '
const fs = require("fs");
const c = fs.readFileSync("Suite_Operativa_Frontend/logo.js", "utf8");
if (!c.startsWith("const OZONO_LOGO_DATA_URI = \"data:image/png;base64,")) throw new Error("prefix mismatch");
if (!c.trim().endsWith("\";")) throw new Error("suffix mismatch");
const b64 = c.match(/base64,([^"]+)"/)[1];
const buf = Buffer.from(b64, "base64");
if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) throw new Error("not a valid PNG (magic bytes mismatch)");
console.log("OK — PNG váido, bytes:", buf.length);
'
```
Expected: `OK — PNG váido, bytes: 87764`

---

### Task 2: Paleta, tipografía y comentario de dirección estética (`:root` + encabezado)

**Files:**
- Modify: `Suite_Operativa_Frontend/styles.css:1-42`

**Interfaces:**
- Consumes: nada de otras tasks.
- Produces: tokens `--bg`, `--bg-elevated`, `--surface`, `--surface-hover`, `--border`, `--border-soft`, `--accent`, `--accent-dim`, `--accent-bright` (nuevo), `--accent-ink`, `--text`, `--text-muted`, `--text-faint`, `--font-display` — consumidos por Task 3 y Task 4 vía `var(...)`, y por el resto de `styles.css` que ya los referenciaba sin cambios.

- [ ] **Step 1: Actualizar el comentario de dirección estética (líneas 1-7)**

old_string:
```css
/* =========================================================================
   SUPER OZONO — Identidad visual
   Dirección estética: "capa atmosférica nocturna" — negro verdoso profundo,
   acento chartreuse eléctrico (ozono), tipografía editorial (Fraunces) +
   técnica (IBM Plex Sans / Space Mono) para una herramienta operativa que
   no se siente genérica.
   ========================================================================= */
```

new_string:
```css
/* =========================================================================
   SUPER OZONO — Identidad visual
   Dirección estética: alineada a la marca real (superozonoglobal.com) —
   negro verdoso profundo, acento verde esmeralda/menta (#10b981/#45fc9c),
   tipografía sans (Plus Jakarta Sans / IBM Plex Sans / Space Mono).
   Ver PROYECTOS/src/REBRAND_DESIGN.md para el detalle de la decisión.
   ========================================================================= */
```

- [ ] **Step 2: Actualizar el `@import` de Google Fonts (línea 9) — sacar Fraunces, meter Plus Jakarta Sans**

old_string:
```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Poppins:wght@400;900&display=swap');
```

new_string:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Poppins:wght@400;900&display=swap');
```

- [ ] **Step 3: Reemplazar el bloque `:root` completo (líneas 11-42)**

old_string:
```css
:root {
  --bg: #0a0d08;
  --bg-elevated: #11150d;
  --surface: #171c12;
  --surface-hover: #1e2417;
  --border: #262e1c;
  --border-soft: #1c2215;

  --accent: #c6ff3d;
  --accent-dim: #8fb82c;
  --accent-ink: #10150a;
  --coral: #ff5c3d;
  --sky: #5cc9ff;
  --violet: #c77dff;
  --amber: #ffd166;
  --danger: #ff5c5c;
  --mint: #8fe0a8;

  --text: #f2f4e8;
  --text-muted: #9aa08c;
  --text-faint: #656e54;

  --font-display: 'Fraunces', serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'Space Mono', monospace;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --shadow-card: 0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 8px 24px -12px rgba(0, 0, 0, 0.6);
  --shadow-pop: 0 24px 64px -20px rgba(0, 0, 0, 0.75);
}
```

new_string:
```css
:root {
  --bg: #020d06;
  --bg-elevated: #071409;
  --surface: #0c1c11;
  --surface-hover: #12271a;
  --border: #1d3524;
  --border-soft: #17291d;

  --accent: #10b981;
  --accent-dim: #037a3a;
  --accent-bright: #45fc9c;
  --accent-ink: #ffffff;
  --coral: #ff5c3d;
  --sky: #5cc9ff;
  --violet: #c77dff;
  --amber: #ffd166;
  --danger: #ff5c5c;
  --mint: #8fe0a8;

  --text: #eef7f1;
  --text-muted: #8fae9c;
  --text-faint: #5c7568;

  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'Space Mono', monospace;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --shadow-card: 0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 8px 24px -12px rgba(0, 0, 0, 0.6);
  --shadow-pop: 0 24px 64px -20px rgba(0, 0, 0, 0.75);
}
```

- [ ] **Step 4: Verificar que los tokens quedaron aplicados**

Run:
```bash
grep -n "\-\-accent:\|\-\-accent-bright:\|\-\-bg:\|\-\-font-display:" Suite_Operativa_Frontend/styles.css
```
Expected (4 líneas, en este orden de aparición):
```
12:  --bg: #020d06;
19:  --accent: #10b981;
21:  --accent-bright: #45fc9c;
36:  --font-display: 'Plus Jakarta Sans', sans-serif;
```
(Los números de línea pueden variar ±1 por el step anterior; lo que importa es que los 4 valores aparezcan.)

---

### Task 3: Reemplazar las 9 ocurrencias hardcodeadas de `rgba(198, 255, 61, *)`

**Files:**
- Modify: `Suite_Operativa_Frontend/styles.css` (9 ediciones puntuales, líneas 74, 322, 456, 477, 479, 480, 505, 506, 507 del archivo original — los números se corren tras el Task 2, ubicar por contenido, no por número de línea)

**Interfaces:**
- Consumes: ninguno directo (son literales `rgba()`, no `var()` — por eso hay que tocarlos uno por uno). El mapeo de color usa los mismos valores decimales que `--accent` (`16, 185, 129`) y `--accent-bright` (`69, 252, 156`) producidos en Task 2, pero se escriben como literales `rgba()` porque el `filter: drop-shadow()` y `box-shadow` en los `@keyframes` de este archivo no soportan interpolar `var()` dentro de una función de color en todos los navegadores objetivo del proyecto (mismo patrón que el archivo original, que también usaba literales aquí en vez de `var(--accent)`).
- Produces: nada consumido por tasks posteriores.

- [ ] **Step 1: Blob principal de `.ozono-atmosphere::before` → `--accent`**

old_string:
```css
    radial-gradient(circle at 15% 10%, rgba(198, 255, 61, 0.10), transparent 40%),
```
new_string:
```css
    radial-gradient(circle at 15% 10%, rgba(16, 185, 129, 0.10), transparent 40%),
```

- [ ] **Step 2: `.kanban-col.drag-over` → `--accent`**

old_string:
```css
  background: rgba(198, 255, 61, 0.04);
```
new_string:
```css
  background: rgba(16, 185, 129, 0.04);
```

- [ ] **Step 3: `.cal-cell.drag-over` → `--accent`**

old_string:
```css
.cal-cell.drag-over { background: rgba(198, 255, 61, 0.06); border-color: var(--accent-dim); }
```
new_string:
```css
.cal-cell.drag-over { background: rgba(16, 185, 129, 0.06); border-color: var(--accent-dim); }
```

- [ ] **Step 4: `.logo-mark` → `--accent-bright`**

old_string:
```css
.logo-mark { filter: drop-shadow(0 0 10px rgba(198, 255, 61, 0.25)); }
```
new_string:
```css
.logo-mark { filter: drop-shadow(0 0 10px rgba(69, 252, 156, 0.25)); }
```

- [ ] **Step 5: `@keyframes logoPulse` (2 ocurrencias) → `--accent-bright`**

old_string:
```css
  0%, 100% { filter: drop-shadow(0 0 6px rgba(198, 255, 61, 0.18)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 16px rgba(198, 255, 61, 0.4)); transform: scale(1.035); }
```
new_string:
```css
  0%, 100% { filter: drop-shadow(0 0 6px rgba(69, 252, 156, 0.18)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 16px rgba(69, 252, 156, 0.4)); transform: scale(1.035); }
```

- [ ] **Step 6: `@keyframes approvePulse` (3 ocurrencias) → `--accent`**

old_string:
```css
  0% { box-shadow: 0 0 0 0 rgba(198, 255, 61, 0.55); }
  70% { box-shadow: 0 0 0 14px rgba(198, 255, 61, 0); }
  100% { box-shadow: 0 0 0 0 rgba(198, 255, 61, 0); }
```
new_string:
```css
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
  70% { box-shadow: 0 0 0 14px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
```

- [ ] **Step 7: Verificar que no queda ninguna ocurrencia vieja**

Run:
```bash
grep -c "198, 255, 61" Suite_Operativa_Frontend/styles.css
```
Expected: `0` (o el comando no imprime nada si se usa `grep -q`; con `-c` en Windows/Git Bash imprime `0`).

---

### Task 4: `.btn-accent` (gradiente + hover) y `.avatar` (color de texto)

**Files:**
- Modify: `Suite_Operativa_Frontend/styles.css:229-234` (bloque `.btn-accent`) y `:204` (`.avatar`)

**Interfaces:**
- Consumes: `--accent`, `--accent-dim`, `--accent-bright`, `--accent-ink`, `--bg` (producidos en Task 2).
- Produces: nada consumido por tasks posteriores.

- [ ] **Step 1: `.btn-accent` — de color plano a gradiente diagonal, y hover con `--accent-bright`**

old_string:
```css
.btn-accent {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
}
.btn-accent:hover { background: #d4ff66; }
```
new_string:
```css
.btn-accent {
  background: linear-gradient(-45deg, var(--accent-dim), #00a050);
  color: var(--accent-ink);
  border-color: var(--accent);
}
.btn-accent:hover { background: linear-gradient(-45deg, var(--accent), var(--accent-bright)); }
```

- [ ] **Step 2: `.avatar` — texto oscuro fijo pasa a seguir `var(--bg)`**

old_string:
```css
  color: #0a0d08;
```
new_string:
```css
  color: var(--bg);
```

- [ ] **Step 3: Verificar**

Run:
```bash
grep -n "d4ff66\|#0a0d08" Suite_Operativa_Frontend/styles.css
```
Expected: sin salida (0 coincidencias).

---

### Task 5: Verificación final y chequeo visual en el arnés de desarrollo

**Files:** ninguno (solo lectura/verificación)

**Interfaces:**
- Consumes: el `styles.css` y `logo.js` completos de Tasks 1-4.
- Produces: confirmación de que el rebrand quedó completo y sin residuos del tema anterior.

- [ ] **Step 1: Grep de barrido completo — no debe quedar ningún residuo chartreuse/Fraunces**

Run:
```bash
grep -n "c6ff3d\|8fb82c\|d4ff66\|198, 255, 61\|Fraunces" Suite_Operativa_Frontend/styles.css
```
Expected: sin salida (0 coincidencias). Si aparece algo, es un residuo no cubierto por las Tasks 1-4 — anotarlo y arreglarlo antes de continuar.

- [ ] **Step 2: Confirmar que los nuevos tokens y el gradiente del botón están presentes**

Run:
```bash
grep -n "10b981\|45fc9c\|037a3a\|Plus Jakarta Sans" Suite_Operativa_Frontend/styles.css | wc -l
```
Expected: un número mayor a 0 (referencias reales, no memorizar el conteo exacto porque puede variar levemente con formato de línea — lo importante es que no sea `0`).

- [ ] **Step 3: Verificación visual manual en el navegador**

Abrir `Suite_Operativa_Frontend/index.dev.html` (doble clic o arrastrar a Chrome) y confirmar contra el checklist del spec (`REBRAND_DESIGN.md`, sección "Verificación"):
1. Fondo casi negro-verdoso (no negro puro).
2. Acentos (nav activo, botón de login, barra de progreso) en verde esmeralda `#10b981`, no chartreuse.
3. Logo del sidebar/login muestra el personaje mascota en tono esmeralda apagado.
4. Texto en botones de acento es blanco y legible.
5. Sin errores nuevos en la consola del navegador (F12) respecto a lo ya verificado en el Paso 0 del `RECONCILIACION_BLUEPRINT.md`.

Si algo no calza, documentar qué se ve mal (con screenshot si es posible) antes de dar el rebrand por terminado — no hay suite de tests automatizada para esto, la verificación visual manual **es** el criterio de aceptación final.

---

## Self-Review (hecho por quien escribió este plan, 2026-07-28)

**1. Cobertura del spec:** cada fila de la tabla de paleta de `REBRAND_DESIGN.md` está en Task 2 Step 3; tipografía en Task 2 Steps 1-2; logo en Task 1; las 6 filas de "Efectos y componentes clave" del spec están cubiertas: atmósfera/kanban/cal/approve-pulse → Task 3, logo-mark/logo-pulse → Task 3, btn-accent → Task 4, avatar → Task 4 (hallazgo adicional del spec). Sin huecos.

**2. Placeholders:** ninguno — todos los steps tienen contenido literal completo (old_string/new_string exactos, comandos ejecutables con output esperado concreto).

**3. Consistencia de nombres:** `--accent-bright` se define en Task 2 Step 3 y se consume tal cual (mismo nombre) en Task 3 Steps 4-5 y Task 4 Step 1 — verificado sin discrepancias. `OZONO_LOGO_DATA_URI` se mantiene idéntico entre Task 1 y el resto del código (no se renombra).

Plan completo y guardado en `PROYECTOS/src/REBRAND_IMPLEMENTATION_PLAN.md`.
