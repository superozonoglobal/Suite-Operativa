<div align="center">

# 🟢 Suite Operativa

### Plataforma interna de gestión de Super Ozono

*Reemplaza un sistema legado de Apps Script + Google Sheets por una aplicación full-stack real: Next.js, PostgreSQL y una base de código con cobertura de tests.*

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-114_tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

</div>

<br>

## Qué es esto

**Suite Operativa** es la herramienta interna que usa el equipo de Super Ozono para
gestionar proyectos, tareas, metas, calendario editorial y requisiciones entre
áreas. Reemplaza un sistema anterior construido sobre Apps Script + Google
Sheets como base de datos, que no contaba con un backend real ni con
transacciones, integridad relacional o control de acceso granular.

**Estado**: en producción, desplegado en Vercel con una base de datos
PostgreSQL administrada (Neon). Los 12 módulos de referencia están
construidos y en uso por el equipo.

<br>

## Estado del proyecto

| | |
|---|---|
| **Tests** | 114/114 ✅ · `npm test` |
| **Typecheck** | limpio ✅ · `npx tsc --noEmit` |
| **Lint** | limpio ✅ · `npm run lint` |
| **Build** | limpio ✅ · `npm run build` |
| **Auditoría de seguridad** | 4 hallazgos críticos + 13 altos identificados y corregidos antes del primer despliegue |
| **Despliegue** | ✅ en producción (Vercel + Neon) |

<br>

## Módulos

| Módulo | Qué hace |
|---|---|
| **Dashboard** | Carga de trabajo por miembro, resumen de tareas, tareas retrasadas/bloqueadas |
| **Mi Tablero** | Kanban personal con drag-and-drop (Por Hacer → En Proceso → En Revisión → Aprobado) |
| **Metas** | Metas numéricas, por porcentaje y checklist — personales o de equipo, con flujo de aprobación (Líder+) |
| **Calendario Editorial** | Grilla mensual, arrastrar tareas aprobadas para programar publicaciones |
| **Requisiciones** | Pedir trabajo a otro miembro — aceptar una la convierte en tarea real, de forma atómica |
| **Proyectos** | Crear proyectos/productos/tareas desde la UI, con progreso y equipo calculados en vivo |
| **Mensajes** | Conversaciones directas 1 a 1 |
| **Analítica** | Métricas reales: % a tiempo, tiempo de entrega, tasa de retrabajo, cumplimiento de metas |
| **Automatizaciones** | Reglas "cuando X entonces Y" (el motor de ejecución es un paso futuro) |
| **Informes** | Exportación a PDF con resumen por rol y listado de actividades, con filtros |
| **Equipo** | Roster del equipo, asignación de rol y nivel de permisos |
| **Configuración** | Dominios/emails autorizados para registrarse |

<br>

## Arquitectura

```
Next.js 16 (App Router)
├─ UI                   Server + Client Components
├─ API                  Route Handlers (app/api/**)
├─ Lógica de negocio    lib/services/*  (compartida por UI y API)
├─ Base de datos        PostgreSQL vía Prisma 7 + driver adapter
└─ Auth                 Auth.js v5 — email + contraseña, sesiones JWT
```

**Monolito, no microservicios.** Un solo proceso, un solo deploy — no hay
evidencia de una necesidad de escalado independiente que justifique separar
servicios para un equipo de este tamaño. Cada decisión de arquitectura
relevante quedó documentada como [ADR](docs/adr/) (Architecture Decision
Record): elección de framework y base de datos, alcance de la integración con
Google, modelo de hosting, jerarquía de permisos, e identidad visual.

<br>

## Autenticación y permisos

Registro con **email + contraseña propia** — sin depender de Google ni de
ninguna plataforma externa. Al registrarse, cada persona elige un área/rol
(Ventas, Copywriting, Publicista, Diseñador, Filmmaker, Editor de Video,
Project Manager, Trafiker, Encargado de Ecommerce, Asesor o Developer) —
esta etiqueta es puramente descriptiva y no otorga permisos por sí sola.

Los permisos reales se rigen por una jerarquía de cuatro niveles:
**Superusuario → Project Manager → Líder → Colaborador**. Cada nivel solo
puede otorgar o editar rangos por debajo del propio — nadie puede
auto-promoverse ni modificar a alguien de su mismo rango o superior.

<br>

## Seguridad

Antes del primer despliegue, el proyecto pasó por una auditoría de código
enfocada en seguridad y calidad, cubriendo escalación de privilegios, fuga
del hash de contraseñas, condiciones de carrera al aceptar requisiciones,
autorización faltante en mutaciones (IDOR), y ausencia de rate limiting en
el login. Los 4 hallazgos críticos y los 13 de severidad alta se corrigieron
con TDD: un test que reproduce el problema, la corrección, y el test en
verde. Los hallazgos de severidad media/baja (accesibilidad, paginación,
timestamps sin timezone) quedan abiertos a propósito para una próxima
pasada.

<br>

## Cómo correrlo local

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
npm test                # corre los tests
npx tsc --noEmit         # typecheck
npm run lint             # lint
npm run build            # build de producción
```

<br>

## Calidad

- **114 tests automáticos** (Vitest), todos contra una base de datos real —
  nada mockeado.
- **TDD** en cada módulo y en cada corrección de seguridad: test que falla →
  implementación → test en verde.
- **Build, typecheck y lint limpios** en cada commit de este historial.
- Métricas de Analítica, progreso de Proyectos y el conteo de Informes se
  calculan en vivo desde los datos reales — nada hardcodeado ni simulado.

<br>

## Documentación

Las decisiones de arquitectura relevantes quedan registradas como
[Architecture Decision Records](docs/adr/), en orden cronológico — desde la
elección de framework y base de datos hasta la jerarquía de permisos y la
identidad visual.

<br>

---

<div align="center">

**Super Ozono** · Suite Operativa interna

</div>
