# Blueprint: reconciliación y migración a build real — Suite Operativa Frontend

Generado por `hydraia:code-architect` el 2026-07-28. Contexto completo en `PENDIENTES.md` y `repo-scan-report.html` (mismo folder).

## Corrección importante sobre el hallazgo original

No es solo el módulo de sync el que falta en los archivos sueltos (`Suite_Operativa_Frontend/*.jsx`, `data.js`). Los **5 archivos fuente sueltos son un snapshot anterior completo** del bundle desplegado en `superozono.dgazcarate.online`:

- `data.js` no tiene: `addRole`, `updateRole`, `deleteRole`, `isRoleInUse`, `runOverdueEscalation`, `getTaskTimings`, ni ninguna función de sync (`getApiUrl`, `syncPull`, `syncPush`, `syncUserPassword`, etc.)
- `views.jsx` inline en el bundle tiene ~3252 líneas vs. 2672 en el archivo suelto (+22%)
- `components.jsx`, `icons.jsx`, `app.jsx` también divergen (menor, pero deben auditarse)

**Los archivos sueltos hoy no arrancan en ningún navegador** — no hay `index.html`, `package.json` ni config de build que los referencie. Son código fuente huérfano, no una app ejecutable en paralelo al bundle.

## Orden de trabajo (resumen — detalle completo abajo)

0. **Arnés de desarrollo** (`index.dev.html`): permite abrir los sueltos en un navegador por primera vez. Sin esto no se puede verificar nada interactivamente.
1. **`RECONCILIACION.md`**: tabla función-por-función, qué existe en cada snapshot.
2. **Extraer `sync.js`** del `index.html` (líneas ~2379–2777), probar contra una URL de Apps Script de PRUEBA (nunca la de producción de Diego en este paso).
3. **Reconciliar `data.js`**: agregar funciones faltantes, reexportar `sync.js` bajo el mismo objeto `OZONO`.
4. **Reconciliar `views.jsx`/`app.jsx`/`components.jsx`/`icons.jsx`**: agregar UI faltante (gestión de roles, configuración de backend, escalamiento).
5. **Pasada de humo completa** en `index.dev.html` vs. la app real en producción, mismo usuario de prueba.
6. **Introducir Vite** recién aquí — nunca antes de reconciliar (evita reconciliar dos veces).
7. **Build y despliegue paralelo** en URL de prueba, smoke test contra backend real de Diego, avisando antes, en horario de bajo uso.
8. **Corte a producción** en Hostinger, con el `index.html` viejo respaldado para rollback rápido.
9. **Documentación y smoke tests** como checklist permanente.

## Qué NO tocar

- `Super_Ozono_Backend/Code.gs` — se mantiene igual. `sync.js` se adapta al contrato existente (`doGet`/`doPost`), nunca al revés.
- `Control_Retos_Y_KPIs/` completo (salvo la remediación de seguridad de abajo) — producto separado, no se migra ni se reconcilia con nada de esto.

## Contrato a preservar (crítico)

`syncPush`/`bootstrapPush` **nunca** deben incluir `Password_Salt`/`Password_Hash` — solo `syncUserPassword` puede tocar contraseñas. Si al reconciliar `data.js` se rompe esta separación, un `syncPush` masivo podría sobrescribir la contraseña de otro usuario por accidente.

## Remediación de seguridad — `Control_Retos_Y_KPIs/Code.gs`

Confirmado en código: `SALT = 'CRK_2026_salt_v1'` global (línea 35, sal hardcodeada compartida por todos los usuarios) + usuario `admin`/`admin123` sembrado por `setup()` (línea 106) sin forzar cambio.

1. Mover `SALT` a `PropertiesService.getScriptProperties()`.
2. Migrar a sal por usuario (columna `Password_Salt` por fila, igual patrón que `Super_Ozono_Backend`) — **requiere script de migración de una sola corrida** que regenere hash+sal antes de desplegar, o rompe logins existentes.
3. Reemplazar el seed fijo `admin123` por contraseña aleatoria generada en la primera corrida (mostrada una vez en `Logger.log`) o cuenta `Activo: false` hasta cambio manual.
4. Documentar manejo de contraseñas en un README de `Control_Retos_Y_KPIs` (aún no existe una sección así, a diferencia de `Super_Ozono_Backend/README.md`).

## Archivos citados (rutas absolutas, para retomar sin releer todo)

- `Suite_Operativa_Frontend/data.js` (líneas 401-423 load/save, 866-905 export `OZONO`)
- `Suite_Operativa_Frontend/index.html` (638-1360 vendor libs, 1361-2780 data.js-equivalente+sync, 2701-2778 export `OZONO` completo, 2784-2976 reports.js-equiv, 2977-3030 icons.jsx-equiv, 3031-3297 components.jsx-equiv, 3298-6550 views.jsx-equiv, 6551-6847 app.jsx-equiv)
- `Super_Ozono_Backend/Code.gs` (167-270 login/doGet/doPost)
- `Control_Retos_Y_KPIs/Code.gs` (35, 46-47, 106, 145-170, 258-318)
