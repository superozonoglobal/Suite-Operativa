# Pendientes — PROYECTOS/src

Estado al 2026-07-28 (tarde/noche). Dos sistemas en este repo, tratados por separado más abajo.

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

### Qué ya funciona
Los 12 módulos de referencia (capturas en `Desktop/modulo de inicio/`) tienen una
ruta real, con datos de verdad en Postgres (no mockeados): Dashboard, Mi Tablero,
Metas, Calendario Editorial, Requisiciones, Proyectos, Mensajes, Analítica,
Automatizaciones, Informes, Equipo, Configuración. Login/registro con email y
contraseña, rol elegido en el registro. 67 tests automáticos, todos en verde.
Corre local en `http://localhost:3000` (`cd web && npm run dev`).

### Pendiente
- [ ] **Probar la app entera a mano en el navegador** (registrarse → entrar →
      recorrer los 12 módulos). Esta sesión solo corrió build/typecheck/tests
      automáticos, nunca un click-through real completo.
- [ ] **Desplegar a producción** (Fase 7 del plan): el usuario ya tiene creado el
      repo de GitHub (`github.com/superozonoglobal/Suite-Operativa`) y el equipo
      de Vercel (`robinsons-projects-27c1b844`) — falta: importar el proyecto en
      Vercel, crear la base en Neon, y cargar las variables de entorno reales
      (`AUTH_SECRET`, `DATABASE_URL` con el connection string *pooled* de Neon,
      `SEED_SUPERUSER_EMAIL`, `ALLOWED_EMAIL_DOMAIN`) — detalle en ADR-0005 y
      Task 7-2 del plan.
- [ ] **Pasada de revisión de código** (Fase 5-6 de Hydraia, "double review"):
      todavía no se corrió — vale la pena hacerla antes o durante el despliegue,
      no después de cada tarea individual.
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

## Retomar mañana
1. Leer este archivo y `docs/hydraia/runs/2026-07-28-1200-suite-operativa-nextjs.md`
   (bitácora completa, orden cronológico de todo lo que se hizo).
2. Si el objetivo es seguir con Suite Operativa nueva: click-through manual en el
   navegador primero, después Fase 7 (despliegue).
3. Si el objetivo es la seguridad de `Control_Retos_Y_KPIs`: ir directo a
   `RECONCILIACION_BLUEPRINT.md`, sección de remediación.
