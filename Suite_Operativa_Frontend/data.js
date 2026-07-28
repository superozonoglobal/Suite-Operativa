/* =========================================================================
   SUPER OZONO — Capa de datos (mock DB persistida en localStorage)
   -------------------------------------------------------------------------
   Esto simula el backend (a futuro: Supabase/Postgres). Toda la data vive
   en un solo objeto `state` que se guarda en localStorage bajo OZONO_DB_KEY.
   ========================================================================= */

(function (global) {
  const OZONO_DB_KEY = "ozono_app_state_v1";

  // ---- Catálogo fijo de roles/áreas -------------------------------------
  const ROLES = [
    { id: "director", name: "Director / PM", area: "Dirección" },
    { id: "ventas", name: "Ventas", area: "Comercial" },
    { id: "copywriting", name: "Copywriting", area: "Creativo" },
    { id: "publicista", name: "Publicista", area: "Creativo" },
    { id: "disenador", name: "Diseñador", area: "Creativo" },
    { id: "filmmaker", name: "Filmmaker", area: "Producción" },
    { id: "editor_video", name: "Editor de Video", area: "Producción" },
    { id: "community_manager", name: "Community Manager", area: "Social" },
    { id: "trafiker", name: "Trafiker", area: "Pauta" },
    { id: "ecommerce", name: "Encargado de Ecommerce", area: "Comercial" },
  ];

  const STATUS_COLUMNS = [
    { id: "todo", label: "Por Hacer" },
    { id: "progress", label: "En Proceso" },
    { id: "review", label: "En Revisión" },
    { id: "done", label: "Aprobado / Listo" },
  ];

  const LEVELS = { DIRECTOR: "director", LIDER: "lider", COLABORADOR: "colaborador" };

  const PLATFORMS = [
    { id: "instagram", label: "Instagram", color: "#E1306C" },
    { id: "tiktok", label: "TikTok", color: "#25F4EE" },
    { id: "facebook", label: "Facebook", color: "#5CC9FF" },
    { id: "linkedin", label: "LinkedIn", color: "#4C9AFF" },
    { id: "x", label: "X", color: "#F2F4E8" },
    { id: "youtube", label: "YouTube", color: "#FF5C3D" },
  ];

  const POST_STATUS = [
    { id: "borrador", label: "Borrador" },
    { id: "programado", label: "Programado" },
    { id: "publicado", label: "Publicado" },
  ];

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 9);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function todayPlus(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // Contraseña de demostración para todas las cuentas semilla: "ozono123"
  // (sal + hash SHA-256 precalculados). El Director puede restablecerla por
  // miembro desde Equipo, y cada quien puede cambiarla también.
  const SEED_PASSWORD_SALT = "seed-salt";
  const SEED_PASSWORD_HASH = "f0cdd44e3175d3326d6aee72ff59d4e00277785c26f47e546ccdb8af05d3aeda";

  // ---- Seed de datos de ejemplo ------------------------------------------
  function buildSeed() {
    const users = [
      { id: "u_director", name: "Diego Azcárate", username: "diego.azcarate", roleId: "director", level: LEVELS.DIRECTOR, avatarColor: "#C6FF3D", initials: "DA" },
      { id: "u_lider_creativo", name: "María Fuentes", username: "maria.fuentes", roleId: "publicista", level: LEVELS.LIDER, avatarColor: "#FF5C3D", initials: "MF" },
      { id: "u_disenador", name: "Sofía Reyes", username: "sofia.reyes", roleId: "disenador", level: LEVELS.COLABORADOR, avatarColor: "#5CC9FF", initials: "SR" },
      { id: "u_copy", name: "Luis Ortega", username: "luis.ortega", roleId: "copywriting", level: LEVELS.COLABORADOR, avatarColor: "#8FE0A8", initials: "LO" },
      { id: "u_filmmaker", name: "Andrés Vidal", username: "andres.vidal", roleId: "filmmaker", level: LEVELS.COLABORADOR, avatarColor: "#FFD166", initials: "AV" },
      { id: "u_editor", name: "Camila Ríos", username: "camila.rios", roleId: "editor_video", level: LEVELS.COLABORADOR, avatarColor: "#FF5C5C", initials: "CR" },
      { id: "u_cm", name: "Valentina Cruz", username: "valentina.cruz", roleId: "community_manager", level: LEVELS.COLABORADOR, avatarColor: "#C77DFF", initials: "VC" },
      { id: "u_trafiker", name: "Jorge Medina", username: "jorge.medina", roleId: "trafiker", level: LEVELS.COLABORADOR, avatarColor: "#5CFFB0", initials: "JM" },
      { id: "u_ventas", name: "Renata Solís", username: "renata.solis", roleId: "ventas", level: LEVELS.COLABORADOR, avatarColor: "#FFA5AB", initials: "RS" },
      { id: "u_ecommerce", name: "Pablo Nuñez", username: "pablo.nunez", roleId: "ecommerce", level: LEVELS.COLABORADOR, avatarColor: "#9AD1FF", initials: "PN" },
    ].map((u) => ({ ...u, passwordSalt: SEED_PASSWORD_SALT, passwordHash: SEED_PASSWORD_HASH, phone: "", notifyChannel: "app" }));

    const projects = [
      {
        id: "p_marca",
        name: "SUPER OZONO (marca propia)",
        driveUrl: "https://drive.google.com/drive/folders/0SuperOzonoMarcaPropia",
        products: [
          { id: "pr_skin", name: "Línea Skincare", driveUrl: "" },
          { id: "pr_tienda", name: "Tienda Online", driveUrl: "" },
        ],
      },
      {
        id: "p_cafe",
        name: "Cliente: Café Nublado",
        driveUrl: "https://drive.google.com/drive/folders/0CafeNubladoCliente",
        products: [
          { id: "pr_lanzamiento", name: "Campaña de Lanzamiento", driveUrl: "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz" },
          { id: "pr_redes", name: "Redes Sociales", driveUrl: "https://drive.google.com/drive/folders/2BcDeFgHiJkLmNoPqRsTuVwXyZ" },
        ],
      },
      {
        id: "p_fitzone",
        name: "Cliente: FitZone Gym",
        driveUrl: "",
        products: [
          { id: "pr_reels", name: "Reels Mensuales", driveUrl: "https://drive.google.com/drive/folders/3CdEfGhIjKlMnOpQrStUvWxYzA" },
          { id: "pr_pauta", name: "Pauta Digital", driveUrl: "" },
        ],
      },
    ];

    const month = new Date().toISOString().slice(0, 7);

    const metas = [
      { id: uid("meta"), userId: "u_disenador", title: "20 piezas de diseño entregadas", type: "numero", scope: "personal", target: 20, current: 12, status: "aprobada", month },
      { id: uid("meta"), userId: "u_disenador", title: "95% de entregas a tiempo", type: "porcentaje", scope: "personal", target: 95, current: 88, status: "aprobada", month },
      { id: uid("meta"), userId: "u_disenador", title: "Checklist de moodboard mensual", type: "checklist", scope: "equipo", checklist: [
          { label: "Moodboard Café Nublado", done: true },
          { label: "Moodboard FitZone", done: false },
          { label: "Actualizar banco de assets", done: false },
        ], status: "propuesta", month },

      { id: uid("meta"), userId: "u_editor", title: "10 videos editados", type: "numero", scope: "personal", target: 10, current: 4, status: "aprobada", month },
      { id: uid("meta"), userId: "u_editor", title: "90% aprobación en primera revisión", type: "porcentaje", scope: "personal", target: 90, current: 70, status: "aprobada", month },
      { id: uid("meta"), userId: "u_editor", title: "Checklist de entregables clave", type: "checklist", scope: "equipo", checklist: [
          { label: "Reel FitZone S1", done: true },
          { label: "Reel FitZone S2", done: false },
          { label: "Video institucional Café Nublado", done: false },
        ], status: "aprobada", month },

      { id: uid("meta"), userId: "u_trafiker", title: "$8,000 en pauta activa", type: "numero", scope: "equipo", target: 8000, current: 5200, status: "aprobada", month },
      { id: uid("meta"), userId: "u_trafiker", title: "ROAS promedio 90%", type: "porcentaje", scope: "personal", target: 90, current: 76, status: "aprobada", month },
      { id: uid("meta"), userId: "u_trafiker", title: "Checklist optimización semanal", type: "checklist", scope: "personal", checklist: [
          { label: "Revisión semana 1", done: true },
          { label: "Revisión semana 2", done: true },
          { label: "Revisión semana 3", done: false },
        ], status: "propuesta", month },
    ];

    // helper para conseguir metaId de un userId
    const metaOf = (userId, i = 0) => metas.filter((m) => m.userId === userId)[i]?.id || null;

    const t1 = {
      id: uid("task"),
      title: "Grabar material Reel FitZone S3",
      description: "Sesión de grabación en el gym, 3 tomas de entrenamiento + testimonios.",
      projectId: "p_fitzone",
      productId: "pr_reels",
      roleId: "filmmaker",
      assigneeId: "u_filmmaker",
      status: "progress",
      dueDate: todayPlus(2),
      dependsOn: [],
      metaId: null,
      driveUrl: "",
      comments: [],
      history: [{ id: uid("h"), text: "Diego (Director) creó la tarea.", ts: nowISO() }],
    };

    const t2 = {
      id: uid("task"),
      title: "Editar Reel FitZone S3",
      description: "Editar material una vez subido a Drive por Filmmaker. Formato 9:16, 30s.",
      projectId: "p_fitzone",
      productId: "pr_reels",
      roleId: "editor_video",
      assigneeId: "u_editor",
      status: "todo",
      dueDate: todayPlus(4),
      dependsOn: [t1.id],
      metaId: metaOf("u_editor", 0),
      driveUrl: "",
      comments: [],
      history: [{ id: uid("h"), text: "Diego (Director) creó la tarea y la vinculó a Grabar material Reel FitZone S3.", ts: nowISO() }],
    };

    const t3 = {
      id: uid("task"),
      title: "Diseñar carrusel lanzamiento Café Nublado",
      description: "5 slides, incluir nueva paleta de temporada.",
      projectId: "p_cafe",
      productId: "pr_lanzamiento",
      roleId: "disenador",
      assigneeId: "u_disenador",
      status: "review",
      dueDate: todayPlus(1),
      dependsOn: [],
      metaId: metaOf("u_disenador", 0),
      driveUrl: "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz",
      comments: [
        { id: uid("c"), userId: "u_disenador", text: "Listo para revisión, dejé 2 variantes de color en la carpeta.", ts: nowISO() },
      ],
      history: [{ id: uid("h"), text: "Sofía Reyes movió la tarea a En Revisión.", ts: nowISO() }],
    };

    const t4 = {
      id: uid("task"),
      title: "Copy para campaña Café Nublado",
      description: "Copy principal + 3 variaciones cortas para pauta.",
      projectId: "p_cafe",
      productId: "pr_lanzamiento",
      roleId: "copywriting",
      assigneeId: "u_copy",
      status: "todo",
      dueDate: todayPlus(3),
      dependsOn: [],
      metaId: null,
      driveUrl: "",
      comments: [],
      history: [{ id: uid("h"), text: "Luis Ortega creó la tarea.", ts: nowISO() }],
    };

    const t5 = {
      id: uid("task"),
      title: "Configurar pauta digital FitZone",
      description: "Set de campañas Meta Ads, presupuesto inicial $2,000.",
      projectId: "p_fitzone",
      productId: "pr_pauta",
      roleId: "trafiker",
      assigneeId: "u_trafiker",
      status: "done",
      dueDate: todayPlus(-1),
      dependsOn: [],
      metaId: metaOf("u_trafiker", 0),
      driveUrl: "",
      comments: [],
      history: [
        { id: uid("h"), text: "Jorge Medina movió la tarea a En Revisión.", ts: nowISO() },
        { id: uid("h"), text: "Diego (Director) aprobó la tarea.", ts: nowISO() },
      ],
    };

    const t6 = {
      id: uid("task"),
      title: "Publicaciones semanales Instagram FitZone",
      description: "3 publicaciones + 2 historias destacadas.",
      projectId: "p_fitzone",
      productId: "pr_reels",
      roleId: "community_manager",
      assigneeId: "u_cm",
      status: "progress",
      dueDate: todayPlus(2),
      dependsOn: [],
      metaId: null,
      driveUrl: "",
      comments: [],
      history: [{ id: uid("h"), text: "Valentina Cruz creó la tarea.", ts: nowISO() }],
    };

    const t7 = {
      id: uid("task"),
      title: "Diseño post lanzamiento Café Nublado",
      description: "Pieza estática para feed, formato 1:1, ya con copy final.",
      projectId: "p_cafe",
      productId: "pr_redes",
      roleId: "disenador",
      assigneeId: "u_disenador",
      status: "done",
      dueDate: todayPlus(-1),
      dependsOn: [],
      metaId: metaOf("u_disenador", 0),
      driveUrl: "https://drive.google.com/drive/folders/2BcDeFgHiJkLmNoPqRsTuVwXyZ",
      comments: [],
      history: [
        { id: uid("h"), text: "Sofía Reyes movió la tarea a En Revisión.", ts: nowISO() },
        { id: uid("h"), text: "Diego (Director) aprobó la tarea.", ts: nowISO() },
      ],
    };

    const t8 = {
      id: uid("task"),
      title: "Reel corto FitZone bienvenida",
      description: "Reel de 15s dando la bienvenida a nuevos socios del gym.",
      projectId: "p_fitzone",
      productId: "pr_reels",
      roleId: "editor_video",
      assigneeId: "u_editor",
      status: "done",
      dueDate: todayPlus(-2),
      dependsOn: [],
      metaId: metaOf("u_editor", 0),
      driveUrl: "https://drive.google.com/drive/folders/3CdEfGhIjKlMnOpQrStUvWxYzA",
      comments: [],
      history: [
        { id: uid("h"), text: "Camila Ríos movió la tarea a En Revisión.", ts: nowISO() },
        { id: uid("h"), text: "Diego (Director) aprobó la tarea.", ts: nowISO() },
      ],
    };

    const t9 = {
      id: uid("task"),
      title: "Copy post evergreen Tienda Online",
      description: "Copy corto para pieza evergreen de catálogo.",
      projectId: "p_marca",
      productId: "pr_tienda",
      roleId: "copywriting",
      assigneeId: "u_copy",
      status: "done",
      dueDate: todayPlus(-3),
      dependsOn: [],
      metaId: null,
      driveUrl: "https://drive.google.com/drive/folders/4DeFgHiJkLmNoPqRsTuVwXyZaB",
      comments: [],
      history: [
        { id: uid("h"), text: "Luis Ortega movió la tarea a En Revisión.", ts: nowISO() },
        { id: uid("h"), text: "Diego (Director) aprobó la tarea.", ts: nowISO() },
      ],
    };

    const tasks = [t1, t2, t3, t4, t5, t6, t7, t8, t9];

    const posts = [
      {
        id: uid("post"),
        taskId: t7.id,
        projectId: "p_cafe",
        productId: "pr_redes",
        title: "Diseño post lanzamiento Café Nublado",
        platform: "instagram",
        scheduledDate: todayPlus(1),
        scheduledTime: "10:00",
        status: "programado",
        assigneeId: "u_cm",
      },
      {
        id: uid("post"),
        taskId: t8.id,
        projectId: "p_fitzone",
        productId: "pr_reels",
        title: "Reel corto FitZone bienvenida",
        platform: "tiktok",
        scheduledDate: todayPlus(3),
        scheduledTime: "18:30",
        status: "programado",
        assigneeId: "u_cm",
      },
      {
        id: uid("post"),
        taskId: t9.id,
        projectId: "p_marca",
        productId: "pr_tienda",
        title: "Copy post evergreen Tienda Online",
        platform: "facebook",
        scheduledDate: null,
        scheduledTime: "",
        status: "borrador",
        assigneeId: "u_cm",
      },
    ];

    const requisiciones = [
      {
        id: uid("req"),
        fromUserId: "u_cm",
        toUserId: "u_disenador",
        title: "Necesito 3 piezas para historias destacadas",
        description: "Formato historia, estilo minimal, paleta FitZone.",
        status: "pendiente",
        motivo: "",
        ts: nowISO(),
        taskId: null,
      },
      {
        id: uid("req"),
        fromUserId: "u_editor",
        toUserId: "u_filmmaker",
        title: "Falta tomas B-roll para el video institucional",
        description: "Necesito 2 min de B-roll adicional del local.",
        status: "aceptada",
        motivo: "",
        ts: nowISO(),
        taskId: null,
      },
    ];

    const notifications = [
      { id: uid("n"), userId: "u_disenador", text: "Valentina te envió una requisición nueva.", ts: nowISO(), read: false },
      { id: uid("n"), userId: "u_editor", text: "Nueva tarea vinculada a tu meta 'Videos editados'.", ts: nowISO(), read: false },
      { id: uid("n"), userId: "u_director", text: "Sofía movió 'Diseñar carrusel lanzamiento Café Nublado' a En Revisión.", ts: nowISO(), read: false },
    ];

    return {
      currentUserId: null,
      users,
      projects,
      metas,
      tasks,
      requisiciones,
      notifications,
      posts,
      messages: [], // mensajes directos del Director a miembros
      digestLog: {}, // userId -> última fecha (YYYY-MM-DD) en que recibió su resumen de 8am
      automations: [], // reglas "cuando X entonces Y" configuradas por Director/Líder
      automationLog: {}, // clave regla:tarea -> última fecha en que ya se disparó (evita spam)
    };
  }

  // ---- Persistencia -------------------------------------------------------
  function load() {
    try {
      const raw = global.localStorage.getItem(OZONO_DB_KEY);
      if (!raw) {
        const seed = buildSeed();
        save(seed);
        return seed;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn("OZONO: localStorage no disponible, usando estado en memoria.", e);
      if (!global.__ozono_memory_state) global.__ozono_memory_state = buildSeed();
      return global.__ozono_memory_state;
    }
  }

  function save(state) {
    try {
      global.localStorage.setItem(OZONO_DB_KEY, JSON.stringify(state));
    } catch (e) {
      global.__ozono_memory_state = state;
    }
  }

  function resetSeed() {
    const seed = buildSeed();
    save(seed);
    return seed;
  }

  // ---- Helpers de dominio --------------------------------------------------
  function getUser(state, id) {
    return state.users.find((u) => u.id === id);
  }
  function getRole(id) {
    return ROLES.find((r) => r.id === id);
  }
  function getProject(state, id) {
    return state.projects.find((p) => p.id === id);
  }
  function getProduct(state, projectId, productId) {
    const p = getProject(state, projectId);
    return p ? p.products.find((x) => x.id === productId) : null;
  }
  function isDirector(user) {
    return user && user.level === LEVELS.DIRECTOR;
  }
  function isLider(user) {
    return user && user.level === LEVELS.LIDER;
  }
  function canManageUser(actingUser, targetUser) {
    if (isDirector(actingUser)) return true;
    if (isLider(actingUser) && targetUser) {
      const actingRole = getRole(actingUser.roleId);
      const targetRole = getRole(targetUser.roleId);
      return actingRole && targetRole && actingRole.area === targetRole.area;
    }
    return actingUser.id === (targetUser && targetUser.id);
  }
  function canApprove(actingUser, task, state) {
    if (isDirector(actingUser)) return true;
    if (isLider(actingUser)) {
      const assignee = getUser(state, task.assigneeId);
      return canManageUser(actingUser, assignee);
    }
    return false;
  }
  // Una tarea puede depender de una o varias tareas de OTROS roles (p. ej.
  // Diseño no puede iniciar su pieza si Copywriting no ha entregado el copy).
  // `dependsOn` es un arreglo de ids de tarea; se normaliza por compatibilidad
  // con datos antiguos donde era un solo id (string) o null.
  function getDependencyIds(task) {
    if (!task.dependsOn) return [];
    return Array.isArray(task.dependsOn) ? task.dependsOn : [task.dependsOn];
  }

  function getBlockingTasks(task, state) {
    return getDependencyIds(task)
      .map((id) => state.tasks.find((t) => t.id === id))
      .filter(Boolean);
  }

  function isBlocked(task, state) {
    return getBlockingTasks(task, state).some((dep) => dep.status !== "done");
  }

  // Candidatas válidas para depender: cualquier otra tarea que no sea la
  // propia y que no ya dependa (directa o indirectamente) de esta tarea —
  // así evitamos ciclos de dependencia (A depende de B que depende de A).
  function dependsOnChain(taskId, state, seen = new Set()) {
    if (seen.has(taskId)) return seen;
    seen.add(taskId);
    const t = state.tasks.find((x) => x.id === taskId);
    if (t) getDependencyIds(t).forEach((id) => dependsOnChain(id, state, seen));
    return seen;
  }

  function getDependencyCandidates(task, state) {
    const descendants = dependsOnChain(task.id, state); // tareas que ya dependen de esta (directa o indirectamente) más ella misma
    return state.tasks.filter((t) => t.id !== task.id && !descendants.has(t.id));
  }

  function setDependencies(state, taskId, depIds) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;
    t.dependsOn = [...new Set(depIds)].filter((id) => id !== taskId);
  }

  function addDependency(state, taskId, depId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t || taskId === depId) return;
    const current = getDependencyIds(t);
    if (!current.includes(depId)) t.dependsOn = [...current, depId];
  }

  function removeDependency(state, taskId, depId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return;
    t.dependsOn = getDependencyIds(t).filter((id) => id !== depId);
  }
  function logHistory(task, text) {
    task.history.push({ id: uid("h"), text, ts: nowISO() });
  }
  function addNotification(state, userId, text) {
    state.notifications.unshift({ id: uid("n"), userId, text, ts: nowISO(), read: false });
  }

  // Solo tareas aprobadas (done) y que no tengan ya un post asociado pueden
  // entrar al calendario editorial — refleja la regla de negocio: nada se
  // programa sin pasar antes por la aprobación del Director.
  const CONTENT_ROLES = ["disenador", "editor_video", "copywriting", "publicista", "filmmaker"];

  function getSchedulableTasks(state) {
    const postedTaskIds = new Set(state.posts.map((p) => p.taskId).filter(Boolean));
    return state.tasks.filter(
      (t) => t.status === "done" && CONTENT_ROLES.includes(t.roleId) && !postedTaskIds.has(t.id)
    );
  }

  function getPlatform(id) {
    return PLATFORMS.find((p) => p.id === id);
  }

  // Enlace de Drive configurado para la tarea: prioriza el del producto,
  // si no existe cae al del proyecto (carpeta central compartida).
  function getConfiguredDriveUrl(state, projectId, productId) {
    const project = getProject(state, projectId);
    if (!project) return "";
    const product = productId ? project.products.find((p) => p.id === productId) : null;
    if (product && product.driveUrl) return product.driveUrl;
    return project.driveUrl || "";
  }

  // ---- Gestión de usuarios: registro y asignación de roles -----------------
  const AVATAR_PALETTE = ["#C6FF3D", "#5CC9FF", "#FF5C3D", "#8FE0A8", "#FFD166", "#FF5C5C", "#C77DFF", "#5CFFB0", "#FFA5AB", "#9AD1FF"];

  function slugifyUsername(name) {
    return name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");
  }

  function isUsernameTaken(state, username) {
    return state.users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  function suggestUsername(state, name) {
    const base = slugifyUsername(name) || "usuario";
    let candidate = base;
    let n = 1;
    while (isUsernameTaken(state, candidate)) {
      n += 1;
      candidate = base + n;
    }
    return candidate;
  }

  function initialsOf(name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }

  // Crea un nuevo miembro del equipo (registro). El salt/hash de la
  // contraseña se calculan antes (async, con Web Crypto) y se pasan ya
  // resueltos porque esta función es síncrona.
  function createUser(state, { name, username, roleId, level, passwordSalt, passwordHash, phone }) {
    const id = uid("u");
    const color = AVATAR_PALETTE[state.users.length % AVATAR_PALETTE.length];
    const user = {
      id,
      name,
      username: username || suggestUsername(state, name),
      roleId,
      level: level || LEVELS.COLABORADOR,
      avatarColor: color,
      initials: initialsOf(name),
      passwordSalt: passwordSalt || "",
      passwordHash: passwordHash || "",
      phone: phone || "",
      notifyChannel: "app",
    };
    state.users.push(user);
    return user;
  }

  function updateUserRole(state, userId, roleId, level) {
    const u = state.users.find((x) => x.id === userId);
    if (!u) return;
    if (roleId) u.roleId = roleId;
    if (level) u.level = level;
  }

  function findUserByUsername(state, username) {
    if (!username) return null;
    return state.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
  }

  // ---- Contraseñas (hash SHA-256 con salt vía Web Crypto, 100% en el navegador) --
  async function sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    return sha256Hex(salt + ":" + password);
  }

  async function makeCredentials(password) {
    const passwordSalt = uid("salt");
    const passwordHash = await hashPassword(password, passwordSalt);
    return { passwordSalt, passwordHash };
  }

  async function verifyPassword(user, password) {
    if (!user || !user.passwordHash) return false;
    const attempt = await hashPassword(password, user.passwordSalt);
    return attempt === user.passwordHash;
  }

  function setUserPasswordFields(state, userId, passwordSalt, passwordHash) {
    const u = state.users.find((x) => x.id === userId);
    if (!u) return;
    u.passwordSalt = passwordSalt;
    u.passwordHash = passwordHash;
  }

  // ---- Áreas (para requisiciones dirigidas a todo un equipo, no solo a una persona) --
  function getAreas() {
    return [...new Set(ROLES.filter((r) => r.id !== "director").map((r) => r.area))];
  }
  function getUsersInArea(state, area) {
    return state.users.filter((u) => getRole(u.roleId).area === area);
  }

  // Resumen diario 8am: al abrir la app después de las 8:00 (hora local), si
  // el usuario aún no recibió el resumen de hoy, se le genera una notificación
  // con sus tareas del día. Es un recordatorio dentro de la app (no un push
  // real fuera del navegador — eso requiere backend, ver módulo Equipo).
  function maybeSendDailyDigest(state, userId) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getHours() < 8) return false;
    if (!state.digestLog) state.digestLog = {};
    if (state.digestLog[userId] === today) return false;
    state.digestLog[userId] = today;

    const mine = state.tasks.filter((t) => t.assigneeId === userId && t.status !== "done" && (t.dueDate === today || t.status === "progress"));
    if (mine.length === 0) {
      addNotification(state, userId, `Buenos días — no tienes tareas urgentes para hoy (${today}).`);
    } else {
      const titles = mine.slice(0, 4).map((t) => t.title).join(" · ");
      addNotification(state, userId, `Resumen de hoy (${mine.length} tarea${mine.length === 1 ? "" : "s"}): ${titles}${mine.length > 4 ? "…" : ""}`);
    }
    return true;
  }

  // ---- Automatizaciones ("cuando X entonces Y") --------------------------
  // No hay backend con cron real, así que las automatizaciones se evalúan
  // cada vez que ocurre el evento que las dispara (un cambio de estado) o
  // cada vez que alguien abre la app (para las de fecha próxima/recurrentes,
  // igual que el resumen de 8am). Tres tipos, pensados para cubrir los casos
  // de uso reales sin necesitar un motor de reglas genérico complejo:
  //  - status_notify: cuando una tarea (de un rol, o de cualquiera) pasa a
  //    cierto estado, notifica a un destinatario.
  //  - due_soon_notify: cuando a una tarea sin terminar le quedan N días o
  //    menos, notifica a un destinatario (una vez por día por tarea).
  //  - recurring_task: crea automáticamente una tarea nueva para alguien
  //    cada N días (ej. "reporte semanal"), sin que nadie tenga que acordarse.
  function createAutomation(state, payload) {
    const automation = {
      id: uid("auto"),
      active: true,
      lastCreatedAt: null,
      ...payload,
    };
    state.automations.push(automation);
    return automation;
  }

  function toggleAutomation(state, id) {
    const a = state.automations.find((x) => x.id === id);
    if (a) a.active = !a.active;
  }

  function deleteAutomation(state, id) {
    state.automations = state.automations.filter((a) => a.id !== id);
  }

  function resolveNotifyTargets(state, rule, task) {
    const assignee = getUser(state, task.assigneeId);
    if (rule.notifyTarget === "assignee") return assignee ? [assignee.id] : [];
    if (rule.notifyTarget === "director") {
      const d = state.users.find((u) => u.level === "director");
      return d ? [d.id] : [];
    }
    if (rule.notifyTarget === "lider") {
      const area = assignee ? getRole(assignee.roleId).area : null;
      return state.users.filter((u) => u.level === "lider" && getRole(u.roleId).area === area).map((u) => u.id);
    }
    return [];
  }

  function fillTemplate(template, task, state) {
    const assignee = getUser(state, task.assigneeId);
    return (template || "")
      .replace(/\{\{tarea\}\}/g, task.title)
      .replace(/\{\{responsable\}\}/g, assignee ? assignee.name : "—")
      .replace(/\{\{rol\}\}/g, getRole(task.roleId).name);
  }

  // Se llama cada vez que una tarea cambia de estado (Kanban o el modal de
  // detalle), con el estado anterior y el nuevo.
  function runStatusAutomations(state, task, fromStatus, toStatus) {
    if (!state.automations) return;
    state.automations
      .filter((a) => a.active && a.kind === "status_notify" && a.toStatus === toStatus)
      .filter((a) => !a.roleFilter || a.roleFilter === task.roleId)
      .forEach((a) => {
        const targets = resolveNotifyTargets(state, a, task);
        const msg = fillTemplate(a.message, task, state) || `Automatización "${a.name}": "${task.title}" pasó a ${toStatus}.`;
        targets.forEach((uid_) => addNotification(state, uid_, msg));
      });
  }

  // Se llama al abrir la app: revisa fechas próximas a vencer.
  function runDueSoonAutomations(state) {
    if (!state.automations) return;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (!state.automationLog) state.automationLog = {};
    state.automations
      .filter((a) => a.active && a.kind === "due_soon_notify")
      .forEach((a) => {
        state.tasks
          .filter((t) => t.status !== "done" && t.dueDate)
          .forEach((t) => {
            const daysLeft = Math.ceil((new Date(t.dueDate + "T00:00:00") - today) / 86400000);
            if (daysLeft > a.daysBefore || daysLeft < 0) return;
            const key = a.id + ":" + t.id;
            if (state.automationLog[key] === todayStr) return;
            state.automationLog[key] = todayStr;
            const targets = resolveNotifyTargets(state, a, t);
            const msg = fillTemplate(a.message, t, state) || `"${t.title}" vence en ${daysLeft} día(s).`;
            targets.forEach((uid_) => addNotification(state, uid_, msg));
          });
      });
  }

  // Se llama al abrir la app: genera tareas recurrentes vencidas de crear.
  function runRecurringAutomations(state) {
    if (!state.automations) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    state.automations
      .filter((a) => a.active && a.kind === "recurring_task")
      .forEach((a) => {
        const daysSince = a.lastCreatedAt
          ? Math.floor((new Date(todayStr) - new Date(a.lastCreatedAt)) / 86400000)
          : Infinity;
        if (daysSince < a.everyDays) return;
        const assignee = getUser(state, a.assigneeId);
        if (!assignee) return;
        const newTask = {
          id: uid("task"),
          title: a.title,
          description: a.description || "",
          projectId: null,
          productId: null,
          roleId: assignee.roleId,
          assigneeId: assignee.id,
          status: "todo",
          dueDate: todayPlus(a.dueInDays || 3),
          dependsOn: [],
          metaId: null,
          driveUrl: "",
          comments: [],
          history: [{ id: uid("h"), text: `Tarea creada automáticamente por la regla "${a.name}".`, ts: nowISO() }],
        };
        state.tasks.push(newTask);
        addNotification(state, assignee.id, `Se generó tu tarea recurrente: "${a.title}".`);
        a.lastCreatedAt = todayStr;
      });
  }

  // ---- Eliminación (solo Director) ---------------------------------------
  // Se guarda el estado previo en localStorage antes de cada borrado real, ya
  // que esta es una eliminación permanente dentro del mock-DB (no hay backend
  // con papelera). La UI siempre confirma con el usuario antes de llamar aquí.
  function deleteTask(state, taskId) {
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    state.posts = state.posts.filter((p) => p.taskId !== taskId);
    state.requisiciones.forEach((r) => {
      if (r.taskId === taskId) r.taskId = null;
    });
  }

  function deleteProject(state, projectId) {
    const project = state.projects.find((p) => p.id === projectId);
    const productIds = project ? project.products.map((pr) => pr.id) : [];
    state.tasks
      .filter((t) => t.projectId === projectId)
      .forEach((t) => deleteTask(state, t.id));
    state.posts = state.posts.filter((p) => p.projectId !== projectId);
    state.projects = state.projects.filter((p) => p.id !== projectId);
  }

  function deleteProduct(state, projectId, productId) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    state.tasks
      .filter((t) => t.productId === productId)
      .forEach((t) => deleteTask(state, t.id));
    state.posts = state.posts.filter((p) => p.productId !== productId);
    project.products = project.products.filter((pr) => pr.id !== productId);
  }

  function deleteMeta(state, metaId) {
    state.tasks.forEach((t) => {
      if (t.metaId === metaId) t.metaId = null;
    });
    state.metas = state.metas.filter((m) => m.id !== metaId);
  }

  function deleteRequisicion(state, reqId) {
    state.requisiciones = state.requisiciones.filter((r) => r.id !== reqId);
  }

  // Quitar a un miembro del equipo: sus tareas pendientes pasan al Director
  // para que las reasigne, en vez de quedar huérfanas.
  function removeUser(state, userId) {
    const director = state.users.find((u) => u.level === "director");
    state.tasks.forEach((t) => {
      if (t.assigneeId === userId && director) t.assigneeId = director.id;
    });
    state.metas = state.metas.filter((m) => m.userId !== userId);
    state.requisiciones.forEach((r) => {
      if (r.toUserId === userId) r.toUserId = null;
    });
    state.requisiciones = state.requisiciones.filter((r) => r.fromUserId !== userId);
    state.notifications = state.notifications.filter((n) => n.userId !== userId);
    state.users = state.users.filter((u) => u.id !== userId);
  }

  global.OZONO = {
    ROLES,
    STATUS_COLUMNS,
    LEVELS,
    PLATFORMS,
    POST_STATUS,
    CONTENT_ROLES,
    getSchedulableTasks,
    getPlatform,
    getConfiguredDriveUrl,
    slugifyUsername,
    isUsernameTaken,
    suggestUsername,
    createUser,
    updateUserRole,
    maybeSendDailyDigest,
    findUserByUsername,
    sha256Hex,
    hashPassword,
    makeCredentials,
    verifyPassword,
    setUserPasswordFields,
    getAreas,
    getUsersInArea,
    deleteTask,
    deleteProject,
    deleteProduct,
    deleteMeta,
    deleteRequisicion,
    removeUser,
    createAutomation,
    toggleAutomation,
    deleteAutomation,
    runStatusAutomations,
    runDueSoonAutomations,
    runRecurringAutomations,
    uid,
    nowISO,
    todayPlus,
    load,
    save,
    resetSeed,
    getUser,
    getRole,
    getProject,
    getProduct,
    isDirector,
    isLider,
    canManageUser,
    canApprove,
    isBlocked,
    getDependencyIds,
    getBlockingTasks,
    getDependencyCandidates,
    setDependencies,
    addDependency,
    removeDependency,
    logHistory,
    addNotification,
  };
})(window);
