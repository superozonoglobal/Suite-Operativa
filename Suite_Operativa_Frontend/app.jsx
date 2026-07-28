/* =========================================================================
   SUPER OZONO — App shell
   ========================================================================= */

function NotificationsPanel({ db, user, commit, onClose }) {
  const mine = db.notifications.filter((n) => n.userId === user.id).slice(0, 20);
  return (
    <div
      className="surface-card rise-in"
      style={{ position: "absolute", right: 0, top: 44, width: 320, maxHeight: 380, overflowY: "auto", padding: 8, zIndex: 30 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px 10px" }}>
        <span className="label-eyebrow">Notificaciones</span>
        {mine.some((n) => !n.read) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              commit((draft) => {
                draft.notifications.forEach((n) => {
                  if (n.userId === user.id) n.read = true;
                });
              })
            }
          >
            Marcar leídas
          </button>
        )}
      </div>
      {mine.length === 0 ? (
        <div className="hint" style={{ padding: 10 }}>Sin notificaciones.</div>
      ) : (
        mine.map((n) => (
          <div
            key={n.id}
            style={{
              padding: "9px 10px",
              borderRadius: 10,
              background: n.read ? "transparent" : "var(--surface-hover)",
              marginBottom: 3,
              fontSize: 12.5,
            }}
          >
            <div>{n.text}</div>
            <div className="hint" style={{ marginTop: 3 }}>{relativeTime(n.ts)}</div>
          </div>
        ))
      )}
    </div>
  );
}

const NAV_ITEMS = [
  { id: "tablero", label: "Mi Tablero", icon: "kanban" },
  { id: "metas", label: "Metas", icon: "target" },
  { id: "calendario", label: "Calendario Editorial", icon: "calendar" },
  { id: "requisiciones", label: "Requisiciones", icon: "swap" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "mensajes", label: "Mensajes", icon: "chat" },
];

