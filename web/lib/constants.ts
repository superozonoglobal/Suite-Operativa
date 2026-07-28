export const ROLES = [
  { id: "DEVELOPER", name: "Developer", area: "Producto" },
  { id: "VENTAS", name: "Ventas", area: "Comercial" },
  { id: "COPYWRITING", name: "Copywriting", area: "Creativo" },
  { id: "PUBLICISTA", name: "Publicista", area: "Creativo" },
  { id: "DISENADOR", name: "Diseñador", area: "Creativo" },
  { id: "FILMMAKER", name: "Filmmaker", area: "Producción" },
  { id: "EDITOR_VIDEO", name: "Editor de Video", area: "Producción" },
  { id: "COMMUNITY_MANAGER", name: "Community Manager", area: "Social" },
  { id: "TRAFIKER", name: "Trafiker", area: "Pauta" },
  { id: "ECOMMERCE", name: "Encargado de Ecommerce", area: "Comercial" },
] as const;

export const LEVELS = [
  { id: "SUPERUSER", label: "Superusuario" },
  { id: "PROJECT_MANAGER", label: "Project Manager" },
  { id: "LIDER", label: "Líder" },
  { id: "COLABORADOR", label: "Colaborador" },
] as const;

export const STATUS_COLUMNS = [
  { id: "TODO", label: "Por Hacer" },
  { id: "PROGRESS", label: "En Proceso" },
  { id: "REVIEW", label: "En Revisión" },
  { id: "DONE", label: "Aprobado / Listo" },
] as const;

export const PLATFORMS = [
  { id: "INSTAGRAM", label: "Instagram", color: "#E1306C" },
  { id: "TIKTOK", label: "TikTok", color: "#25F4EE" },
  { id: "FACEBOOK", label: "Facebook", color: "#5CC9FF" },
  { id: "LINKEDIN", label: "LinkedIn", color: "#4C9AFF" },
  { id: "X", label: "X", color: "#F2F4E8" },
  { id: "YOUTUBE", label: "YouTube", color: "#FF5C3D" },
] as const;

export const MODULES = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mi-tablero", label: "Mi Tablero" },
  { href: "/metas", label: "Metas" },
  { href: "/calendario", label: "Calendario Editorial" },
  { href: "/requisiciones", label: "Requisiciones" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/mensajes", label: "Mensajes" },
  { href: "/analitica", label: "Analítica" },
  { href: "/automatizaciones", label: "Automatizaciones" },
  { href: "/informes", label: "Informes" },
  { href: "/equipo", label: "Equipo" },
  { href: "/configuracion", label: "Configuración" },
] as const;
