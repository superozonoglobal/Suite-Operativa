# Pendientes — PROYECTOS/src

Estado al 2026-07-29 (noche). Dos sistemas en este repo, tratados por separado más abajo.

## 1. Suite Operativa — reescritura en Next.js (`web/`)

**Reemplaza** el sistema viejo (`Suite_Operativa_Frontend/` + `Super_Ozono_Backend/`,
Apps Script + Google Sheets, en línea hoy en `superozono.dgazcarate.online`). Esos
archivos viejos **no se tocaron** y siguen sirviendo al equipo sin cambios — el
corte a la app nueva es un paso manual, no automático (ver ADR-0006).

**Dónde está la decisión y el detalle de cada paso:**
- `docs/hydraia/adr/0001` a `0010` — todas las decisiones de arquitectura, en orden.
  Las más recientes e importantes: **ADR-0009** (niveles: Superusuario > Project
  Manager > Líder > Colaborador) y **ADR-0010** (se canceló Google/Drive, login es
  solo email+contraseña, el registro pide el rol vos mismo).
- `docs/hydraia/plans/2026-07-28-suite-operativa-nextjs.md` — el plan original,
  con una nota al principio marcando qué partes quedaron superadas por ADR-0010.
- `docs/hydraia/runs/2026-07-28-1200-suite-operativa-nextjs.md` — bitácora completa
  de la sesión, con el checklist de qué se ejecutó y los commits de cada paso.
- `docs/hydraia/reviews/2026-07-29-phase5-code-review.md` — reporte de revisión de
  código (7 agentes en paralelo) con el detalle "FIXED" de cada hallazgo crítico/alto.

### Qué ya funciona
Los 12 módulos de referencia (capturas en `Desktop/modulo de inicio/`) tienen una
ruta real, con datos de verdad en Postgres (no mockeados): Dashboard, Mi Tablero,
Metas, Calendario Editorial, Requisiciones, Proyectos, Mensajes, Analítica,
Automatizaciones, Informes, Equipo, Configuración. Login/registro con email y
contraseña, rol elegido en el registro. Ahora también: crear Proyecto/Producto/Tarea
desde `/proyectos`, y aprobar Metas desde `/metas`. **109/109 tests automáticos, todos
en verde.** Corre local en `http://localhost:3000` (`cd web && npm run dev`).

### Pendiente
- [x] **Pasada de revisión de código** (Fase 5 de Hydraia): corrida el 2026-07-29 con
      7 agentes en paralelo. Reporte completo en
      `docs/hydraia/reviews/2026-07-29-phase5-code-review.md`.
- [x] **Corregir los 4 hallazgos CRÍTICOS** (2026-07-29): auto-escalación de
      privilegios, fuga de passwordHash, falta de transacciones (condición de carrera
      al aceptar una requisición dos veces), y cero índices en la base de datos.
- [x] **Corregir los 13 hallazgos HIGH** (2026-07-29, misma sesión, con TDD uno por
      uno). Resumen de cada uno (detalle completo con archivos exactos en la sección
      "FIXED" de cada ítem en `docs/hydraia/reviews/2026-07-29-phase5-code-review.md`):
      - **H1** — sesión de usuario borrado ahora se invalida (antes seguía válida
        hasta 30 días); se agregó `maxAge` de 12h.
      - **H2** — la allowlist de Configuración ahora sí se lee (`isEmailAllowed`
        consulta `OrgSettings`, antes solo leía env vars).
      - **H3+H11** — IDOR cerrado en metas/automatizaciones/tareas: las mutaciones
        ahora exigen ser dueño/asignado o Líder+, no solo ocultar el botón en la UI.
      - **H4** — no se puede tomar una cuenta SUPERUSER/PROJECT_MANAGER sin
        contraseña vía auto-registro. El "bootstrap race" del email semilla queda
        como riesgo operativo documentado (registrar esa cuenta apenas se despliegue).
      - **H5** — rate limiting (5 intentos/60s por email) + cerrado el timing oracle
        del login.
      - **H6** — investigado, decisión: no tocar la migración ya aplicada (más
        riesgo que beneficio); riesgo real bajo, documentado con el SQL de
        recuperación por si se restaura un backup viejo.
      - **H7** — investigado con el primer test de ruta del repo: el 500 reportado
        no se reproducía en runtime; se corrigió igual el tipo TypeScript.
      - **H8** — `npm run lint` ahora sale limpio (0 errores).
      - **H9** — el proxy ahora sí protege (antes no bloqueaba nada); `/` ya no es
        el scaffold de create-next-app.
      - **H10** — nueva UI para crear Proyecto/Producto/Tarea desde `/proyectos`
        (antes las rutas existían pero nada las llamaba).
      - **H12** — nuevo flujo de aprobación de Metas (botón "Aprobar", Líder+); la
        métrica de Analítica ya no queda structuralmente en 0%.
      - **H13** — las rutas ya no filtran mensajes de error crudos de Prisma.

      **109/109 tests (36 nuevos desde el inicio de esta pasada), `tsc --noEmit`,
      `npm run lint` y `npm run build` limpios.** Todo commiteado y pusheado a
      `main`: commits `e7f868c` → `d1229cf` (11 commits en total para críticos+HIGH).
      Quedan abiertos por elección los hallazgos MEDIUM/LOW del reporte (no pedidos
      en esta pasada) — ver esa sección del reporte si se quiere seguir.

