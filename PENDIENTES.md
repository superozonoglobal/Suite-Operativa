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
- [x] **Pasada de revisión de código** (Fase 5 de Hydraia): corrida el
      2026-07-29 con 7 agentes en paralelo. Reporte completo en
      `docs/hydraia/reviews/2026-07-29-phase5-code-review.md`.
- [x] **Corregir los 4 hallazgos CRÍTICOS** (2026-07-29, mismo día, con TDD):
      auto-escalación de privilegios, fuga de passwordHash, falta de
      transacciones (condición de carrera al aceptar una requisición dos
      veces), y cero índices en la base de datos. Los 4 arreglados y
      verificados — 73/73 tests, typecheck y build limpios. Detalle de cada
      fix en el reporte de revisión (sección "FIXED").
- [~] **13 hallazgos HIGH — EN CURSO (2026-07-29, misma sesión que los 4
      críticos).** El usuario pidió arreglar los 13, con TDD, uno por uno, en
      el orden del reporte (`docs/hydraia/reviews/2026-07-29-phase5-code-review.md`,
      sección HIGH). **Metodología: para cada uno, escribir primero un test que
      falle (RED), confirmarlo corriendo `npx vitest run <archivo>`, implementar
      el fix mínimo, confirmar GREEN, correr `npx tsc --noEmit` y la suite
      completa (`npx vitest run`), y recién ahí pasar al siguiente.** No hacer
      commit hasta terminar todos (o hasta que el usuario lo pida) — reusar el
      mismo patrón de commit que los críticos (ver `git log` commit
      `5118d2f` como ejemplo de mensaje).

  Estado exacto por ítem (actualizar esta lista a medida que se avanza,
  marcando `[x]` y agregando una línea de qué se hizo, igual que abajo):

  - [x] **H4 (fix register account-takeover)** — hecho. Nueva clase
        `RequiresAdminSetupError` en `web/lib/services/register.ts`: si
        `existing.level` es `SUPERUSER` o `PROJECT_MANAGER`, rechaza el
        self-claim (antes de eso solo bloqueaba con contraseña ya puesta).
        Cableado en `web/lib/actions/register.ts` (nuevo redirect
        `?error=requires-admin-setup`) y `web/app/(auth)/register/page.tsx`
        (nuevo mensaje). 2 tests nuevos en
        `web/tests/integration/services/register.test.ts`. Nota: el "bootstrap
        race" de `SEED_SUPERUSER_EMAIL` (quien registre ese email primero en
        prod gana SUPERUSER) es una limitación de diseño de ADR-0009, no se
        arregló con código — mitigación real es operativa (registrar esa
        cuenta apenas se despliegue, antes de avisarle al equipo la URL).

  - [x] **H1 (invalidar sesión de usuario borrado)** — hecho. Extraje la
        lógica del callback `jwt` a una función pura testeable:
        `web/lib/auth/resolveJwtToken.ts` (nuevo archivo) — si `dbUser` es
        `null`, devuelve `null` (Auth.js invalida la sesión), si no,
        actualiza `level`/`roleTag`. `web/lib/auth.ts` ahora la usa. También
        agregué `maxAge: 12 * 60 * 60` (12h) a `session: { strategy: "jwt" }`
        en el mismo archivo (antes no tenía límite, default de Auth.js es 30
        días). Tests nuevos en
        `web/tests/unit/lib/resolveJwtToken.test.ts`.

  - [x] **H9 (proxy.ts no protege nada)** — hecho. Agregué
        `callbacks.authorized` a `web/lib/auth.ts`, delegando a una función
        pura testeable `web/lib/auth/isAuthorized.ts` (`!!auth?.user`).
        Agregué `pages: { signIn: "/signin" }` al mismo config de NextAuth —
        sin esto, el redirect del `authorized` callback cuando devuelve
        `false` iba a `/api/auth/signin` (la página genérica de Auth.js) en
        vez de la página custom de la app. `web/proxy.ts` no se tocó, su
        `matcher` ya excluía `signin`/`register`/`api/auth`/estáticos.
        `web/app/page.tsx` ahora es un `redirect("/dashboard")` en vez del
        scaffold de create-next-app. Verificado con `npm run build` (sigue
        apareciendo `ƒ Proxy (Middleware)` en la salida) — no se escribió
        test automatizado para el proxy en sí (es middleware, difícil de
        testear sin mockear todo Next.js), pero sí para `isAuthorized`
        (`web/tests/unit/lib/isAuthorized.test.ts`).

  - [x] **H2 (allowlist de Configuración nunca se lee)** — hecho.
        `web/lib/authAllowList.ts`: `isEmailAllowed` ahora es `async` y,
        además de los env vars, consulta `getOrgSettings()`
        (`web/lib/services/orgSettings.ts`) — permite si coincide con
        `OrgSettings.allowedEmailDomain` O está en `OrgSettings.allowedEmails`
        (case-insensitive). Actualizados los 2 call sites: `lib/auth.ts`
        (`signIn` callback, ya era async, sin cambios de firma) y
        `lib/services/register.ts` (agregado `await` — antes
        `if (!isEmailAllowed(email))` evaluaba `!Promise` que siempre es
        `false`, hubiera sido un bug si no se agregaba el `await`). Tests
        nuevos en `web/tests/unit/lib/authAllowList.test.ts` (ahora
        integration-style, usa la DB real vía `prisma.orgSettings`).

  - [x] **H5 (rate limiting + timing oracle en login)** — hecho. Extraje
        `authorize` a `web/lib/auth/authorizeCredentials.ts`: el timing
        oracle se cerró comparando SIEMPRE con bcrypt (contra un
        `DUMMY_HASH` precalculado con `bcrypt.hashSync` si no hay usuario o
        no tiene `passwordHash`, en vez de hacer `return null` antes de
        llamar a `bcrypt.compare`). Rate limiting: `web/lib/rateLimit.ts`,
        clase `RateLimiter` genérica (in-memory, Map por key) + instancia
        compartida `loginRateLimiter` (5 intentos / 60s por email). **Nota
        documentada en el propio código**: en Vercel serverless esto es
        mitigación best-effort, no garantía dura (cada instancia/cold start
        tiene su propio Map) — no se instaló Upstash/Redis sin preguntarle
        antes al usuario. Tests en `web/tests/unit/lib/rateLimit.test.ts` y
        `web/tests/integration/services/authorizeCredentials.test.ts`.

  Progreso commiteado y pusheado a `main` en 2 commits:
  `e7f868c` (H1+H4) y `955399b` (H9+H2+H5). 93/93 tests, typecheck y build
  limpios a esta altura.

  - [x] **H6 (migración RoleTag DIRECTOR→DEVELOPER frágil) — decisión: NO
        tocar código, solo documentar.** Editar una migración de Prisma ya
        aplicada (`prisma/migrations/20260728214531_.../migration.sql`)
        cambia su checksum y rompe `prisma migrate deploy`/`dev` para
        cualquiera que ya la tenga aplicada (hace falta `prisma migrate
        resolve` a mano) — es una operación de más riesgo que el bug que
        arregla. Además el riesgo real es bajo para ESTE despliegue: Suite
        Operativa arranca con una base Neon nueva y vacía (ADR-0006, sin
        importar datos viejos), así que cuando `prisma migrate deploy` corra
        todas las migraciones en orden sobre una DB vacía, no puede haber
        ninguna fila con `roleTag='DIRECTOR'` en el momento en que esa
        migración se ejecuta — el escenario de fallo real es solo restaurar
        un backup viejo (de antes de esta migración) en una base nueva.
        Queda documentado como riesgo conocido en el reporte de revisión y
        acá: **si alguna vez se restaura un backup anterior al 2026-07-28
        tarde, correr a mano
        `UPDATE "User" SET "roleTag"='DEVELOPER' WHERE "roleTag"='DIRECTOR';
        UPDATE "Task" SET "roleTag"='DEVELOPER' WHERE "roleTag"='DIRECTOR';`
        ANTES de aplicar las migraciones sobre esa base.** No se tocó ningún
        archivo.

  - [x] **H7 (`PATCH /api/tasks/[id]` 500 con `assigneeId`)** — investigado
        con un test de ruta nuevo (primer test de ruta en el repo,
        `web/tests/integration/api/tasks-patch.test.ts`, mockeando
        `@/lib/auth` con `vi.mock`). **El 500 reportado NO se reproduce**:
        Prisma 7 acepta `assigneeId` como escalar en runtime aunque el tipo
        TS anotado fuera `Prisma.TaskUpdateInput` (que no lo declara) — el
        test pasó en verde de entrada. Igual corregí el tipo a
        `Prisma.TaskUncheckedUpdateInput` en
        `web/app/api/tasks/[id]/route.ts` (es el tipo correcto para lo que
        realmente se construye) y dejé el test como guarda de regresión.

  - [x] **H8 (`npm run lint` en rojo)** — hecho.
        `web/components/layout/NotificationBell.tsx`: moví el fetch a una
        función async declarada dentro del efecto, con flag `active` (evita
        `setState` tras unmount) y `try/catch` (evita unhandled rejection
        cada 30s si falla el fetch). `npm run lint` ahora sale con exit code
        0 (queda 1 warning preexistente en `InformesView.tsx`, no es error,
        no bloquea — es un hallazgo MEDIUM distinto, no tocado).

  - [x] **H13 (Prisma leakea errores crudos)** — hecho. Nuevo
        `web/lib/errors.ts` (`AppError`, `ForbiddenError`, `ConflictError`) y
        `web/lib/api/errorResponse.ts` (helper compartido: si el error es un
        `AppError` devuelve su mensaje+status tal cual, si no, `console.error`
        + 500 genérico "Internal server error", nunca el mensaje crudo).
        Aplicado en las 5 rutas que tenían el patrón
        `err instanceof Error ? err.message : "Forbidden"`:
        `app/api/automations/route.ts`, `app/api/config/route.ts`,
        `app/api/projects/route.ts`, `app/api/requisitions/[id]/route.ts`,
        `app/api/users/[id]/route.ts`. Los servicios correspondientes
        (`users.ts`, `automations.ts`, `orgSettings.ts`, `projects.ts`,
        `requisitions.ts`) ahora lanzan `ForbiddenError`/`ConflictError` en
        vez de `Error` plano. Test nuevo
        `web/tests/integration/api/users-patch.test.ts` prueba que un PATCH
        a un usuario inexistente da 500 genérico (no el mensaje de Prisma) y
        que un 403 real de autorización sigue siendo legible.

  Progreso commiteado y pusheado a `main` en 5 commits en total:
  `e7f868c` (H1+H4), `955399b` (H9+H2+H5), `e608435` (H6 doc+H7+H8),
  `928715c` (H13). 96/96 tests, typecheck, lint y build limpios a esta
  altura. **Quedan 3 hallazgos HIGH**: H3+H11 (el más grande, IDOR — ver
  abajo), H10 (construir UI crear Proyecto/Producto/Tarea), H12 (flujo de
  aprobación de Metas).

  - [ ] **H3 + H11 (IDOR en metas/automatizaciones/tareas) — SIGUIENTE PASO,
        empezar por acá.** El más grande de los que quedan. Archivos:
        `web/lib/services/goals.ts`
        (`updateGoalProgress`, `toggleChecklistItem` — sin chequeo de dueño),
        `web/lib/services/automations.ts` (`setAutomationEnabled` — sin
        chequeo de nivel, a diferencia de `createAutomation` que sí lo
        tiene), `web/app/api/tasks/[id]/route.ts` (PATCH sin chequeo de
        ownership/nivel). Plan: cada una de estas funciones debe recibir el
        `actingUser` (igual que `updateUserRole` ya lo hace) y validar: para
        `updateGoalProgress`/`toggleChecklistItem`, que el goal sea del
        propio usuario (`Goal.userId === actingUser.id`) O que el actor sea
        LIDER+; para `setAutomationEnabled`, que el actor sea LIDER+ (mismo
        gate que `createAutomation`); para el PATCH de tareas, que el actor
        sea el `assignee`, el `createdBy`, o LIDER+. Escribir un test por
        función que falle hoy (un COLABORADOR ajeno a la meta/tarea puede
        editarla) antes de tocar código.

  - [x] **H3 + H11 (IDOR en metas/automatizaciones/tareas)** — hecho.
        Nuevo `web/lib/authz.ts` compartido (`LEVEL_RANK`, `isAtLeastLevel`),
        refactorizado `users.ts` para usarlo. `goals.ts`:
        `updateGoalProgress`/`toggleChecklistItem` ahora exigen ser dueño de
        la meta (`goal.userId`) o LIDER+. `automations.ts`:
        `setAutomationEnabled` ahora exige LIDER+ (igual que
        `createAutomation`). `tasks.ts`: nueva `assertCanEditTask`
        compartida por `updateTaskStatus` y la función nueva
        `updateTaskFields` (extraída de la rama inline de la ruta) — exige
        ser `assignee`, `createdBy`, o LIDER+. Las 4 rutas afectadas
        (`goals/[id]`, `goals/checklist-items/[itemId]`, `automations/[id]`,
        `tasks/[id]`) ahora buscan el usuario actuante completo y lo pasan.
        106/106 tests (9 nuevos). Commit `e582a97`.

  Progreso commiteado y pusheado a `main` en 6 commits en total ahora:
  `e7f868c`, `955399b`, `e608435`, `928715c`, `f2fc8dd` (doc), `e582a97`.
  106/106 tests, typecheck, lint y build limpios. **Quedan 2 hallazgos HIGH,
  los dos de construir UI nueva (confirmado con el usuario que se hacen en
  esta pasada): H10 y H12.**

  - [ ] **H10 (construir UI para crear Proyecto/Producto/Tarea) —
        SIGUIENTE PASO, empezar por acá.** el
        usuario confirmó que SÍ quiere esto en esta pasada (no es solo
        seguridad, es una pantalla nueva). `POST /api/projects` y
        `/api/tasks` ya existen y funcionan (tienen tests de servicio) pero
        ningún componente los llama. `createProduct` en
        `web/lib/services/projects.ts` no tiene ni siquiera route handler
        (crear `web/app/api/products/route.ts`, mismo patrón que
        `web/app/api/projects/route.ts`). Plan: agregar un formulario/modal
        simple en `web/app/(app)/proyectos/page.tsx` (hoy es solo lectura)
        con un botón "Nuevo proyecto" que haga POST a `/api/projects`, y
        dentro de cada proyecto un botón "Nuevo producto"/"Nueva tarea".
        Revisar `web/components/requisiciones/RequisitionsView.tsx` como
        ejemplo de un formulario ya existente en este repo (modal simple con
        `useState` + `fetch`) para mantener el mismo estilo visual y patrón
        de código. IMPORTANTE: seguir el hallazgo MEDIUM del reporte y SÍ
        chequear `res.ok` antes de cerrar el formulario (no repetir el
        patrón roto que tienen los demás componentes).

  - [ ] **H12 (flujo de aprobación de Metas, hoy 0% siempre)** — ninguna
        pantalla pone `Goal.status = "APROBADA"`. Plan: agregar un botón
        "Aprobar" en `web/components/metas/GoalCard.tsx` (visible solo para
        LIDER+, mismo patrón de `canEdit` que ya usan otros componentes) que
        haga PATCH a `/api/goals/[id]` con `{ status: "APROBADA" }` — revisar
        si la ruta y el servicio (`web/lib/services/goals.ts`,
        `web/app/api/goals/[id]/route.ts`) ya aceptan cambiar `status` o si
        hay que agregarlo al schema de validación
        (`web/lib/validation/goal.ts`) y al servicio. Testear con un test de
        servicio que cree una meta, la apruebe, y verifique que
        `lib/services/analytics.ts` (`goalsCompletionAvg`) ahora sí cuenta
        algo distinto de 0.

  Después de cada ítem: correr `npx tsc --noEmit` y `npx vitest run`
  completos (no solo el archivo tocado) antes de pasar al siguiente, y
  actualizar el checkbox de este archivo (`[ ]` → `[x]`) con una línea de
  resumen igual a las de arriba, para que el progreso sea visible aunque se
  corte la sesión a mitad de camino.
- [ ] **Probar la app entera a mano en el navegador** (registrarse → entrar →
      recorrer los 12 módulos). Nunca se hizo un click-through real completo.
      Recomendado hacerlo después de cerrar al menos los HIGH de autorización
      (H3/H11, IDOR) ya que el gate de acceso ahora es sólido pero varias
      mutaciones siguen sin chequeo de rol en el servidor.
- [ ] **Desplegar a producción** (Fase 7 del plan): el usuario ya tiene creado el
      repo de GitHub (`github.com/superozonoglobal/Suite-Operativa`) y el equipo
      de Vercel (`robinsons-projects-27c1b844`) — falta: importar el proyecto en
      Vercel, crear la base en Neon, y cargar las variables de entorno reales
      (`AUTH_SECRET`, `DATABASE_URL` con el connection string *pooled* de Neon,
      `SEED_SUPERUSER_EMAIL`, `ALLOWED_EMAIL_DOMAIN`) — detalle en ADR-0005 y
      Task 7-2 del plan. **Recomendado cerrar al menos los HIGH de seguridad
      restantes antes del deploy** (allowlist inerte, rate limiting, sesión de
      usuario borrado, migración frágil).
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
