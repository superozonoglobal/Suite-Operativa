<div align="center">

# 🟢 Suite Operativa

### La plataforma interna de gestión de Super Ozono, reconstruida desde cero

*Reemplaza un sistema de Apps Script + Google Sheets por una app real: Next.js, PostgreSQL y una base de código con tests.*

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-109_tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Code Review](https://img.shields.io/badge/Code_Review-passed-2ea44f?style=for-the-badge)](docs/hydraia/reviews/2026-07-29-phase5-code-review.md)

</div>

<br>

## 📋 Qué es esto

**Suite Operativa** es la herramienta interna que usa el equipo de Super Ozono para
gestionar proyectos, tareas, metas, calendario editorial, requisiciones y más.
Este repo contiene la **reescritura completa** del sistema — la versión anterior
corría sobre Apps Script + Google Sheets como base de datos, sin backend real.

> 🎯 **Estado actual: los 12 módulos de referencia están construidos y funcionando
> contra una base de datos PostgreSQL real, con 109 tests automáticos en verde y
> una revisión de código completa (seguridad + calidad) ya corregida.** Falta el
> recorrido manual en navegador y el despliegue a producción — ver [Roadmap](#️-roadmap).

<br>

## 🩺 Estado del proyecto

| | |
|---|---|
| **Tests** | 109/109 ✅ · `npm test` |
| **Typecheck** | limpio ✅ · `npx tsc --noEmit` |
| **Lint** | limpio ✅ · `npm run lint` |
| **Build** | limpio ✅ · `npm run build` |
| **Revisión de seguridad** | 4 críticos + 13 altos encontrados y corregidos — [reporte completo](docs/hydraia/reviews/2026-07-29-phase5-code-review.md) |
| **Recorrido manual en navegador** | ⏳ pendiente |
| **Despliegue a producción** | ⏳ pendiente (Vercel + Neon) |

<br>

## ✨ Módulos

| Módulo | Qué hace |
|---|---|
| 📊 **Dashboard** | Carga de trabajo por miembro, resumen de tareas, tareas retrasadas/bloqueadas |
| 🗂️ **Mi Tablero** | Kanban personal con drag-and-drop (Por Hacer → En Proceso → En Revisión → Aprobado) |
| 🎯 **Metas** | Metas numéricas, por porcentaje y checklist — personales o de equipo, con flujo de aprobación (Líder+) |
| 🗓️ **Calendario Editorial** | Grilla mensual, arrastrar tareas aprobadas para programar publicaciones |
| 📨 **Requisiciones** | Pedir trabajo a otro miembro — aceptar una la convierte en tarea real, de forma atómica |
| 📁 **Proyectos** | Crear proyectos/productos/tareas desde la UI, con progreso y equipo calculados en vivo |
| 💬 **Mensajes** | Conversaciones directas 1 a 1 |
| 📈 **Analítica** | Métricas reales: % a tiempo, tiempo de entrega, tasa de retrabajo, cumplimiento de metas |
| 🛡️ **Automatizaciones** | Reglas "cuando X entonces Y" (guardadas; el motor de ejecución es un paso futuro) |
| 🧾 **Informes** | Exportación a PDF con resumen por rol y listado de actividades, con filtros |
| 👥 **Equipo** | Roster del equipo, asignación de rol y nivel de permisos |
| ⚙️ **Configuración** | Dominios/emails autorizados para registrarse |

<br>

## 🏗️ Arquitectura

```
Next.js 16 (App Router)
├─ UI                  Server + Client Components
├─ API                 Route Handlers (app/api/**)
├─ Lógica de negocio    lib/services/*  (compartida por UI y API)
├─ Base de datos        PostgreSQL vía Prisma 7 + driver adapter
└─ Auth                 Auth.js v5 — email + contraseña, sesiones JWT
```

**Monolito, no microservicios.** Un solo proceso, un solo deploy. Cada decisión de
arquitectura quedó documentada como [ADR](docs/hydraia/adr/) — 10 hasta ahora, desde
la elección de framework hasta por qué se descartó la integración con Google Drive.

<br>

## 🔐 Autenticación

Registro con **email + contraseña propia** — sin depender de Google ni de ninguna
plataforma externa. Al registrarse, cada persona elige su rol (Ventas, Copywriting,
Publicista, Diseñador, Filmmaker, Editor de Video, Community Manager, Trafiker,
Encargado de Ecommerce o Developer).

Jerarquía de permisos: **Superusuario → Project Manager → Líder → Colaborador**.
Cada nivel solo puede otorgar o editar rangos por debajo del propio — nadie puede
auto-promoverse ni tocar a alguien de su mismo rango o superior.

<br>

## 🔒 Seguridad

Antes de desplegar, el repo pasó por una revisión de código con 7 agentes en
paralelo (calidad, TypeScript, React, base de datos, seguridad, fallas silenciosas,
auditoría de producción). Se encontraron y **corrigieron** 4 hallazgos críticos y
13 altos — entre ellos: escalación de privilegios, fuga del hash de contraseñas,
condiciones de carrera al aceptar requisiciones, autorización faltante en varias
mutaciones (IDOR), y falta de rate limiting en el login.

Cada corrección se hizo con **TDD** (test que reproduce el problema → fix → test en
verde) y quedó documentada con el archivo y la línea exacta en el
[reporte de revisión](docs/hydraia/reviews/2026-07-29-phase5-code-review.md).
Los hallazgos de severidad media/baja (accesibilidad, paginación, timestamps sin
timezone) quedan abiertos a propósito para una próxima pasada.

<br>

## 🚀 Cómo correrlo local

```bash
cd web
npm install

# Base de datos (elegí una):
docker compose up -d                    # opción A: con Docker
# o usá un PostgreSQL local ya corriendo  # opción B: sin Docker

npx prisma migrate deploy
npx prisma generate

cp .env.example .env    # completá las variables

npm run dev             # http://localhost:3000
npm test                # corre los 109 tests
npx tsc --noEmit         # typecheck
npm run lint             # lint
npm run build            # build de producción
```

<br>

## 🧪 Calidad

- **109 tests automáticos** (Vitest), todos contra una base de datos real — nada
  mockeado.
- **TDD en cada módulo y en cada corrección de seguridad**: test que falla →
  implementación → test en verde.
- **Build, typecheck y lint limpios** en cada commit de este historial.
- Métricas de Analítica, progreso de Proyectos y el conteo de Informes se calculan
  en vivo desde los datos reales — nada hardcodeado ni simulado.

<br>

## 📚 Documentación del proyecto

Todo el proceso de diseño y decisiones queda registrado en `docs/hydraia/`:

- **[`adr/`](docs/hydraia/adr/)** — 10 Architecture Decision Records, en orden cronológico
- **[`specs/`](docs/hydraia/specs/)** — spec de diseño original
- **[`plans/`](docs/hydraia/plans/)** — plan de implementación detallado
- **[`runs/`](docs/hydraia/runs/)** — bitácora completa de la sesión de construcción
- **[`reviews/`](docs/hydraia/reviews/)** — reporte de revisión de código y seguridad, con cada hallazgo y su corrección
- **[`PENDIENTES.md`](PENDIENTES.md)** — qué falta para seguir

<br>

## 🗺️ Roadmap

- [x] Autenticación y estructura base
- [x] Dashboard, Mi Tablero, Equipo
- [x] Proyectos, Metas, Calendario Editorial
- [x] Mensajes, Requisiciones, Notificaciones
- [x] Analítica, Informes, Automatizaciones, Configuración
- [x] Pasada de revisión de código (7 agentes) — 4 críticos + 13 altos corregidos
- [ ] Recorrido manual completo en navegador
- [ ] Despliegue a producción (Vercel + Neon)
- [ ] Asignar rol Project Manager al primer líder que se registre

<br>

---

<div align="center">

**Super Ozono** · Suite Operativa interna

</div>