- [x] **Probar la app entera a mano en el navegador** (2026-07-29): registro con
      el email semilla (queda SUPERUSER, confirmado en Equipo), logout/login,
      recorrido de los 12 módulos, y las pantallas nuevas — crear
      Proyecto→Producto→Tarea desde `/proyectos` (aparece en Informes/Analítica),
      aprobar una Meta y confirmar que "Cumplimiento de metas" en Analítica
      reacciona (0%→100% al cargar progreso, ya no queda structuralmente en
      0% como decía H12), y guardar la allowlist de Configuración con reload
      para confirmar que persiste (H2). Sin errores de consola ni pantallas
      rotas. Nota aparte: se encontró y arregló un gap real de deploy no
      documentado — faltaba `prisma generate` en el pipeline de build
      (`postinstall` agregado, commit `93073d7`), sin eso el primer build en
      Vercel rompía.
- [ ] **Desplegar a producción** (Fase 7 del plan): el usuario ya tiene creado el
      repo de GitHub (`github.com/superozonoglobal/Suite-Operativa`) y el equipo
      de Vercel (`robinsons-projects-27c1b844`) — falta: importar el proyecto en
      Vercel, crear la base en Neon, y cargar las variables de entorno reales
      (`AUTH_SECRET`, `DATABASE_URL` con el connection string *pooled* de Neon,
      `SEED_SUPERUSER_EMAIL`, `ALLOWED_EMAIL_DOMAIN`) — detalle en ADR-0005 y
      Task 7-2 del plan. **Registrar la cuenta de `SEED_SUPERUSER_EMAIL` apenas
      esté desplegado, antes de compartir la URL con el equipo** (mitigación del
      bootstrap race documentado en H4). Recomendado además correr una revisión
      de seguridad + base de datos más liviana (no las 7 en paralelo) para
      confirmar antes de este paso, dado que pasó tiempo desde la revisión original.
- [ ] **Asignar el rol Project Manager** a la persona que corresponda (queda
      pendiente a propósito, sin email todavía — se hace desde Equipo una vez
      que esa persona se registre).
- [ ] **Migrar datos históricos**: decisión ya tomada de NO hacerlo (ADR-0006) —
      la app arranca con datos nuevos, no con lo que hay en las Sheets viejas.
      No es un pendiente real, solo aclarado para que no se reabra la pregunta.
- [ ] Cortar oficialmente al equipo de `superozono.dgazcarate.online` a la app
      nueva una vez que esté desplegada y probada — comunicación al equipo, no
      un paso técnico (ADR-0006).

### Ya NO aplica (decisiones revertidas/canceladas)
- ~~Reconciliación de `Suite_Operativa_Frontend/` + migración a Vite~~
  (`RECONCILIACION_BLUEPRINT.md`, más abajo) — era el plan conservador previo a
  decidir la reescritura completa en Next.js. Ese archivo queda como registro
  histórico, no como plan activo.
- ~~Integración con Google Drive / login con Google~~ — cancelado por decisión
  explícita del usuario (ADR-0010), no solo pospuesto.

## 2. Código de Diego — auditoría original (sigue vigente para esta parte)

Contexto completo en `repo-scan-report.html` y `RECONCILIACION_BLUEPRINT.md` (mismo folder).

Diego (azcaratediego@gmail.com) compartió una carpeta de Drive (`dgso/src`) con código. Descargado localmente, auditado con `hydraia:repo-scan` el 2026-07-27, organizado y analizado a fondo (lectura directa + `hydraia:code-architect`) el 2026-07-28.

**Corrección clave sobre la organización original: son 2 sistemas, no 3.** "Módulo 3" (frontend suelto) y "módulo 1" (Super_Ozono_Backend) son el frontend y backend del MISMO sistema (Suite Operativa vieja), conectados vía la URL de Apps Script pegada en Configuración → Backend. Ya organizado en subcarpetas:

1. **`Suite_Operativa_Frontend/` + `Super_Ozono_Backend/`** — el sistema viejo, reemplazado por `web/` (ver sección 1 arriba), pero todavía en línea en `superozono.dgazcarate.online` y sin tocar.
2. **`Control_Retos_Y_KPIs/`** — sistema totalmente aparte y autocontenido (su propio Apps Script + un solo `index.html`), no comparte código ni datos con Suite Operativa.

`_originales_zip/` guarda los 2 .zip originales sin tocar, por si acaso.

### Pendiente (sigue real)
- [ ] **Remediar seguridad en `Control_Retos_Y_KPIs/Code.gs`**: sal global hardcodeada (línea 35) + admin/admin123 sembrado sin forzar cambio (línea 106) — plan de remediación de 4 pasos en `RECONCILIACION_BLUEPRINT.md`. Confirmar primero si ya se cambió la contraseña en producción.

### Ya resuelto
- [x] Organizar la carpeta en subcarpetas por sistema (2026-07-28).
- [x] La referencia a `index 2.html` en comentarios de `Code.gs` resuelta: es el mismo `index.html` (Suite_Operativa_Frontend), rastro de descargas duplicadas en la máquina de Diego, no un archivo faltante.
- [x] Ownership del proyecto: el usuario se encarga directamente de ahora en adelante.

## Retomar (próxima sesión)
1. Leer este archivo y `docs/hydraia/reviews/2026-07-29-phase5-code-review.md`
   (qué se arregló, qué queda MEDIUM/LOW).
2. Si el objetivo es seguir con Suite Operativa nueva: click-through manual en el
   navegador primero, después Fase 7 (despliegue).
3. Si el objetivo es la seguridad de `Control_Retos_Y_KPIs`: ir directo a
   `RECONCILIACION_BLUEPRINT.md`, sección de remediación.