function App() {
  const [db, setDb] = useState(() => OZONO.load());
  const [view, setView] = useState("tablero");
  const [openTaskState, setOpenTaskState] = useState(null); // {task, opts}
  const [notifOpen, setNotifOpen] = useState(false);

  const user = db.currentUserId ? OZONO.getUser(db, db.currentUserId) : null;

  function commit(mutator) {
    setDb((prev) => {
      const draft = JSON.parse(JSON.stringify(prev));
      mutator(draft);
      OZONO.save(draft);
      return draft;
    });
  }

  async function attemptLogin(username, password) {
    const found = OZONO.findUserByUsername(db, username);
    if (!found) return { ok: false, error: "No existe ese usuario. ¿Ya te registraste?" };
    const valid = await OZONO.verifyPassword(found, password);
    if (!valid) return { ok: false, error: "Usuario o contraseña incorrectos." };
    commit((draft) => {
      draft.currentUserId = found.id;
    });
    setView("tablero");
    return { ok: true };
  }

  async function register({ name, roleId, password }) {
    const { passwordSalt, passwordHash } = await OZONO.makeCredentials(password);
    let newUserId = null;
    commit((draft) => {
      const newUser = OZONO.createUser(draft, { name, roleId, level: OZONO.LEVELS.COLABORADOR, passwordSalt, passwordHash });
      newUserId = newUser.id;
      const director = draft.users.find((u) => u.level === "director");
      if (director) OZONO.addNotification(draft, director.id, `${newUser.name} (@${newUser.username}) se registró como ${OZONO.getRole(roleId).name}. Confirma su rol en Equipo.`);
    });
    commit((draft) => {
      draft.currentUserId = newUserId;
    });
    setView("tablero");
  }

  function logout() {
    commit((draft) => {
      draft.currentUserId = null;
    });
  }

  function openTask(task, opts) {
    setOpenTaskState({ taskId: task.id, opts: opts || {} });
  }

  // Resumen diario 8am: al entrar (o refrescar) despues de las 8am, si aun
  // no se genero el resumen de hoy para este usuario, se crea como notificacion.
  // De paso, en cada apertura de sesion se evaluan las automatizaciones de
  // "fecha proxima a vencer" y las tareas recurrentes (no hay backend con
  // cron real, asi que se revisan cuando alguien abre la app).
  useEffect(() => {
    if (!user) return;
    commit((draft) => {
      OZONO.maybeSendDailyDigest(draft, user.id);
      OZONO.runDueSoonAutomations(draft);
      OZONO.runRecurringAutomations(draft);
    });
  }, [user && user.id]);

  if (!user) {
    return <LoginView db={db} onLoginAttempt={attemptLogin} onRegister={register} />;
  }

  const role = OZONO.getRole(user.roleId);
  const canSeeDashboard = OZONO.isDirector(user) || OZONO.isLider(user);
  let navItems = canSeeDashboard ? [{ id: "dashboard", label: "Dashboard", icon: "grid" }, ...NAV_ITEMS] : NAV_ITEMS;
  if (canSeeDashboard) navItems = [...navItems, { id: "analitica", label: "Analítica", icon: "activity" }];
  if (canSeeDashboard) navItems = [...navItems, { id: "automatizaciones", label: "Automatizaciones", icon: "shield" }];
  if (OZONO.isDirector(user)) navItems = [...navItems, { id: "informes", label: "Informes", icon: "folder" }];
  if (OZONO.isDirector(user)) navItems = [...navItems, { id: "equipo", label: "Equipo", icon: "users" }];
  if (canSeeDashboard) navItems = [...navItems, { id: "configuracion", label: "Configuración", icon: "settings" }];
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length;

  const role2 = OZONO.getRole(user.roleId);
  const visibleTasks = OZONO.isDirector(user)
    ? db.tasks
    : db.tasks.filter((t) => OZONO.getRole(t.roleId).area === role2.area);

  const openTask_ = openTaskState ? db.tasks.find((t) => t.id === openTaskState.taskId) : null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div style={{ padding: "4px 10px 10px", display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={42} />
          <div className="label-eyebrow">Suite operativa</div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <div key={item.id} className={"nav-item" + (view === item.id ? " active" : "")} onClick={() => setView(item.id)}>
              <span className="nav-icon"><Icon name={item.icon} size={15} /></span>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px" }}>
            <Avatar user={user} />
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.name}</div>
              <div className="hint" style={{ whiteSpace: "nowrap", display: "flex", gap: 5, alignItems: "center" }}>
                {role.name} <UsernameTag username={user.username} />
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={logout}>
            <Icon name="logout" size={13} /> Cambiar usuario
          </button>
        </div>
      </aside>

      <div>
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>
              {navItems.find((n) => n.id === view)?.label}
            </span>
            <LevelTag level={user.level} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
            <button
              className={"btn btn-ghost btn-sm" + (unread > 0 ? " bell-ring" : "")}
              style={{ position: "relative", padding: 8 }}
              onClick={() => setNotifOpen((o) => !o)}
            >
              <Icon name="bell" size={16} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--coral)",
                  }}
                />
              )}
            </button>
            {notifOpen && <NotificationsPanel db={db} user={user} commit={commit} onClose={() => setNotifOpen(false)} />}
          </div>
        </div>

        <main className="main-scroll">
          <div key={view} className="view-transition">
          {view === "dashboard" && canSeeDashboard && (
            <DashboardView db={db} user={user} commit={commit} openTask={openTask} goTo={setView} />
          )}
          {view === "tablero" && <KanbanView db={db} user={user} commit={commit} tasks={visibleTasks} openTask={openTask} />}
          {view === "metas" && <MetasView db={db} user={user} commit={commit} />}
          {view === "calendario" && <CalendarView db={db} user={user} commit={commit} openTask={openTask} />}
          {view === "requisiciones" && <RequisicionesView db={db} user={user} commit={commit} />}
          {view === "proyectos" && <ProyectosView db={db} user={user} commit={commit} openTask={openTask} />}
          {view === "analitica" && canSeeDashboard && <AnaliticaView db={db} user={user} />}
          {view === "equipo" && OZONO.isDirector(user) && <EquipoView db={db} user={user} commit={commit} />}
          {view === "automatizaciones" && canSeeDashboard && <AutomatizacionesView db={db} user={user} commit={commit} />}
          {view === "informes" && OZONO.isDirector(user) && <InformesView db={db} user={user} />}
          {view === "configuracion" && canSeeDashboard && <ConfiguracionView db={db} user={user} commit={commit} />}
          {view === "mensajes" && <MensajesView db={db} user={user} commit={commit} />}
          </div>
        </main>
      </div>

      {openTask_ && (
        <TaskDetailModal
          db={db}
          task={openTask_}
          user={user}
          commit={commit}
          initialReject={openTaskState?.opts?.forceReject}
          onClose={() => setOpenTaskState(null)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
