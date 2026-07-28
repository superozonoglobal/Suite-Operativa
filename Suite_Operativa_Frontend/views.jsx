/* =========================================================================
   Vistas principales de SUPER OZONO
   ========================================================================= */

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
function RegisterForm({ db, onRegister, onCancel }) {
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState(OZONO.ROLES.find((r) => r.id !== "director").id);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = name.trim() ? OZONO.suggestUsername(db, name.trim()) : "";
  const mismatch = password2.length > 0 && password !== password2;
  const canSubmit = name.trim() && password.length >= 4 && password === password2 && !busy;

  async function submit() {
    setBusy(true);
    await onRegister({ name: name.trim(), roleId, password });
    setBusy(false);
  }

  return (
    <div className="surface-card rise-in" style={{ padding: 18, marginBottom: 18, textAlign: "left" }}>
      <div className="label-eyebrow" style={{ marginBottom: 10 }}>Registro de nuevo miembro</div>
      <div className="field-label">Nombre completo</div>
      <input className="field-input" placeholder="Ej. Ana Torres" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />
      <div className="field-label">Rol / área de trabajo</div>
      <select className="field-select" value={roleId} onChange={(e) => setRoleId(e.target.value)} style={{ marginBottom: 10 }}>
        {OZONO.ROLES.filter((r) => r.id !== "director").map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      {preview && (
        <div className="hint" style={{ marginBottom: 12 }}>
          Tu username será <UsernameTag username={preview} /> — el Director confirmará tu rol y nivel de acceso.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
        <div>
          <div className="field-label">Contraseña</div>
          <input className="field-input" type="password" placeholder="Mínimo 4 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <div className="field-label">Confirmar contraseña</div>
          <input className="field-input" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
        </div>
      </div>
      {mismatch && <div className="hint" style={{ color: "var(--danger)", marginBottom: 8 }}>Las contraseñas no coinciden.</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn btn-accent btn-sm" disabled={!canSubmit} onClick={submit}>
          {busy ? "Creando…" : "Crear cuenta y entrar"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function LoginView({ db, onLoginAttempt, onRegister }) {
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await onLoginAttempt(username.trim(), password);
    if (!result.ok) setError(result.error || "Usuario o contraseña incorrectos.");
    setBusy(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        padding: 24,
      }}
    >
      <div className="rise-in" style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <LogoMark size={140} />
        </div>
        <div className="label-eyebrow" style={{ marginBottom: registering ? 20 : 28 }}>Suite operativa</div>
        <p style={{ color: "var(--text-muted)", marginBottom: registering ? 20 : 28, fontSize: 14.5 }}>
          {registering ? "Crea tu cuenta para unirte al equipo." : "Ingresa con tu usuario y contraseña."}
        </p>

        {registering ? (
          <RegisterForm db={db} onRegister={onRegister} onCancel={() => setRegistering(false)} />
        ) : (
          <form className="surface-card rise-in rise-in-1" style={{ padding: 20, marginBottom: 14, textAlign: "left" }} onSubmit={submitLogin}>
            <div className="field-label">Usuario</div>
            <input
              className="field-input"
              placeholder="ej. diego.azcarate"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ marginBottom: 12 }}
              autoFocus
            />
            <div className="field-label">Contraseña</div>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {error && <div className="hint" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
            <button className="btn btn-accent" type="submit" disabled={!username.trim() || !password || busy} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}

        {!registering && (
          <button className="btn btn-sm" onClick={() => setRegistering(true)}>
            <Icon name="userPlus" size={13} /> Soy nuevo, registrarme
          </button>
        )}
        {registering && (
          <div className="hint">¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setRegistering(false); }} style={{ color: "var(--accent)" }}>Inicia sesión</a></div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TASK DETAIL MODAL
// ---------------------------------------------------------------------------
function TaskDetailModal({ db, task, user, onClose, commit, initialReject }) {
  const [commentText, setCommentText] = useState("");
  const [rejectMode, setRejectMode] = useState(!!initialReject);
  const [rejectReason, setRejectReason] = useState("");
  const [driveDraft, setDriveDraft] = useState(task.driveUrl || "");
  const [justApproved, setJustApproved] = useState(false);
  const [addingDep, setAddingDep] = useState(false);
  const [depToAdd, setDepToAdd] = useState("");

  const project = OZONO.getProject(db, task.projectId);
  const product = project ? OZONO.getProduct(db, task.projectId, task.productId) : null;
  const configuredDriveUrl = project ? OZONO.getConfiguredDriveUrl(db, task.projectId, task.productId) : "";
  const assignee = OZONO.getUser(db, task.assigneeId);
  const blockingTasks = OZONO.getBlockingTasks(task, db);
  const blocked = OZONO.isBlocked(task, db);
  const canApprove = OZONO.canApprove(user, task, db);
  const needsLinkForReview = OZONO.CONTENT_ROLES.includes(task.roleId);
  const userMetas = db.metas.filter((m) => m.userId === task.assigneeId && m.status === "aprobada");
  // Quién puede gestionar las dependencias de esta tarea: Director, Líder de
  // su área, o la persona asignada (ella sabe mejor de qué depende su trabajo).
  const canEditDeps = OZONO.isDirector(user) || OZONO.isLider(user) || task.assigneeId === user.id;
  const depCandidates = canEditDeps ? OZONO.getDependencyCandidates(task, db).filter((t) => t.status !== "done") : [];

  function addDep() {
    if (!depToAdd) return;
    commit((draft) => OZONO.addDependency(draft, task.id, depToAdd));
    setDepToAdd("");
    setAddingDep(false);
  }

  function removeDep(depId) {
    commit((draft) => OZONO.removeDependency(draft, task.id, depId));
  }

  function driveEmbedUrl(url) {
    if (!url) return null;
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) return "https://drive.google.com/embeddedfolderview?id=" + folderMatch[1] + "#grid";
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return "https://drive.google.com/file/d/" + fileMatch[1] + "/preview";
    return url;
  }

  function addComment() {
    if (!commentText.trim()) return;
    commit((draft) => {
      const t = draft.tasks.find((x) => x.id === task.id);
      t.comments.push({ id: OZONO.uid("c"), userId: user.id, text: commentText.trim(), ts: OZONO.nowISO() });
      OZONO.logHistory(t, `${user.name} comentó en la tarea.`);
      if (t.assigneeId !== user.id) OZONO.addNotification(draft, t.assigneeId, `${user.name} comentó en "${t.title}".`);
    });
    setCommentText("");
  }

  function saveDrive() {
    commit((draft) => {
      const t = draft.tasks.find((x) => x.id === task.id);
      t.driveUrl = driveDraft.trim();
      OZONO.logHistory(t, `${user.name} actualizó el enlace de Drive.`);
    });
  }

  function setMeta(metaId) {
    commit((draft) => {
      const t = draft.tasks.find((x) => x.id === task.id);
      t.metaId = metaId || null;
    });
  }

  function removeTask() {
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`)) return;
    commit((draft) => {
      OZONO.deleteTask(draft, task.id);
    });
    onClose();
  }

  function moveStatus(newStatus, reason) {
    commit((draft) => {
      const t = draft.tasks.find((x) => x.id === task.id);
      const from = t.status;
      t.status = newStatus;
      if (newStatus === "done") {
        OZONO.logHistory(t, `${user.name} aprobó la tarea.`);
        OZONO.addNotification(draft, t.assigneeId, `Tu tarea "${t.title}" fue aprobada.`);
        setJustApproved(true);
        setTimeout(() => setJustApproved(false), 900);
      } else if (from === "review" && newStatus === "progress") {
        OZONO.logHistory(t, `${user.name} rechazó la tarea. Motivo: ${reason}`);
        OZONO.addNotification(draft, t.assigneeId, `Tu tarea "${t.title}" fue rechazada: ${reason}`);
      } else {
        OZONO.logHistory(t, `${user.name} movió la tarea a "${OZONO.STATUS_COLUMNS.find((c) => c.id === newStatus).label}".`);
      }
      OZONO.runStatusAutomations(draft, t, from, newStatus);
    });
  }

  return (
    <Modal onClose={onClose} wide panelClassName={justApproved ? "approve-pulse" : ""}>
      <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div className="label-eyebrow" style={{ marginBottom: 6 }}>
            {project ? project.name : "Sin proyecto"} {product ? "· " + product.name : ""}
          </div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{task.title}</h2>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {OZONO.isDirector(user) && (
            <button className="btn btn-danger btn-sm" onClick={removeTask} title="Eliminar tarea">
              <Icon name="x" size={13} /> Eliminar
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" /></button>
        </div>
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div>
            <div className="field-label">Descripción</div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.5 }}>{task.description || "Sin descripción."}</p>
          </div>

          {blocked && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {blockingTasks
                .filter((t) => t.status !== "done")
                .map((t) => (
                  <div key={t.id} className="badge" style={{ borderColor: "rgba(255,92,61,0.4)", color: "var(--coral)", width: "fit-content" }}>
                    <Icon name="lock" size={12} /> Bloqueada por {OZONO.getRole(t.roleId).name}: {t.title}
                  </div>
                ))}
            </div>
          )}

          <div>
            <div className="field-label">Google Drive</div>
            {!task.driveUrl && configuredDriveUrl && (
              <div
                className="badge"
                style={{ width: "fit-content", marginBottom: 8, cursor: "pointer", color: "var(--sky)", borderColor: "rgba(92,201,255,0.4)" }}
                onClick={() => setDriveDraft(configuredDriveUrl)}
                title={configuredDriveUrl}
              >
                <Icon name="folder" size={11} /> Usar carpeta configurada de {product ? product.name : project.name}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                className="field-input"
                placeholder="Pega el enlace de la carpeta o archivo de Drive"
                value={driveDraft}
                onChange={(e) => setDriveDraft(e.target.value)}
              />
              <button className="btn btn-sm" onClick={saveDrive}>Guardar</button>
            </div>
            {task.driveUrl ? (
              <div style={{ border: "1px solid var(--border-soft)", borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
                <iframe
                  src={driveEmbedUrl(task.driveUrl)}
                  style={{ width: "100%", height: 220, border: "none" }}
                  title="Vista previa de Drive"
                />
                <div style={{ padding: 8, borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "flex-end" }}>
                  <a href={task.driveUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    <Icon name="link" size={13} /> Abrir en Drive
                  </a>
                </div>
              </div>
            ) : (
              <EmptyState icon="folder" title="Sin archivo vinculado" hint="Pega un enlace de Drive para previsualizarlo aquí." />
            )}
          </div>

          <div>
            <div className="field-label">Comentarios</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", marginBottom: 10 }}>
              {task.comments.length === 0 && <div className="hint">Aún no hay comentarios.</div>}
              {task.comments.map((c) => {
                const cu = OZONO.getUser(db, c.userId);
                return (
                  <div key={c.id} style={{ display: "flex", gap: 8 }}>
                    <Avatar user={cu} size="xs" />
                    <div className="comment-bubble" style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                        {cu ? cu.name : "—"} <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>· {relativeTime(c.ts)}</span>
                      </div>
                      <div style={{ fontSize: 13 }}>{c.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="field-input"
                placeholder="Escribe un comentario…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
              />
              <button className="btn btn-accent btn-sm" onClick={addComment}><Icon name="send" size={13} /></button>
            </div>
          </div>

          <div>
            <div className="field-label">Bitácora</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
              {task.history.slice().reverse().map((h) => (
                <div key={h.id} style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  <Icon name="clock" size={11} /> {h.text} <span style={{ opacity: 0.7 }}>· {relativeTime(h.ts)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="surface-card" style={{ padding: 14 }}>
            <div className="field-label">Responsable</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Avatar user={assignee} /> <span style={{ fontSize: 13.5 }}>{assignee ? assignee.name : "—"}</span>
            </div>
            <div className="field-label">Rol</div>
            <div style={{ marginBottom: 12 }}><RoleTag roleId={task.roleId} /></div>
            <div className="field-label">Fecha límite</div>
            <div style={{ fontSize: 13.5, marginBottom: 12, color: isOverdue(task) ? "var(--danger)" : "var(--text)" }}>
              {formatDate(task.dueDate)} {isOverdue(task) && "· vencida"}
            </div>
            <div className="field-label">Meta vinculada</div>
            <select className="field-select" value={task.metaId || ""} onChange={(e) => setMeta(e.target.value)}>
              <option value="">Sin vincular</option>
              {userMetas.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          <div className="surface-card" style={{ padding: 14 }}>
            <div className="field-label" style={{ marginBottom: 10 }}>
              Dependencias <span className="hint">· otras tareas que deben aprobarse primero</span>
            </div>
            {blockingTasks.length === 0 ? (
              <div className="hint" style={{ marginBottom: 10 }}>Sin dependencias — esta tarea no está bloqueada por ninguna otra.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {blockingTasks.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <Icon name={t.status === "done" ? "check" : "lock"} size={12} className="hint" />
                      <span style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                      <Badge color={t.status === "done" ? "var(--accent)" : "var(--amber)"} dot>{OZONO.getRole(t.roleId).name}</Badge>
                    </div>
                    {canEditDeps && (
                      <button className="btn btn-ghost btn-sm" style={{ padding: 3, color: "var(--danger)" }} onClick={() => removeDep(t.id)} title="Quitar dependencia">
                        <Icon name="x" size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canEditDeps && (
              addingDep ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <select className="field-select" value={depToAdd} onChange={(e) => setDepToAdd(e.target.value)}>
                    <option value="">Elegir tarea…</option>
                    {depCandidates.map((t) => (
                      <option key={t.id} value={t.id}>{OZONO.getRole(t.roleId).name} — {t.title}</option>
                    ))}
                  </select>
                  <button className="btn btn-accent btn-sm" disabled={!depToAdd} onClick={addDep}>Agregar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddingDep(false)}>Cancelar</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingDep(true)}>
                  <Icon name="plus" size={12} /> Agregar dependencia
                </button>
              )
            )}
          </div>

          <div className="surface-card" style={{ padding: 14 }}>
            <div className="field-label">Estado</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
              {OZONO.STATUS_COLUMNS.map((c) => (
                <span
                  key={c.id}
                  className="badge"
                  style={{
                    borderColor: c.id === task.status ? "var(--accent-dim)" : undefined,
                    color: c.id === task.status ? "var(--accent)" : undefined,
                  }}
                >
                  {c.label}
                </span>
              ))}
            </div>
            {!rejectMode ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {task.status !== "review" && task.status !== "done" && (
                  <button
                    className="btn btn-sm"
                    onClick={() => moveStatus(task.status === "todo" ? "progress" : "review")}
                    disabled={blocked || (task.status === "progress" && needsLinkForReview && !task.driveUrl)}
                  >
                    {task.status === "todo" ? "Iniciar" : "Enviar a revisión"}
                  </button>
                )}
                {task.status === "progress" && needsLinkForReview && !task.driveUrl && (
                  <span className="hint" style={{ color: "var(--coral)" }}>
                    <Icon name="link" size={11} /> Asigna un enlace de Drive antes de enviar a revisión
                  </span>
                )}
                {task.status === "review" && canApprove && (
                  <>
                    <button className="btn btn-accent btn-sm" onClick={() => moveStatus("done")}>
                      {justApproved ? <><Icon name="check" size={13} /> ¡Aprobada!</> : "Aprobar"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setRejectMode(true)}>Rechazar</button>
                  </>
                )}
                {task.status === "review" && !canApprove && (
                  <span className="hint">Esperando revisión del Director/Líder.</span>
                )}
                {task.status === "done" && <span className="hint">Tarea aprobada · lista para el calendario si es contenido.</span>}
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div className="field-label">Motivo del rechazo (obligatorio)</div>
                <textarea className="field-textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={!rejectReason.trim()}
                    onClick={() => {
                      moveStatus("progress", rejectReason.trim());
                      setRejectMode(false);
                      setRejectReason("");
                    }}
                  >
                    Confirmar rechazo
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setRejectMode(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// KANBAN
// ---------------------------------------------------------------------------
function TaskCard({ task, db, draggable, onOpen, onDragStart, blocked }) {
  const assignee = OZONO.getUser(db, task.assigneeId);
  const project = OZONO.getProject(db, task.projectId);
  const overdue = isOverdue(task);
  return (
    <div
      className={"task-card rise-in" + (blocked ? " blocked" : "")}
      draggable={draggable && !blocked}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onClick={() => onOpen(task)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{task.title}</div>
        {blocked && <Icon name="lock" size={13} className="hint" />}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {project && <Badge>{project.name}</Badge>}
        {task.metaId && <Badge color="var(--accent)" dot>Meta</Badge>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: overdue ? "var(--danger)" : "var(--text-faint)" }}>
          <Icon name="clock" size={12} /> {formatDate(task.dueDate)}
        </div>
        <Avatar user={assignee} size="xs" />
      </div>
    </div>
  );
}

// Cualquier miembro puede crear su propia tarea y autoasignársela — no depende
// de que el Director la reparta. Director/Líder puede además asignarla a otra
// persona que puedan gestionar.
function NewTaskForm({ db, user, assignableUsers, onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(db.projects[0]?.id || "");
  const project = db.projects.find((p) => p.id === projectId);
  const [productId, setProductId] = useState(project?.products[0]?.id || "");
  const [dueDate, setDueDate] = useState(OZONO.todayPlus(3));
  const [assigneeId, setAssigneeId] = useState(user.id);
  const [dependsOn, setDependsOn] = useState([]);
  const [showDeps, setShowDeps] = useState(false);

  function changeProject(id) {
    setProjectId(id);
    const p = db.projects.find((x) => x.id === id);
    setProductId(p?.products[0]?.id || "");
  }

  // Candidatas a bloquear esta tarea nueva: tareas de OTRO rol que no estén
  // aprobadas todavía, priorizando las del mismo proyecto si hay uno elegido.
  const depCandidates = db.tasks
    .filter((t) => t.status !== "done")
    .filter((t) => !projectId || t.projectId === projectId)
    .sort((a, b) => (a.projectId === projectId ? -1 : 1));

  function toggleDep(id) {
    setDependsOn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="surface-card rise-in" style={{ padding: 16, marginBottom: 16 }}>
      <div className="field-label">Nueva tarea{assignableUsers.length > 0 ? "" : " (se te asigna a ti)"}</div>
      <input className="field-input" placeholder="¿Qué hay que hacer?" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
      <textarea className="field-textarea" placeholder="Detalles (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <select className="field-select" value={projectId} onChange={(e) => changeProject(e.target.value)}>
          <option value="">Sin proyecto</option>
          {db.projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className="field-select" value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!project}>
          <option value="">Sin producto</option>
          {project?.products.map((pr) => (
            <option key={pr.id} value={pr.id}>{pr.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: assignableUsers.length > 0 ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 10 }}>
        <input className="field-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        {assignableUsers.length > 0 && (
          <select className="field-select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value={user.id}>Para mí ({user.name})</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} — {OZONO.getRole(u.roleId).name}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowDeps((s) => !s)}>
          <Icon name="lock" size={12} /> Depende de otra(s) tarea(s){dependsOn.length > 0 ? ` (${dependsOn.length})` : ""}
        </button>
        {showDeps && (
          <div className="surface-card" style={{ marginTop: 8, padding: 10, maxHeight: 160, overflowY: "auto" }}>
            {depCandidates.length === 0 ? (
              <div className="hint">No hay otras tareas activas para elegir como bloqueante.</div>
            ) : (
              depCandidates.map((t) => (
                <label key={t.id} style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 12.5, padding: "3px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={dependsOn.includes(t.id)} onChange={() => toggleDep(t.id)} />
                  <span>{t.title}</span>
                  <Badge>{OZONO.getRole(t.roleId).name}</Badge>
                </label>
              ))
            )}
            <div className="hint" style={{ marginTop: 6 }}>
              Esta tarea quedará bloqueada hasta que las que marques se aprueben.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-accent btn-sm"
          disabled={!title.trim()}
          onClick={() =>
            onCreate({
              title: title.trim(),
              description: description.trim(),
              projectId: projectId || null,
              productId: productId || null,
              dueDate,
              assigneeId,
              dependsOn,
            })
          }
        >
          Crear tarea
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// Vista de lista/tabla: complemento del Kanban visual para buscar, ordenar y
// filtrar libremente (por texto, rol o estado) en vez de navegar columnas.
const SORT_OPTIONS = [
  { id: "dueDate", label: "Fecha límite" },
  { id: "title", label: "Título" },
  { id: "status", label: "Estado" },
  { id: "role", label: "Rol" },
];

function TaskListView({ db, tasks, openTask }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");

  const rolesInPlay = [...new Set(tasks.map((t) => t.roleId))];

  const statusRank = Object.fromEntries(OZONO.STATUS_COLUMNS.map((c, i) => [c.id, i]));

  const filtered = tasks
    .filter((t) => !search.trim() || t.title.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((t) => !roleFilter || t.roleId === roleFilter)
    .filter((t) => !statusFilter || t.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "status") return statusRank[a.status] - statusRank[b.status];
      if (sortBy === "role") return OZONO.getRole(a.roleId).name.localeCompare(OZONO.getRole(b.roleId).name);
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });

  return (
    <div className="rise-in">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <input
          className="field-input"
          placeholder="Buscar por título…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <select className="field-select" style={{ maxWidth: 180 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Todos los roles</option>
          {rolesInPlay.map((r) => (
            <option key={r} value={r}>{OZONO.getRole(r).name}</option>
          ))}
        </select>
        <select className="field-select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {OZONO.STATUS_COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select className="field-select" style={{ maxWidth: 180 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>Ordenar por: {s.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="kanban" title="Sin tareas que coincidan con el filtro" />
      ) : (
        <div className="surface-card" style={{ overflow: "hidden" }}>
          <div className="task-list-row task-list-head hint">
            <span>Tarea</span>
            <span>Rol</span>
            <span>Responsable</span>
            <span>Estado</span>
            <span>Vence</span>
          </div>
          {filtered.map((t) => {
            const assignee = OZONO.getUser(db, t.assigneeId);
            const col = OZONO.STATUS_COLUMNS.find((c) => c.id === t.status);
            const blocked = OZONO.isBlocked(t, db);
            return (
              <div key={t.id} className="task-list-row task-list-item" onClick={() => openTask(t)}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  {blocked && <Icon name="lock" size={12} className="hint" />}
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600, fontSize: 13 }}>{t.title}</span>
                </span>
                <span><RoleTag roleId={t.roleId} /></span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar user={assignee} size="xs" /> <span style={{ fontSize: 12.5 }}>{assignee ? assignee.name : "—"}</span>
                </span>
                <span><Badge color={t.status === "done" ? "var(--accent)" : "var(--text-faint)"} dot>{col.label}</Badge></span>
                <span style={{ fontSize: 12.5, color: isOverdue(t) ? "var(--danger)" : "var(--text-faint)" }}>{formatDate(t.dueDate)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KanbanView({ db, user, commit, tasks, openTask }) {
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragTask, setDragTask] = useState(null);
  const [dragOverAvatar, setDragOverAvatar] = useState(null);
  const [filterUserId, setFilterUserId] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [viewMode, setViewMode] = useState("tablero"); // "tablero" | "lista"

  const role = OZONO.getRole(user.roleId);
  // El Director ve y reasigna a TODO el equipo, no solo a su propia área.
  const teammates = OZONO.isDirector(user)
    ? db.users.filter((u) => u.id !== user.id)
    : db.users.filter((u) => OZONO.getRole(u.roleId).area === role.area && u.id !== user.id);

  // Quién puede filtrar el tablero por miembro: Director (todos) o Líder (su área).
  const filterableUsers = OZONO.isDirector(user)
    ? db.users
    : OZONO.isLider(user)
    ? db.users.filter((u) => OZONO.getRole(u.roleId).area === role.area)
    : [];
  const visibleTasks = filterUserId ? tasks.filter((t) => t.assigneeId === filterUserId) : tasks;

  function canDrag(task) {
    if (OZONO.isDirector(user)) return true;
    const assignee = OZONO.getUser(db, task.assigneeId);
    if (OZONO.isLider(user)) return OZONO.canManageUser(user, assignee);
    return task.assigneeId === user.id;
  }

  function handleDrop(colId) {
    setDragOverCol(null);
    if (!dragTask) return;
    const task = dragTask;
    setDragTask(null);
    if (task.status === colId) return;
    if (OZONO.isBlocked(task, db) && colId !== "todo") return;

    if (colId === "done") {
      if (!OZONO.canApprove(user, task, db)) return;
      commit((draft) => {
        const t = draft.tasks.find((x) => x.id === task.id);
        const from = t.status;
        t.status = "done";
        OZONO.logHistory(t, `${user.name} aprobó la tarea.`);
        OZONO.addNotification(draft, t.assigneeId, `Tu tarea "${t.title}" fue aprobada.`);
        OZONO.runStatusAutomations(draft, t, from, "done");
      });
      return;
    }
    if (task.status === "review" && colId !== "done") {
      // devolver de revisión requiere motivo -> abrir modal de la tarea
      openTask(task, { forceReject: true });
      return;
    }
    if (colId === "review" && OZONO.CONTENT_ROLES.includes(task.roleId) && !task.driveUrl) {
      // no se puede enviar a revisión sin enlace de Drive: abrir la tarea para que lo agreguen
      openTask(task);
      return;
    }
    if (!canDrag(task)) return;
    commit((draft) => {
      const t = draft.tasks.find((x) => x.id === task.id);
      const from = t.status;
      t.status = colId;
      OZONO.logHistory(t, `${user.name} movió la tarea a "${OZONO.STATUS_COLUMNS.find((c) => c.id === colId).label}".`);
      OZONO.runStatusAutomations(draft, t, from, colId);
    });
  }

  function createTask({ title, description, projectId, productId, dueDate, assigneeId, dependsOn }) {
    const assignee = OZONO.getUser(db, assigneeId) || user;
    commit((draft) => {
      const newTask = {
        id: OZONO.uid("task"),
        title,
        description,
        projectId: projectId || null,
        productId: productId || null,
        roleId: assignee.roleId,
        assigneeId: assignee.id,
        status: "todo",
        dueDate,
        dependsOn: dependsOn || [],
        metaId: null,
        driveUrl: "",
        comments: [],
        history: [{ id: OZONO.uid("h"), text: `${user.name} creó la tarea.`, ts: OZONO.nowISO() }],
      };
      draft.tasks.push(newTask);
      if (assignee.id !== user.id) OZONO.addNotification(draft, assignee.id, `${user.name} te asignó la tarea "${title}".`);
    });
    setShowNewTask(false);
  }

  function handleAvatarDrop(targetUser) {
    setDragOverAvatar(null);
    if (!dragTask) return;
    const task = dragTask;
    setDragTask(null);
    if (!OZONO.isDirector(user) && !(OZONO.isLider(user) && OZONO.canManageUser(user, targetUser))) return;
    if (task.assigneeId === targetUser.id) return;
    commit((draft) => {
      const t = draft.tasks.find((x) => x.id === task.id);
      const prevAssignee = OZONO.getUser(draft, t.assigneeId);
      t.assigneeId = targetUser.id;
      OZONO.logHistory(t, `${user.name} reasignó la tarea de ${prevAssignee ? prevAssignee.name : "—"} a ${targetUser.name}.`);
      OZONO.addNotification(draft, targetUser.id, `Se te asignó la tarea "${t.title}".`);
    });
  }

  // Carga activa por persona (todo + progreso + revisión), para decidir con
  // criterio antes de asignar una tarea más — visible en el panel de Equipo.
  const activeCountByUser = {};
  db.tasks.forEach((t) => {
    if (t.status !== "done") activeCountByUser[t.assigneeId] = (activeCountByUser[t.assigneeId] || 0) + 1;
  });
  function workloadColor(count) {
    if (count >= 8) return "var(--danger)";
    if (count >= 5) return "var(--amber)";
    return "var(--text-faint)";
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", border: "1px solid var(--border-soft)", borderRadius: 999, padding: 3 }}>
            <button
              className={"btn btn-sm" + (viewMode === "tablero" ? " btn-accent" : " btn-ghost")}
              style={{ borderRadius: 999 }}
              onClick={() => setViewMode("tablero")}
            >
              <Icon name="kanban" size={13} /> Tablero
            </button>
            <button
              className={"btn btn-sm" + (viewMode === "lista" ? " btn-accent" : " btn-ghost")}
              style={{ borderRadius: 999 }}
              onClick={() => setViewMode("lista")}
            >
              <Icon name="grid" size={13} /> Lista
            </button>
          </div>
          {filterableUsers.length > 0 && (
            <>
              <span className="label-eyebrow">Ver de:</span>
              <select className="field-select" style={{ maxWidth: 260 }} value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
                <option value="">Todo el equipo</option>
                {filterableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {OZONO.getRole(u.roleId).name}</option>
                ))}
              </select>
              {filterUserId && <button className="btn btn-ghost btn-sm" onClick={() => setFilterUserId("")}>Quitar filtro</button>}
            </>
          )}
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowNewTask((s) => !s)}>
          <Icon name="plus" size={13} /> Nueva tarea
        </button>
      </div>

      {showNewTask && (
        <NewTaskForm db={db} user={user} assignableUsers={teammates} onCreate={createTask} onCancel={() => setShowNewTask(false)} />
      )}

      {viewMode === "lista" ? (
        <TaskListView db={db} tasks={visibleTasks} openTask={openTask} />
      ) : (
      <div className="kanban-layout">
      <div className="kanban-scroll">
        {OZONO.STATUS_COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={"kanban-col" + (dragOverCol === col.id ? " drag-over" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px 10px" }}>
                <span className="label-eyebrow">{col.label}</span>
                <span className="hint">{colTasks.length}</span>
              </div>
              {colTasks.length === 0 ? (
                <div className="hint" style={{ padding: "10px 6px" }}>Sin tareas</div>
              ) : (
                colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    db={db}
                    draggable={canDrag(t)}
                    blocked={OZONO.isBlocked(t, db)}
                    onOpen={openTask}
                    onDragStart={(e, task) => setDragTask(task)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      <div className="surface-card rise-in" style={{ padding: 14, position: "sticky", top: 90 }}>
        <div className="label-eyebrow" style={{ marginBottom: 10 }}>Equipo · {OZONO.isDirector(user) ? "todas las áreas" : role.area}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teammates.map((tm) => (
            <div
              key={tm.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverAvatar(tm.id);
              }}
              onDragLeave={() => setDragOverAvatar(null)}
              onDrop={() => handleAvatarDrop(tm)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 10,
                border: "1px solid " + (dragOverAvatar === tm.id ? "var(--accent-dim)" : "transparent"),
                background: dragOverAvatar === tm.id ? "rgba(198,255,61,0.06)" : "transparent",
              }}
            >
              <Avatar user={tm} size="xs" />
              <span style={{ fontSize: 12.5, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tm.name}</span>
              <span
                className="font-mono"
                title="Tareas activas (no aprobadas)"
                style={{ fontSize: 10.5, color: workloadColor(activeCountByUser[tm.id] || 0), fontWeight: 700 }}
              >
                {activeCountByUser[tm.id] || 0}
              </span>
            </div>
          ))}
        </div>
        {(OZONO.isDirector(user) || OZONO.isLider(user)) && (
          <div className="hint" style={{ marginTop: 10 }}>Suelta una tarjeta aquí para reasignar · el número es su carga activa.</div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// METAS
// ---------------------------------------------------------------------------
function MetaCard({ meta, db, user, commit }) {
  const owner = OZONO.getUser(db, meta.userId);
  const canApproveMeta = OZONO.isDirector(user) || (OZONO.isLider(user) && OZONO.canManageUser(user, owner));

  function toggleChecklist(i) {
    if (!(meta.userId === user.id || OZONO.isDirector(user) || OZONO.isLider(user))) return;
    commit((draft) => {
      const m = draft.metas.find((x) => x.id === meta.id);
      m.checklist[i].done = !m.checklist[i].done;
    });
  }

  function approveMeta() {
    commit((draft) => {
      const m = draft.metas.find((x) => x.id === meta.id);
      m.status = "aprobada";
      OZONO.addNotification(draft, m.userId, `Tu meta "${m.title}" fue aprobada por el Director.`);
    });
  }

  const canDelete = OZONO.isDirector(user) || (meta.userId === user.id && meta.status === "propuesta");
  function removeMeta() {
    if (!window.confirm(`¿Eliminar la meta "${meta.title}"?`)) return;
    commit((draft) => OZONO.deleteMeta(draft, meta.id));
  }

  let progressEl = null;
  if (meta.type === "numero") {
    const pct = (meta.current / meta.target) * 100;
    progressEl = (
      <>
        <ProgressBar pct={pct} />
        <div className="hint font-mono" style={{ marginTop: 6 }}>{meta.current} / {meta.target}</div>
      </>
    );
  } else if (meta.type === "porcentaje") {
    progressEl = (
      <>
        <ProgressBar pct={meta.current} />
        <div className="hint font-mono" style={{ marginTop: 6 }}>{meta.current}% de {meta.target}%</div>
      </>
    );
  } else if (meta.type === "checklist") {
    const done = meta.checklist.filter((c) => c.done).length;
    progressEl = (
      <>
        <ProgressBar pct={(done / meta.checklist.length) * 100} />
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          {meta.checklist.map((c, i) => (
            <label key={i} style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={c.done} onChange={() => toggleChecklist(i)} />
              <span style={{ textDecoration: c.done ? "line-through" : "none", color: c.done ? "var(--text-faint)" : "var(--text)" }}>{c.label}</span>
            </label>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="stat-card rise-in" style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, position: "relative", zIndex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, paddingRight: 10 }}>{meta.title}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <Badge color={meta.status === "aprobada" ? "var(--accent)" : "var(--amber)"} dot>
            {meta.status === "aprobada" ? "Aprobada" : "Propuesta"}
          </Badge>
          {canDelete && (
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", padding: 4 }} onClick={removeMeta} title="Eliminar meta">
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, position: "relative", zIndex: 1 }}>
        <Badge>{meta.scope === "equipo" ? "Contribución de equipo" : "Contribución personal"}</Badge>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{progressEl}</div>
      {meta.status === "propuesta" && canApproveMeta && (
        <button className="btn btn-accent btn-sm" style={{ marginTop: 12, position: "relative", zIndex: 1 }} onClick={approveMeta}>
          Aprobar meta
        </button>
      )}
    </div>
  );
}

function NewMetaForm({ user, onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("numero");
  const [target, setTarget] = useState(10);
  const [scope, setScope] = useState("personal");
  const [items, setItems] = useState("");

  return (
    <div className="surface-card rise-in" style={{ padding: 16 }}>
      <div className="field-label">Nueva meta propuesta</div>
      <input className="field-input" placeholder="Título de la meta" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <select className="field-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="numero">Número concreto</option>
          <option value="porcentaje">Porcentaje</option>
          <option value="checklist">Checklist</option>
        </select>
        <select className="field-select" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="personal">Contribución personal</option>
          <option value="equipo">Contribución de equipo</option>
        </select>
      </div>
      {type !== "checklist" ? (
        <input className="field-input" type="number" placeholder="Meta objetivo" value={target} onChange={(e) => setTarget(Number(e.target.value))} style={{ marginBottom: 10 }} />
      ) : (
        <textarea className="field-textarea" placeholder="Un ítem por línea" value={items} onChange={(e) => setItems(e.target.value)} style={{ marginBottom: 10 }} />
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-accent btn-sm"
          disabled={!title.trim()}
          onClick={() =>
            onCreate({
              title: title.trim(),
              type,
              scope,
              target: type !== "checklist" ? target : undefined,
              checklist: type === "checklist" ? items.split("\n").filter(Boolean).map((l) => ({ label: l.trim(), done: false })) : undefined,
            })
          }
        >
          Enviar al Director
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function MetasView({ db, user, commit }) {
  const [viewUserId, setViewUserId] = useState(user.id);
  const [showForm, setShowForm] = useState(false);
  const canSeeAll = OZONO.isDirector(user) || OZONO.isLider(user);
  const options = canSeeAll ? db.users : [user];
  const metas = db.metas.filter((m) => m.userId === viewUserId).sort((a, b) => (a.status === b.status ? 0 : a.status === "propuesta" ? -1 : 1));

  function createMeta(payload) {
    commit((draft) => {
      draft.metas.push({
        id: OZONO.uid("meta"),
        userId: viewUserId,
        month: new Date().toISOString().slice(0, 7),
        status: "propuesta",
        current: 0,
        ...payload,
      });
      const owner = OZONO.getUser(draft, viewUserId);
      const director = draft.users.find((u) => u.level === "director");
      if (director) OZONO.addNotification(draft, director.id, `${owner.name} propuso una nueva meta: "${payload.title}".`);
    });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22 }}>Metas del mes</h2>
          <div className="hint">Mínimo 3 metas por colaborador · personales o de equipo</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {canSeeAll && (
            <select className="field-select" value={viewUserId} onChange={(e) => setViewUserId(e.target.value)}>
              {options.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-accent btn-sm" onClick={() => setShowForm((s) => !s)}>
            <Icon name="plus" size={13} /> Proponer meta
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ marginBottom: 18 }}>
          <NewMetaForm user={user} onCreate={createMeta} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {metas.length < 3 && (
        <div className="hint" style={{ marginBottom: 12 }}>
          <Icon name="alert" size={12} /> Este colaborador tiene menos de 3 metas activas este mes.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {metas.map((m) => (
          <MetaCard key={m.id} meta={m} db={db} user={user} commit={commit} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// REQUISICIONES
// ---------------------------------------------------------------------------
function NewRequisicionForm({ db, user, onCreate, onCancel }) {
  const others = db.users.filter((u) => u.id !== user.id);
  const areas = OZONO.getAreas();
  const [mode, setMode] = useState("persona"); // "persona" | "area"
  const [toUserId, setToUserId] = useState(others[0]?.id || "");
  const [toAreaId, setToAreaId] = useState(areas[0] || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function submit() {
    if (mode === "persona") onCreate({ toUserId, toAreaId: null, title: title.trim(), description: description.trim() });
    else onCreate({ toUserId: null, toAreaId, title: title.trim(), description: description.trim() });
  }

  return (
    <div className="surface-card rise-in" style={{ padding: 16, marginBottom: 18 }}>
      <div className="field-label">Nueva requisición</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button className={"btn btn-sm" + (mode === "persona" ? " btn-accent" : "")} onClick={() => setMode("persona")}>A una persona</button>
        <button className={"btn btn-sm" + (mode === "area" ? " btn-accent" : "")} onClick={() => setMode("area")}>A toda un área (ej. Marketing)</button>
      </div>
      {mode === "persona" ? (
        <select className="field-select" value={toUserId} onChange={(e) => setToUserId(e.target.value)} style={{ marginBottom: 10 }}>
          {others.map((u) => (
            <option key={u.id} value={u.id}>{u.name} — {OZONO.getRole(u.roleId).name}</option>
          ))}
        </select>
      ) : (
        <>
          <select className="field-select" value={toAreaId} onChange={(e) => setToAreaId(e.target.value)} style={{ marginBottom: 6 }}>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="hint" style={{ marginBottom: 10 }}>
            La verá cualquier persona del área "{toAreaId}" y el primero en aceptarla se la queda como tarea.
          </div>
        </>
      )}
      <input className="field-input" placeholder="¿Qué necesitas?" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
      <textarea className="field-textarea" placeholder="Detalles adicionales" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-accent btn-sm" disabled={!title.trim() || (mode === "persona" ? !toUserId : !toAreaId)} onClick={submit}>
          Enviar requisición
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function RequisicionRow({ req, db, user, commit }) {
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const from = OZONO.getUser(db, req.fromUserId);
  const to = req.toUserId ? OZONO.getUser(db, req.toUserId) : null;
  const isDirectReceiver = req.toUserId === user.id;
  const isAreaReceiver = !req.toUserId && req.toAreaId && OZONO.getRole(user.roleId).area === req.toAreaId;
  const isReceiver = isDirectReceiver || isAreaReceiver;

  function accept() {
    commit((draft) => {
      const r = draft.requisiciones.find((x) => x.id === req.id);
      r.status = "aceptada";
      r.toUserId = user.id; // si era de área, queda registrado quién la tomó
      const newTask = {
        id: OZONO.uid("task"),
        title: r.title,
        description: r.description,
        projectId: null,
        productId: null,
        roleId: user.roleId,
        assigneeId: user.id,
        status: "todo",
        dueDate: OZONO.todayPlus(3),
        dependsOn: [],
        metaId: null,
        driveUrl: "",
        comments: [],
        history: [{ id: OZONO.uid("h"), text: `Requisición aceptada de ${from.name}.`, ts: OZONO.nowISO() }],
      };
      r.taskId = newTask.id;
      draft.tasks.push(newTask);
      OZONO.addNotification(draft, from.id, `${user.name} aceptó tu requisición "${r.title}".`);
    });
  }

  function reject() {
    commit((draft) => {
      const r = draft.requisiciones.find((x) => x.id === req.id);
      r.status = "rechazada";
      r.motivo = reason.trim();
      OZONO.addNotification(draft, from.id, `${user.name} rechazó tu requisición "${r.title}": ${reason.trim()}`);
    });
    setShowReject(false);
  }

  const statusColor = req.status === "pendiente" ? "var(--amber)" : req.status === "aceptada" ? "var(--accent)" : "var(--danger)";
  const canDelete = OZONO.isDirector(user) || req.fromUserId === user.id;
  function removeReq() {
    if (!window.confirm(`¿Eliminar la requisición "${req.title}"?`)) return;
    commit((draft) => OZONO.deleteRequisicion(draft, req.id));
  }

  return (
    <div className="surface-card rise-in" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Avatar user={from} size="xs" /> <Icon name="swap" size={13} className="hint" />
          {to ? <Avatar user={to} size="xs" /> : <Badge>Área: {req.toAreaId}</Badge>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Badge color={statusColor} dot>{req.status === "pendiente" ? "Pendiente" : req.status === "aceptada" ? "Aceptada" : "Rechazada"}</Badge>
          {canDelete && (
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", padding: 4 }} onClick={removeReq} title="Eliminar requisición">
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{req.title}</div>
      {req.description && <div className="hint" style={{ marginBottom: 8 }}>{req.description}</div>}
      {req.motivo && <div className="hint" style={{ color: "var(--danger)" }}>Motivo: {req.motivo}</div>}
      {isReceiver && req.status === "pendiente" && !showReject && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-accent btn-sm" onClick={accept}>Aceptar</button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowReject(true)}>Rechazar</button>
        </div>
      )}
      {isReceiver && showReject && (
        <div style={{ marginTop: 8 }}>
          <input className="field-input" placeholder="Motivo del rechazo" value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-danger btn-sm" disabled={!reason.trim()} onClick={reject}>Confirmar</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReject(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequisicionesView({ db, user, commit }) {
  const [tab, setTab] = useState("recibidas");
  const [showForm, setShowForm] = useState(false);
  const myArea = OZONO.getRole(user.roleId).area;
  const recibidas = db.requisiciones.filter(
    (r) => r.toUserId === user.id || (!r.toUserId && r.toAreaId === myArea && r.status === "pendiente")
  );
  const enviadas = db.requisiciones.filter((r) => r.fromUserId === user.id);
  const list = tab === "recibidas" ? recibidas : enviadas;

  function createReq(payload) {
    commit((draft) => {
      draft.requisiciones.push({
        id: OZONO.uid("req"),
        fromUserId: user.id,
        status: "pendiente",
        motivo: "",
        ts: OZONO.nowISO(),
        taskId: null,
        ...payload,
      });
      if (payload.toUserId) {
        OZONO.addNotification(draft, payload.toUserId, `${user.name} te envió una requisición: "${payload.title}".`);
      } else if (payload.toAreaId) {
        OZONO.getUsersInArea(draft, payload.toAreaId).forEach((u) => {
          if (u.id !== user.id) OZONO.addNotification(draft, u.id, `${user.name} envió una requisición al área ${payload.toAreaId}: "${payload.title}".`);
        });
      }
    });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22 }}>Requisiciones</h2>
          <div className="hint">Pide trabajo a otro miembro o a toda un área (ej. Marketing) — debe aceptarla antes de volverse tarea.</div>
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowForm((s) => !s)}><Icon name="plus" size={13} /> Nueva requisición</button>
      </div>

      {showForm && <NewRequisicionForm db={db} user={user} onCreate={createReq} onCancel={() => setShowForm(false)} />}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={"btn btn-sm" + (tab === "recibidas" ? " btn-accent" : "")} onClick={() => setTab("recibidas")}>Recibidas ({recibidas.length})</button>
        <button className={"btn btn-sm" + (tab === "enviadas" ? " btn-accent" : "")} onClick={() => setTab("enviadas")}>Enviadas ({enviadas.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="swap" title="No hay requisiciones aquí" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {list.map((r) => (
            <RequisicionRow key={r.id} req={r} db={db} user={user} commit={commit} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PROYECTOS
// ---------------------------------------------------------------------------
function NewProjectForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  return (
    <div className="surface-card rise-in" style={{ padding: 16, marginBottom: 16 }}>
      <div className="field-label">Nuevo proyecto</div>
      <input className="field-input" placeholder="Nombre del proyecto o cliente" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-accent btn-sm" disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Crear</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function ProyectosView({ db, user, commit, openTask }) {
  const [showForm, setShowForm] = useState(false);
  const [addingProductTo, setAddingProductTo] = useState(null);
  const [productName, setProductName] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(db.projects.map((p) => p.id)));

  function createProject(name) {
    commit((draft) => {
      draft.projects.push({ id: OZONO.uid("p"), name, products: [] });
    });
    setShowForm(false);
  }

  function createProduct(projectId) {
    if (!productName.trim()) return;
    commit((draft) => {
      const p = draft.projects.find((x) => x.id === projectId);
      p.products.push({ id: OZONO.uid("pr"), name: productName.trim() });
    });
    setProductName("");
    setAddingProductTo(null);
  }

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function removeProject(e, project) {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar el proyecto "${project.name}" y todas sus tareas? Esta acción no se puede deshacer.`)) return;
    commit((draft) => OZONO.deleteProject(draft, project.id));
  }

  function removeProduct(e, projectId, product) {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar el producto "${product.name}" y sus tareas? Esta acción no se puede deshacer.`)) return;
    commit((draft) => OZONO.deleteProduct(draft, projectId, product.id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22 }}>Proyectos</h2>
          <div className="hint">SUPER OZONO como marca sombrilla — cada proyecto agrupa uno o varios productos.</div>
        </div>
        {OZONO.isDirector(user) && (
          <button className="btn btn-accent btn-sm" onClick={() => setShowForm((s) => !s)}><Icon name="plus" size={13} /> Nuevo proyecto</button>
        )}
      </div>

      {showForm && <NewProjectForm onCreate={createProject} onCancel={() => setShowForm(false)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {db.projects.map((p) => {
          const isOpen = expanded.has(p.id);
          const projectTasks = db.tasks.filter((t) => t.projectId === p.id);
          return (
            <div key={p.id} className="surface-card rise-in" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggle(p.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={15} />
                  <span className="font-display" style={{ fontSize: 16.5, fontWeight: 600 }}>{p.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge>{projectTasks.length} tareas</Badge>
                  {OZONO.isDirector(user) && (
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={(e) => removeProject(e, p)} title="Eliminar proyecto">
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {p.products.map((prod) => {
                    const prodTasks = db.tasks.filter((t) => t.productId === prod.id);
                    const done = prodTasks.filter((t) => t.status === "done").length;
                    return (
                      <div key={prod.id} className="stat-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8, position: "relative", zIndex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{prod.name}</div>
                          {OZONO.isDirector(user) && (
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", padding: 4 }} onClick={(e) => removeProduct(e, p.id, prod)} title="Eliminar producto">
                              <Icon name="x" size={12} />
                            </button>
                          )}
                        </div>
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <ProgressBar pct={prodTasks.length ? (done / prodTasks.length) * 100 : 0} />
                          <div className="hint font-mono" style={{ marginTop: 6 }}>{done}/{prodTasks.length} listas</div>
                        </div>
                        {prodTasks.length > 0 && (
                          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, position: "relative", zIndex: 1 }}>
                            {prodTasks.slice(0, 4).map((t) => (
                              <div
                                key={t.id}
                                onClick={() => openTask(t)}
                                style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                              >
                                · {t.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {OZONO.isDirector(user) && (
                    <div className="stat-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {addingProductTo === p.id ? (
                        <div style={{ width: "100%", position: "relative", zIndex: 1 }}>
                          <input className="field-input" placeholder="Nombre del producto" value={productName} onChange={(e) => setProductName(e.target.value)} style={{ marginBottom: 8 }} />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-accent btn-sm" onClick={() => createProduct(p.id)}>Agregar</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setAddingProductTo(null)}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setAddingProductTo(p.id)}>
                          <Icon name="plus" size={13} /> Nuevo producto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EQUIPO — el Director asigna roles/nivel y registra miembros
// ---------------------------------------------------------------------------
const NOTIF_CHANNELS = [
  { id: "app", label: "Solo en la app" },
  { id: "email", label: "En la app + Email" },
  { id: "whatsapp", label: "En la app + WhatsApp" },
  { id: "sms", label: "En la app + SMS" },
];

function TeamMemberRow({ db, member, actingUser, commit }) {
  const role = OZONO.getRole(member.roleId);
  const canEditThis = OZONO.isDirector(actingUser) && member.id !== actingUser.id;
  const [resetting, setResetting] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);

  function setRole(roleId) {
    commit((draft) => OZONO.updateUserRole(draft, member.id, roleId, null));
  }
  function setLevel(level) {
    commit((draft) => OZONO.updateUserRole(draft, member.id, null, level));
  }
  function setPhone(phone) {
    commit((draft) => {
      draft.users.find((u) => u.id === member.id).phone = phone;
    });
  }
  function setChannel(channel) {
    commit((draft) => {
      draft.users.find((u) => u.id === member.id).notifyChannel = channel;
    });
  }
  async function resetPassword() {
    if (newPass.length < 4) return;
    setBusy(true);
    const { passwordSalt, passwordHash } = await OZONO.makeCredentials(newPass);
    commit((draft) => {
      OZONO.setUserPasswordFields(draft, member.id, passwordSalt, passwordHash);
      OZONO.addNotification(draft, member.id, `El Director restableció tu contraseña. Pídele la nueva clave directamente.`);
    });
    setBusy(false);
    setResetting(false);
    setNewPass("");
  }

  const todayTasks = db.tasks.filter((t) => t.assigneeId === member.id && t.status !== "done" && (t.dueDate === new Date().toISOString().slice(0, 10) || t.status === "progress"));
  const reminderMsg = `Hola ${member.name.split(" ")[0]}, este es tu recordatorio de SUPER OZONO: ${todayTasks.length ? "tienes " + todayTasks.length + " tarea(s) hoy — " + todayTasks.slice(0, 3).map((t) => t.title).join(", ") : "no tienes tareas urgentes hoy"}.`;

  function removeMember() {
    if (!window.confirm(`¿Quitar a ${member.name} del equipo? Sus tareas pendientes pasarán al Director.`)) return;
    commit((draft) => OZONO.removeUser(draft, member.id));
  }

  return (
    <div className="surface-card rise-in" style={{ padding: 14 }}>
      <div className="team-row-grid">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Avatar user={member} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{member.name}</div>
            <UsernameTag username={member.username} />
          </div>
        </div>
        {canEditThis ? (
          <select className="field-select" value={member.roleId} onChange={(e) => setRole(e.target.value)}>
            {OZONO.ROLES.filter((r) => r.id !== "director").map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: 12.5 }}>{role.name}</div>
        )}
        {canEditThis ? (
          <select className="field-select" value={member.level} onChange={(e) => setLevel(e.target.value)}>
            <option value={OZONO.LEVELS.COLABORADOR}>Colaborador</option>
            <option value={OZONO.LEVELS.LIDER}>Líder</option>
          </select>
        ) : (
          <LevelTag level={member.level} />
        )}
        <input
          className="field-input"
          placeholder="Teléfono con código de país"
          defaultValue={member.phone || ""}
          onBlur={(e) => setPhone(e.target.value.trim())}
          disabled={!canEditThis && member.id !== actingUser.id}
        />
        <select
          className="field-select"
          value={member.notifyChannel || "app"}
          onChange={(e) => setChannel(e.target.value)}
          disabled={!canEditThis && member.id !== actingUser.id}
        >
          {NOTIF_CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <WhatsappButton phone={member.phone} message={reminderMsg} label="Recordar tareas de hoy" />
        {canEditThis && !resetting && (
          <button className="btn btn-ghost btn-sm" onClick={() => setResetting(true)}>Restablecer contraseña</button>
        )}
        {canEditThis && resetting && (
          <>
            <input className="field-input" type="password" placeholder="Nueva contraseña" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={{ maxWidth: 180 }} />
            <button className="btn btn-accent btn-sm" disabled={newPass.length < 4 || busy} onClick={resetPassword}>{busy ? "Guardando…" : "Guardar"}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setResetting(false)}>Cancelar</button>
          </>
        )}
        {canEditThis && (
          <button className="btn btn-danger btn-sm" onClick={removeMember} style={{ marginLeft: "auto" }}>
            <Icon name="x" size={12} /> Quitar del equipo
          </button>
        )}
      </div>
    </div>
  );
}

function EquipoView({ db, user, commit }) {
  const [showForm, setShowForm] = useState(false);

  async function register({ name, roleId, password }) {
    const { passwordSalt, passwordHash } = await OZONO.makeCredentials(password);
    commit((draft) => {
      const newUser = OZONO.createUser(draft, { name, roleId, passwordSalt, passwordHash });
      OZONO.addNotification(draft, draft.users.find((u) => u.level === "director").id, `${newUser.name} se registró como ${OZONO.getRole(newUser.roleId).name}. Confirma su rol/nivel en Equipo.`);
    });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22 }}>Equipo</h2>
          <div className="hint">Asigna rol y nivel de acceso a cada miembro, y registra nuevas cuentas.</div>
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowForm((s) => !s)}>
          <Icon name="userPlus" size={13} /> Registrar miembro
        </button>
      </div>

      {showForm && <RegisterForm db={db} onRegister={register} onCancel={() => setShowForm(false)} />}

      <div
        className="hint team-row-grid"
        style={{ padding: "0 14px", marginBottom: 8 }}
      >
        <span>Miembro</span>
        <span>Rol</span>
        <span>Nivel</span>
        <span>Teléfono</span>
        <span>Notificaciones</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {db.users.map((m) => (
          <TeamMemberRow key={m.id} db={db} member={m} actingUser={user} commit={commit} />
        ))}
      </div>

      <div className="hint" style={{ marginTop: 16, maxWidth: 640 }}>
        El envío real de notificaciones por WhatsApp o SMS requiere conectar un backend con Twilio o la API de WhatsApp
        Business (fase 2). Por ahora, esta preferencia queda guardada y todo colaborador recibe sus notificaciones dentro
        de la app.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AUTOMATIZACIONES — reglas "cuando X entonces Y" configurables sin código
// ---------------------------------------------------------------------------
const AUTOMATION_KINDS = [
  { id: "status_notify", label: "Notificar por cambio de estado" },
  { id: "due_soon_notify", label: "Notificar por fecha próxima a vencer" },
  { id: "recurring_task", label: "Crear tarea recurrente" },
];
const NOTIFY_TARGETS = [
  { id: "director", label: "Al Director" },
  { id: "lider", label: "Al Líder del área" },
  { id: "assignee", label: "Al responsable de la tarea" },
];

function describeAutomation(a) {
  if (a.kind === "status_notify") {
    const roleLabel = a.roleFilter ? OZONO.getRole(a.roleFilter).name : "cualquier rol";
    const statusLabel = OZONO.STATUS_COLUMNS.find((c) => c.id === a.toStatus)?.label || a.toStatus;
    const targetLabel = NOTIFY_TARGETS.find((t) => t.id === a.notifyTarget)?.label || "";
    return `Cuando una tarea de ${roleLabel} pase a "${statusLabel}" → ${targetLabel.toLowerCase()}.`;
  }
  if (a.kind === "due_soon_notify") {
    const targetLabel = NOTIFY_TARGETS.find((t) => t.id === a.notifyTarget)?.label || "";
    return `Cuando falten ${a.daysBefore} día(s) para vencer una tarea sin terminar → ${targetLabel.toLowerCase()}.`;
  }
  if (a.kind === "recurring_task") {
    return `Cada ${a.everyDays} día(s), crear "${a.title}" con ${a.dueInDays} día(s) de plazo.`;
  }
  return a.name;
}

function NewAutomationForm({ db, onCreate, onCancel }) {
  const [kind, setKind] = useState("status_notify");
  const [name, setName] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toStatus, setToStatus] = useState("review");
  const [notifyTarget, setNotifyTarget] = useState("director");
  const [message, setMessage] = useState("");
  const [daysBefore, setDaysBefore] = useState(1);
  const [assigneeId, setAssigneeId] = useState(db.users[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [everyDays, setEveryDays] = useState(7);
  const [dueInDays, setDueInDays] = useState(2);

  const canSubmit = name.trim() && (kind !== "recurring_task" || (title.trim() && assigneeId));

  function submit() {
    const base = { name: name.trim(), kind };
    let payload = base;
    if (kind === "status_notify") payload = { ...base, roleFilter: roleFilter || null, toStatus, notifyTarget, message: message.trim() };
    if (kind === "due_soon_notify") payload = { ...base, daysBefore: Number(daysBefore), notifyTarget, message: message.trim() };
    if (kind === "recurring_task") payload = { ...base, assigneeId, title: title.trim(), description: description.trim(), everyDays: Number(everyDays), dueInDays: Number(dueInDays) };
    onCreate(payload);
  }

  return (
    <div className="surface-card rise-in" style={{ padding: 16, marginBottom: 16 }}>
      <div className="field-label">Nueva automatización</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {AUTOMATION_KINDS.map((k) => (
          <button key={k.id} className={"btn btn-sm" + (kind === k.id ? " btn-accent" : "")} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <input className="field-input" placeholder="Nombre de la regla (ej. Avisar cuando Copy entrega)" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />

      {kind === "status_notify" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <select className="field-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Cualquier rol</option>
              {OZONO.ROLES.filter((r) => r.id !== "director").map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select className="field-select" value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
              {OZONO.STATUS_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>pasa a: {c.label}</option>
              ))}
            </select>
          </div>
          <select className="field-select" value={notifyTarget} onChange={(e) => setNotifyTarget(e.target.value)} style={{ marginBottom: 10 }}>
            {NOTIFY_TARGETS.map((t) => (
              <option key={t.id} value={t.id}>Notificar: {t.label}</option>
            ))}
          </select>
          <textarea className="field-textarea" placeholder='Mensaje (opcional). Usa {{tarea}}, {{responsable}}, {{rol}}' value={message} onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: 10 }} />
        </>
      )}

      {kind === "due_soon_notify" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input className="field-input" type="number" min="0" placeholder="Días antes de vencer" value={daysBefore} onChange={(e) => setDaysBefore(e.target.value)} />
            <select className="field-select" value={notifyTarget} onChange={(e) => setNotifyTarget(e.target.value)}>
              {NOTIFY_TARGETS.map((t) => (
                <option key={t.id} value={t.id}>Notificar: {t.label}</option>
              ))}
            </select>
          </div>
          <textarea className="field-textarea" placeholder='Mensaje (opcional). Usa {{tarea}}, {{responsable}}, {{rol}}' value={message} onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: 10 }} />
        </>
      )}

      {kind === "recurring_task" && (
        <>
          <select className="field-select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={{ marginBottom: 10 }}>
            {db.users.map((u) => (
              <option key={u.id} value={u.id}>Asignar a: {u.name}</option>
            ))}
          </select>
          <input className="field-input" placeholder="Título de la tarea a crear" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 10 }} />
          <textarea className="field-textarea" placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input className="field-input" type="number" min="1" placeholder="Repetir cada (días)" value={everyDays} onChange={(e) => setEveryDays(e.target.value)} />
            <input className="field-input" type="number" min="1" placeholder="Plazo de entrega (días)" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} />
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-accent btn-sm" disabled={!canSubmit} onClick={submit}>Crear regla</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function AutomatizacionesView({ db, user, commit }) {
  const [showForm, setShowForm] = useState(false);
  const automations = db.automations || [];

  function createAuto(payload) {
    commit((draft) => OZONO.createAutomation(draft, payload));
    setShowForm(false);
  }
  function toggle(id) {
    commit((draft) => OZONO.toggleAutomation(draft, id));
  }
  function remove(id) {
    if (!window.confirm("¿Eliminar esta automatización?")) return;
    commit((draft) => OZONO.deleteAutomation(draft, id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22 }}>Automatizaciones</h2>
          <div className="hint">Reglas "cuando X entonces Y" — sin pedir un cambio de código cada vez.</div>
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowForm((s) => !s)}>
          <Icon name="plus" size={13} /> Nueva automatización
        </button>
      </div>

      {showForm && <NewAutomationForm db={db} onCreate={createAuto} onCancel={() => setShowForm(false)} />}

      {automations.length === 0 ? (
        <EmptyState icon="shield" title="Sin automatizaciones todavía" hint="Crea una regla para que la app avise o genere tareas por ti." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {automations.map((a) => (
            <div key={a.id} className="surface-card rise-in" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, opacity: a.active ? 1 : 0.55 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 3 }}>{a.name}</div>
                <div className="hint">{describeAutomation(a)}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                <button className={"btn btn-sm" + (a.active ? " btn-accent" : "")} onClick={() => toggle(a.id)}>
                  {a.active ? "Activa" : "Pausada"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => remove(a.id)} title="Eliminar">
                  <Icon name="x" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="hint" style={{ marginTop: 16, maxWidth: 640 }}>
        Las reglas se evalúan cuando ocurre el evento (un cambio de estado) o cuando alguien abre la app (fechas próximas
        a vencer y tareas recurrentes) — no hay un servidor corriendo en segundo plano, así que si nadie abre Super Ozono
        en un día, esa revisión se pone al día en cuanto alguien entra.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// INFORMES — descarga en PDF con el logo, resumen por rol y listado completo
// ---------------------------------------------------------------------------
function InformesView({ db, user }) {
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [busy, setBusy] = useState(false);

  const opts = { roleFilter, statusFilter, fromDate, toDate, generatedByName: user.name };
  const preview = OZONO_REPORTS.filterTasks(db, opts);
  const rolesInPlay = [...new Set(preview.map((t) => t.roleId))];

  function download() {
    setBusy(true);
    // pequeño respiro para que el botón muestre "Generando…" antes del trabajo síncrono de jsPDF
    setTimeout(() => {
      OZONO_REPORTS.downloadActivityReport(db, opts);
      setBusy(false);
    }, 50);
  }

  return (
    <div>
      <h2 className="font-display" style={{ marginTop: 0, fontSize: 22 }}>Informes</h2>
      <div className="hint" style={{ marginBottom: 18 }}>
        Genera un PDF con el logo de Super Ozono, un resumen por rol/cargo y el listado completo de actividades.
      </div>

      <div className="surface-card" style={{ padding: 16, marginBottom: 18 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Filtros del informe</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 12 }}>
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Desde</div>
            <input className="field-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Hasta</div>
            <input className="field-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Rol / cargo</div>
            <select className="field-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Todos los roles</option>
              {OZONO.ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Estado</div>
            <select className="field-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              {OZONO.STATUS_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(fromDate || toDate) && (
          <div className="hint" style={{ marginBottom: 10 }}>
            El rango de fechas filtra por fecha límite de la tarea. {fromDate && toDate && fromDate > toDate && (
              <span style={{ color: "var(--danger)" }}> "Desde" es posterior a "Hasta" — no habrá resultados.</span>
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-accent btn-sm" onClick={download} disabled={busy || preview.length === 0}>
            <Icon name="send" size={13} /> {busy ? "Generando…" : "Descargar PDF"}
          </button>
          <span className="hint">{preview.length} actividad{preview.length === 1 ? "" : "es"} en {rolesInPlay.length} rol{rolesInPlay.length === 1 ? "" : "es"} con este filtro</span>
        </div>
      </div>

      {preview.length === 0 ? (
        <EmptyState icon="folder" title="Sin actividades para este filtro" hint="Ajusta el rango de fechas, el rol o el estado." />
      ) : (
        <div className="surface-card" style={{ overflow: "hidden" }}>
          <div className="task-list-row task-list-head hint">
            <span>Tarea</span>
            <span>Rol</span>
            <span>Responsable</span>
            <span>Estado</span>
            <span>Vence</span>
          </div>
          {preview.slice(0, 12).map((t) => {
            const assignee = OZONO.getUser(db, t.assigneeId);
            const col = OZONO.STATUS_COLUMNS.find((c) => c.id === t.status);
            return (
              <div key={t.id} className="task-list-row task-list-item">
                <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                <span><RoleTag roleId={t.roleId} /></span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar user={assignee} size="xs" /> <span style={{ fontSize: 12.5 }}>{assignee ? assignee.name : "—"}</span>
                </span>
                <span><Badge dot>{col.label}</Badge></span>
                <span style={{ fontSize: 12.5, color: isOverdue(t) ? "var(--danger)" : "var(--text-faint)" }}>{formatDate(t.dueDate)}</span>
              </div>
            );
          })}
          {preview.length > 12 && <div className="hint" style={{ padding: "10px 14px" }}>… y {preview.length - 12} más (todas se incluyen en el PDF).</div>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONFIGURACIÓN — enlaces de Drive por Proyecto / Producto
// ---------------------------------------------------------------------------
function DriveConfigRow({ label, sub, value, onSave }) {
  const [draft, setDraft] = useState(value || "");
  const [saved, setSaved] = useState(false);
  const dirty = draft !== (value || "");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {sub && <div className="hint">{sub}</div>}
      </div>
      <input
        className="field-input"
        placeholder="https://drive.google.com/drive/folders/…"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setSaved(false);
        }}
      />
      <button
        className={"btn btn-sm" + (saved ? " btn-accent" : "")}
        disabled={!dirty}
        onClick={() => {
          onSave(draft.trim());
          setSaved(true);
        }}
      >
        {saved ? <Icon name="check" size={13} /> : "Guardar"}
      </button>
    </div>
  );
}

function ConfiguracionView({ db, user, commit }) {
  const canEdit = OZONO.isDirector(user);

  function setProjectDrive(projectId, url) {
    commit((draft) => {
      draft.projects.find((p) => p.id === projectId).driveUrl = url;
    });
  }
  function setProductDrive(projectId, productId, url) {
    commit((draft) => {
      const p = draft.projects.find((x) => x.id === projectId);
      p.products.find((pr) => pr.id === productId).driveUrl = url;
    });
  }

  return (
    <div>
      <h2 className="font-display" style={{ marginTop: 0, fontSize: 22 }}>Configuración de Drive</h2>
      <div className="hint" style={{ marginBottom: 18, maxWidth: 640 }}>
        Define aquí la carpeta central compartida de Google Drive para cada Proyecto y, si aplica, para
        cada Producto (estructura Proyecto {'>'} Producto {'>'} Rol). Las tareas de ese proyecto/producto
        sugerirán automáticamente este enlace en vez de tener que pegarlo cada vez.
        {!canEdit && " Solo el Director puede editar estos enlaces; tú puedes consultarlos."}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {db.projects.map((p) => (
          <div key={p.id} className="surface-card rise-in" style={{ padding: 16 }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
            {canEdit ? (
              <DriveConfigRow
                label="Carpeta del proyecto"
                sub="Se usa como respaldo si un producto no tiene carpeta propia"
                value={p.driveUrl}
                onSave={(url) => setProjectDrive(p.id, url)}
              />
            ) : (
              <div style={{ padding: "9px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 12.5 }}>
                <span style={{ color: "var(--text-faint)" }}>Carpeta del proyecto: </span>
                {p.driveUrl ? <a href={p.driveUrl} target="_blank" rel="noreferrer">{p.driveUrl}</a> : "sin configurar"}
              </div>
            )}
            {p.products.map((prod) =>
              canEdit ? (
                <DriveConfigRow
                  key={prod.id}
                  label={"↳ " + prod.name}
                  value={prod.driveUrl}
                  onSave={(url) => setProductDrive(p.id, prod.id, url)}
                />
              ) : (
                <div key={prod.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 12.5 }}>
                  <span style={{ color: "var(--text-faint)" }}>↳ {prod.name}: </span>
                  {prod.driveUrl ? <a href={prod.driveUrl} target="_blank" rel="noreferrer">{prod.driveUrl}</a> : "sin configurar (usa la del proyecto)"}
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CALENDARIO EDITORIAL
// ---------------------------------------------------------------------------
function CalendarView({ db, user, commit, openTask }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [dragPayload, setDragPayload] = useState(null); // {kind:'task'|'post', data}
  const [dragOverDate, setDragOverDate] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [platformFilter, setPlatformFilter] = useState("all");

  const schedulable = OZONO.getSchedulableTasks(db);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // semana empieza en lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function dateStr(d) {
    return d.toISOString().slice(0, 10);
  }

  function postsFor(dstr) {
    return db.posts.filter((p) => p.scheduledDate === dstr && (platformFilter === "all" || p.platform === platformFilter));
  }

  function scheduleTaskOnDate(task, dstr) {
    commit((draft) => {
      draft.posts.push({
        id: OZONO.uid("post"),
        taskId: task.id,
        projectId: task.projectId,
        productId: task.productId,
        title: task.title,
        platform: "instagram",
        scheduledDate: dstr,
        scheduledTime: "10:00",
        status: "programado",
        assigneeId: db.users.find((u) => u.roleId === "community_manager")?.id || task.assigneeId,
      });
    });
  }

  function movePost(post, dstr) {
    commit((draft) => {
      const p = draft.posts.find((x) => x.id === post.id);
      p.scheduledDate = dstr;
      if (p.status === "borrador") p.status = "programado";
    });
  }

  function handleDropOnDay(dstr) {
    setDragOverDate(null);
    if (!dragPayload) return;
    if (dragPayload.kind === "task") scheduleTaskOnDate(dragPayload.data, dstr);
    else movePost(dragPayload.data, dstr);
    setDragPayload(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 22 }}>Calendario editorial</h2>
          <div className="hint">Solo piezas ya aprobadas por el Director pueden programarse aquí.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="field-select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="all">Todas las plataformas</option>
            {OZONO.PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
          <button className="btn btn-sm" onClick={() => setCursor(new Date())}>Hoy</button>
          <button className="btn btn-sm" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
        </div>
      </div>

      <div className="cal-layout">
        <div>
          <div className="font-display" style={{ fontSize: 18, marginBottom: 10, textTransform: "capitalize" }}>
            {cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
          </div>
          <div className="editorial-calendar">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="cal-day-head">{d}</div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="cal-cell outside" />;
              const dstr = dateStr(d);
              const dayPosts = postsFor(dstr);
              return (
                <div
                  key={i}
                  className={"cal-cell" + (dstr === todayStr ? " today" : "") + (dragOverDate === dstr ? " drag-over" : "")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDate(dstr);
                  }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={() => handleDropOnDay(dstr)}
                >
                  <div className="cal-daynum">{d.getDate()}</div>
                  {dayPosts.map((post) => {
                    const platform = OZONO.getPlatform(post.platform);
                    return (
                      <div
                        key={post.id}
                        className="post-chip"
                        draggable
                        onDragStart={() => setDragPayload({ kind: "post", data: post })}
                        onClick={() => setEditingPost(post)}
                        style={{ borderColor: platform.color + "55" }}
                        title={post.title}
                      >
                        <span className="badge-dot" style={{ background: platform.color, width: 6, height: 6, borderRadius: 999, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface-card rise-in" style={{ padding: 14, position: "sticky", top: 90 }}>
          <div className="label-eyebrow" style={{ marginBottom: 10 }}>Piezas listas para programar</div>
          {schedulable.length === 0 ? (
            <div className="hint">No hay piezas aprobadas pendientes de programar.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {schedulable.map((t) => (
                <div
                  key={t.id}
                  className="task-card"
                  draggable
                  onDragStart={() => setDragPayload({ kind: "task", data: t })}
                  onClick={() => openTask(t)}
                  style={{ marginBottom: 0 }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.title}</div>
                  <div className="hint" style={{ marginTop: 4 }}>{OZONO.getRole(t.roleId).name}</div>
                </div>
              ))}
            </div>
          )}
          <div className="hint" style={{ marginTop: 12 }}>Arrastra una pieza a un día del calendario para programarla.</div>
        </div>
      </div>

      {editingPost && (
        <Modal onClose={() => setEditingPost(null)}>
          <div style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 className="font-display" style={{ margin: 0 }}>{editingPost.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingPost(null)}><Icon name="x" /></button>
            </div>
            <div className="field-label">Plataforma</div>
            <select
              className="field-select"
              value={editingPost.platform}
              onChange={(e) => {
                const val = e.target.value;
                commit((draft) => {
                  draft.posts.find((p) => p.id === editingPost.id).platform = val;
                });
                setEditingPost({ ...editingPost, platform: val });
              }}
              style={{ marginBottom: 10 }}
            >
              {OZONO.PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <div className="field-label">Hora</div>
            <input
              className="field-input"
              type="time"
              value={editingPost.scheduledTime}
              onChange={(e) => {
                const val = e.target.value;
                commit((draft) => {
                  draft.posts.find((p) => p.id === editingPost.id).scheduledTime = val;
                });
                setEditingPost({ ...editingPost, scheduledTime: val });
              }}
              style={{ marginBottom: 10 }}
            />
            <div className="field-label">Estado</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {OZONO.POST_STATUS.map((s) => (
                <button
                  key={s.id}
                  className={"btn btn-sm" + (editingPost.status === s.id ? " btn-accent" : "")}
                  onClick={() => {
                    commit((draft) => {
                      draft.posts.find((p) => p.id === editingPost.id).status = s.id;
                    });
                    setEditingPost({ ...editingPost, status: s.id });
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                commit((draft) => {
                  draft.posts = draft.posts.filter((p) => p.id !== editingPost.id);
                });
                setEditingPost(null);
              }}
            >
              Quitar del calendario
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MENSAJES
// ---------------------------------------------------------------------------
function MensajesView({ db, user, commit }) {
  const [toUserId, setToUserId] = useState(db.users.find((u) => u.id !== user.id)?.id || "");
  const [text, setText] = useState("");
  const isDirector = OZONO.isDirector(user);
  const toUser = OZONO.getUser(db, toUserId);

  const myMessages = isDirector
    ? db.messages.filter((m) => m.toUserId === toUserId)
    : db.messages.filter((m) => m.toUserId === user.id);

  function send() {
    if (!text.trim()) return;
    commit((draft) => {
      draft.messages.push({ id: OZONO.uid("msg"), fromUserId: user.id, toUserId, text: text.trim(), ts: OZONO.nowISO() });
      OZONO.addNotification(draft, toUserId, `Nuevo mensaje del Director.`);
    });
    setText("");
  }

  return (
    <div>
      <h2 className="font-display" style={{ marginTop: 0, fontSize: 22 }}>Mensajes</h2>
      <div className="hint" style={{ marginBottom: 16 }}>
        {isDirector ? "Envía observaciones directas a cualquier miembro del equipo." : "Observaciones enviadas por el Director."}
      </div>

      <div className="surface-card" style={{ padding: 16, maxWidth: 560 }}>
        {isDirector && (
          <select className="field-select" value={toUserId} onChange={(e) => setToUserId(e.target.value)} style={{ marginBottom: 12 }}>
            {db.users.filter((u) => u.id !== user.id).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
          {myMessages.length === 0 && <div className="hint">Sin mensajes todavía.</div>}
          {myMessages.map((m) => {
            const from = OZONO.getUser(db, m.fromUserId);
            return (
              <div key={m.id} className="comment-bubble">
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{from.name} <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>· {relativeTime(m.ts)}</span></div>
                <div style={{ fontSize: 13 }}>{m.text}</div>
              </div>
            );
          })}
        </div>
        {isDirector && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="field-input" placeholder="Escribe una observación…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} style={{ flex: 1, minWidth: 160 }} />
            <button className="btn btn-accent btn-sm" onClick={send}><Icon name="send" size={13} /> En la app</button>
            {text.trim() && <WhatsappButton phone={toUser?.phone} message={text.trim()} label="También por WhatsApp" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ANALÍTICA (Director / Líder)
// ---------------------------------------------------------------------------
function AnaliticaView({ db, user }) {
  const scopeUsers = OZONO.isDirector(user)
    ? db.users
    : db.users.filter((u) => OZONO.getRole(u.roleId).area === OZONO.getRole(user.roleId).area);
  const scopeUserIds = new Set(scopeUsers.map((u) => u.id));
  const scopeTasks = db.tasks.filter((t) => scopeUserIds.has(t.assigneeId));

  const statusColors = { todo: "#656e54", progress: "#5cc9ff", review: "#ffd166", done: "#c6ff3d" };
  const statusSegments = OZONO.STATUS_COLUMNS.map((c) => ({
    label: c.label,
    value: scopeTasks.filter((t) => t.status === c.id).length,
    color: statusColors[c.id],
  }));

  // Productividad: tareas aprobadas este mes por miembro (de la bitácora)
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const approvalsPerUser = scopeUsers.map((u) => {
    const count = db.tasks.filter(
      (t) => t.assigneeId === u.id && t.status === "done" && t.history.some((h) => h.text.includes("aprobó la tarea") && h.ts.startsWith(monthPrefix))
    ).length;
    return { label: u.name.split(" ")[0], value: count, color: u.avatarColor };
  });

  // Tendencia de aprobaciones en los últimos 14 días
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const approvalsByDay = days.map((dstr) => {
    const count = scopeTasks.reduce((acc, t) => acc + t.history.filter((h) => h.text.includes("aprobó la tarea") && h.ts.startsWith(dstr)).length, 0);
    return { label: dstr.slice(8, 10), value: count };
  });

  // Carga de trabajo por persona: activas (todo+progreso+revisión) y vencidas,
  // para que el Director/Líder detecte sobrecarga antes de asignar más.
  const workload = scopeUsers
    .map((u) => {
      const mine = db.tasks.filter((t) => t.assigneeId === u.id);
      const active = mine.filter((t) => t.status !== "done");
      const overdue = active.filter((t) => isOverdue(t));
      return { user: u, active: active.length, overdue: overdue.length };
    })
    .sort((a, b) => b.active - a.active);
  const maxActive = Math.max(1, ...workload.map((w) => w.active));

  const totalTasks = scopeTasks.length;
  const doneTasks = scopeTasks.filter((t) => t.status === "done").length;
  const onTimeRate = (() => {
    const finished = scopeTasks.filter((t) => t.status === "done");
    if (!finished.length) return null;
    const onTime = finished.filter((t) => !t.dueDate || t.dueDate >= t.history[t.history.length - 1]?.ts.slice(0, 10)).length;
    return Math.round((onTime / finished.length) * 100);
  })();

  return (
    <div>
      <h2 className="font-display" style={{ marginTop: 0, fontSize: 22 }}>Analítica</h2>
      <div className="hint" style={{ marginBottom: 20 }}>
        Métricas {OZONO.isDirector(user) ? "de toda la operación" : "de tu área"}, calculadas en tiempo real sobre tareas y aprobaciones.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <DonutChart segments={statusSegments} size={120} thickness={16} />
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {statusSegments.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span className="badge-dot" style={{ background: s.color, width: 8, height: 8, borderRadius: 999 }} />
                {s.label}: <span className="font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <div className="label-eyebrow" style={{ marginBottom: 6, position: "relative", zIndex: 1 }}>Tareas totales</div>
          <div className="font-display" style={{ fontSize: 40, fontWeight: 600, position: "relative", zIndex: 1 }}>{totalTasks}</div>
          <div className="hint" style={{ position: "relative", zIndex: 1 }}>{doneTasks} completadas ({totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0}%)</div>
        </div>

        <div className="stat-card">
          <div className="label-eyebrow" style={{ marginBottom: 6, position: "relative", zIndex: 1 }}>% entregas a tiempo</div>
          <div className="font-display" style={{ fontSize: 40, fontWeight: 600, color: "var(--accent)", position: "relative", zIndex: 1 }}>
            {onTimeRate === null ? "—" : onTimeRate + "%"}
          </div>
          <div className="hint" style={{ position: "relative", zIndex: 1 }}>sobre tareas ya aprobadas</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="surface-card" style={{ padding: 16 }}>
          <div className="label-eyebrow" style={{ marginBottom: 12 }}>Productividad — aprobadas este mes por miembro</div>
          <MiniBarChart data={approvalsPerUser} />
        </div>
        <div className="surface-card" style={{ padding: 16 }}>
          <div className="label-eyebrow" style={{ marginBottom: 12 }}>Tendencia de aprobaciones — últimos 14 días</div>
          <TrendBars data={approvalsByDay} />
        </div>
      </div>

      <div className="surface-card" style={{ padding: 16, marginTop: 16 }}>
        <div className="label-eyebrow" style={{ marginBottom: 4 }}>Carga de equipo — tareas activas por persona</div>
        <div className="hint" style={{ marginBottom: 12 }}>Antes de asignar algo más, revisa quién ya tiene demasiado.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {workload.map((w) => (
            <div key={w.user.id} style={{ display: "grid", gridTemplateColumns: "160px 1fr 40px", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <Avatar user={w.user} size="xs" />
                <span style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.user.name}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: (w.active / maxActive) * 100 + "%",
                    background: w.active >= 8 ? "var(--danger)" : w.active >= 5 ? "var(--amber)" : "linear-gradient(90deg, var(--accent-dim), var(--accent))",
                  }}
                />
              </div>
              <div className="font-mono" style={{ fontSize: 11.5, textAlign: "right" }}>
                {w.active}{w.overdue > 0 && <span style={{ color: "var(--danger)" }}> · {w.overdue}v</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 10 }}>El número es tareas activas; "v" = cuántas de esas ya están vencidas.</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DASHBOARD (Director / Líder)
// ---------------------------------------------------------------------------
function DashboardView({ db, user, commit, openTask, goTo }) {
  const scopeUsers = OZONO.isDirector(user)
    ? db.users
    : db.users.filter((u) => OZONO.getRole(u.roleId).area === OZONO.getRole(user.roleId).area);
  const scopeUserIds = new Set(scopeUsers.map((u) => u.id));
  const scopeTasks = db.tasks.filter((t) => scopeUserIds.has(t.assigneeId));

  const cargaData = scopeUsers.map((u) => ({
    label: u.name.split(" ")[0],
    value: scopeTasks.filter((t) => t.assigneeId === u.id && t.status !== "done").length,
    color: u.avatarColor,
  }));

  const scopeMetas = db.metas.filter((m) => scopeUserIds.has(m.userId) && m.status === "aprobada");
  const metaPct = (m) => {
    if (m.type === "numero") return Math.min(100, (m.current / m.target) * 100);
    if (m.type === "porcentaje") return Math.min(100, m.current);
    if (m.type === "checklist") return (m.checklist.filter((c) => c.done).length / m.checklist.length) * 100;
    return 0;
  };
  const avgMeta = scopeMetas.length ? Math.round(scopeMetas.reduce((a, m) => a + metaPct(m), 0) / scopeMetas.length) : 0;

  const overdue = scopeTasks.filter(isOverdue);
  const blocked = scopeTasks.filter((t) => OZONO.isBlocked(t, db) && t.status !== "done");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h2 className="font-display" style={{ marginTop: 0, fontSize: 22 }}>Dashboard</h2>
      <div className="hint" style={{ marginBottom: 20 }}>Vista general {OZONO.isDirector(user) ? "de toda la operación" : "de tu área"}.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="label-eyebrow" style={{ marginBottom: 10, position: "relative", zIndex: 1 }}>Carga de trabajo por rol</div>
          <div style={{ position: "relative", zIndex: 1 }}><MiniBarChart data={cargaData} /></div>
        </div>

        <div className="stat-card">
          <div className="label-eyebrow" style={{ marginBottom: 6, position: "relative", zIndex: 1 }}>% Cumplimiento de metas</div>
          <div className="font-display" style={{ fontSize: 42, fontWeight: 600, color: "var(--accent)", position: "relative", zIndex: 1 }}>{avgMeta}%</div>
          <div className="hint" style={{ position: "relative", zIndex: 1 }}>promedio sobre {scopeMetas.length} metas activas</div>
        </div>

        <div className="stat-card">
          <div className="label-eyebrow" style={{ marginBottom: 10, position: "relative", zIndex: 1 }}>Tareas retrasadas / bloqueadas</div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
            {overdue.length === 0 && blocked.length === 0 && <div className="hint">Todo al día 🎉</div>}
            {overdue.map((t) => (
              <div key={t.id} onClick={() => openTask(t)} style={{ fontSize: 12.5, color: "var(--danger)", cursor: "pointer" }}>
                <Icon name="alert" size={11} /> {t.title} · vencida
              </div>
            ))}
            {blocked.map((t) => (
              <div key={t.id} onClick={() => openTask(t)} style={{ fontSize: 12.5, color: "var(--text-muted)", cursor: "pointer" }}>
                <Icon name="lock" size={11} /> {t.title} · bloqueada
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="surface-card" style={{ padding: 16 }}>
          <div className="label-eyebrow" style={{ marginBottom: 12 }}>Resumen por proyecto / producto</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {db.projects.map((p) => {
              const pt = db.tasks.filter((t) => t.projectId === p.id);
              const done = pt.filter((t) => t.status === "done").length;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span className="hint font-mono">{done}/{pt.length}</span>
                  </div>
                  <ProgressBar pct={pt.length ? (done / pt.length) * 100 : 0} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface-card" style={{ padding: 16 }}>
          <div className="label-eyebrow" style={{ marginBottom: 12 }}>Foco de hoy por miembro</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto" }}>
            {scopeUsers.map((u) => {
              const focus = scopeTasks.filter((t) => t.assigneeId === u.id && (t.dueDate === today || t.status === "progress"));
              return (
                <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Avatar user={u} size="xs" />
                  <div style={{ fontSize: 12.5 }}>
                    <span style={{ fontWeight: 600 }}>{u.name.split(" ")[0]}: </span>
                    <span className="hint">{focus.length ? focus.map((t) => t.title).join(" · ") : "sin foco activo hoy"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="surface-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div className="label-eyebrow">Mensajería directa</div>
          <button className="btn btn-ghost btn-sm" onClick={() => goTo("mensajes")}>Ir a Mensajes →</button>
        </div>
        <div className="hint">Envía observaciones a cualquier miembro desde la sección de Mensajes.</div>
      </div>
    </div>
  );
}
