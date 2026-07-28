# Pendientes — código de Diego (PROYECTOS/src)

Estado al 2026-07-28. Contexto completo en `repo-scan-report.html` y `RECONCILIACION_BLUEPRINT.md` (mismo folder).

## Qué es esto
Diego (azcaratediego@gmail.com) compartió una carpeta de Drive (`dgso/src`) con código. Descargado localmente, auditado con `hydraia:repo-scan` el 2026-07-27, organizado y analizado a fondo (lectura directa + `hydraia:code-architect`) el 2026-07-28.

**Corrección clave sobre la organización original: son 2 sistemas, no 3.** "Módulo 3" (frontend suelto) y "módulo 1" (Super_Ozono_Backend) son el frontend y backend del MISMO sistema (Suite Operativa), conectados vía la URL de Apps Script pegada en Configuración → Backend. Ya organizado en subcarpetas:

1. **`Suite_Operativa_Frontend/` + `Super_Ozono_Backend/`** — un solo sistema, "Suite Operativa", ya en línea en `superozono.dgazcarate.online`. Backend: Apps Script + Google Sheets. Frontend: React sin build.
2. **`Control_Retos_Y_KPIs/`** — sistema totalmente aparte y autocontenido (su propio Apps Script + un solo `index.html`), no comparte código ni datos con Suite Operativa.

`_originales_zip/` guarda los 2 .zip originales sin tocar, por si acaso.

## Hallazgo crítico (ver `RECONCILIACION_BLUEPRINT.md` para el detalle completo)
Los archivos fuente sueltos de `Suite_Operativa_Frontend/` (`app.jsx`, `components.jsx`, `views.jsx`, `icons.jsx`, `data.js`) son un **snapshot anterior e incompleto** del `index.html` de 4 MB realmente desplegado en producción: les faltan todas las funciones de sync (`syncPull`, `syncPush`, etc.) Y funciones de dominio (`addRole`, `updateRole`, `deleteRole`, `runOverdueEscalation`, `getTaskTimings`). Además, hoy **no arrancan en ningún navegador** (no hay `index.html`/`package.json` que los referencie). Cualquier rebuild tiene que reconciliar primero (extraer del bundle lo que falta) y recién después introducir Vite — nunca al revés, o se reconcilia dos veces.

## Pendiente
- [x] Organizar la carpeta en subcarpetas por sistema (2026-07-28).
- [x] Blueprint de reconciliación + migración a Vite generado por `hydraia:code-architect` — ver `RECONCILIACION_BLUEPRINT.md` (2026-07-28).
- [ ] **Ejecutar el blueprint**: Paso 0 (arnés `index.dev.html`) → reconciliación función por función → smoke test vs. producción → recién ahí Vite. **Cambio de ownership (2026-07-28): el usuario se hace cargo de este proyecto de ahora en adelante, Diego no va a trabajar en esto** — sigue siendo prudente avisar antes de probar contra el backend de producción real (afecta al equipo que usa la app hoy), pero ya no hay que confirmar nada con Diego.
- [ ] **Remediar seguridad en `Control_Retos_Y_KPIs/Code.gs`**: sal global hardcodeada (línea 35) + admin/admin123 sembrado sin forzar cambio (línea 106) — plan de remediación de 4 pasos en `RECONCILIACION_BLUEPRINT.md`. Confirmar primero si ya se cambió la contraseña en producción.
- [x] La referencia a `index 2.html` en comentarios de `Code.gs` resuelta: es el mismo `index.html` (Suite_Operativa_Frontend), rastro de descargas duplicadas en la máquina de Diego, no un archivo faltante.
- [x] Ownership del proyecto: el usuario se encarga directamente de ahora en adelante (ya no es "proyecto de Diego" en cuanto a quién decide/ejecuta).

## Retomar
Empezar releyendo `RECONCILIACION_BLUEPRINT.md` (plan de acción concreto) y este archivo. `repo-scan-report.html` tiene el contexto del audit original si hace falta.
