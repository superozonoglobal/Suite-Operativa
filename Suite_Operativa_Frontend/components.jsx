const { useState, useEffect, useRef, useMemo } = React;

function Avatar({ user, size = "md" }) {
  if (!user) return null;
  const cls = size === "lg" ? "avatar lg" : size === "xs" ? "avatar xs" : "avatar";
  return (
    <div className={cls} style={{ background: user.avatarColor }} title={user.name}>
      {user.initials}
    </div>
  );
}

function Badge({ children, color, dot }) {
  return (
    <span className="badge">
      {dot && <span className="badge-dot" style={{ background: color || "var(--accent)" }} />}
      {children}
    </span>
  );
}

function ProgressBar({ pct }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: clamped + "%" }} />
    </div>
  );
}

function Modal({ onClose, children, wide, panelClassName }) {
  const ref = useRef(null);
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={"modal-panel" + (panelClassName ? " " + panelClassName : "")} style={wide ? { maxWidth: 880 } : undefined} ref={ref}>
        {children}
      </div>
    </div>
  );
}

function IconBtn({ name, onClick, title, active }) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={onClick}
      title={title}
      style={{ padding: 8, color: active ? "var(--accent)" : undefined }}
    >
      <Icon name={name} size={16} />
    </button>
  );
}

function EmptyState({ icon, title, hint }) {
  return (
    <div
      className="rise-in"
      style={{
        textAlign: "center",
        padding: "48px 20px",
        color: "var(--text-faint)",
      }}
    >
      <div style={{ opacity: 0.5, marginBottom: 10 }}>
        <Icon name={icon || "inbox"} size={30} />
      </div>
      <div style={{ color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

function RoleTag({ roleId }) {
  const role = OZONO.getRole(roleId);
  if (!role) return null;
  return <Badge>{role.name}</Badge>;
}

function LevelTag({ level }) {
  const map = {
    director: { label: "Director", color: "var(--accent)" },
    lider: { label: "Líder", color: "var(--sky)" },
    colaborador: { label: "Colaborador", color: "var(--text-faint)" },
  };
  const m = map[level] || map.colaborador;
  return <Badge color={m.color} dot>{m.label}</Badge>;
}

function PlatformTag({ platformId }) {
  const p = OZONO.getPlatform(platformId);
  if (!p) return null;
  return <Badge color={p.color} dot>{p.label}</Badge>;
}

function MiniBarChart({ data }) {
  // data: [{label, value, max, color}]
  const maxVal = Math.max(1, ...data.map((d) => d.max || d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 34px", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{d.label}</div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: Math.min(100, (d.value / maxVal) * 100) + "%",
                background: d.color || "linear-gradient(90deg, var(--accent-dim), var(--accent))",
              }}
            />
          </div>
          <div className="font-mono" style={{ fontSize: 11.5, color: "var(--text-faint)", textAlign: "right" }}>
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function LogoMark({ size = 40, animated = true }) {
  return (
    <img
      src={OZONO_LOGO_DATA_URI}
      alt="Super Ozono"
      className={animated ? "logo-mark logo-pulse" : "logo-mark"}
      style={{ width: size, height: "auto", display: "block" }}
    />
  );
}

function UsernameTag({ username }) {
  if (!username) return null;
  return <span className="font-mono" style={{ color: "var(--text-faint)", fontSize: 11.5 }}>@{username}</span>;
}

// Donut chart SVG puro (sin librerías externas) para la vista de Analítica.
function DonutChart({ segments, size = 140, thickness = 18 }) {
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-soft)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * circumference;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.16,1,.3,1)" }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="font-display" fill="var(--text)" fontSize={size * 0.16} fontWeight={600}>
        {total}
      </text>
    </svg>
  );
}

// Serie de barras simple (sparkline) para tendencias en el tiempo.
function TrendBars({ data, height = 70, color = "var(--accent)" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} title={d.label + ": " + d.value} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: "100%",
              maxWidth: 18,
              height: Math.max(3, (d.value / max) * (height - 16)),
              background: color,
              borderRadius: 4,
              transition: "height 0.5s cubic-bezier(.16,1,.3,1)",
              opacity: d.value === 0 ? 0.25 : 1,
            }}
          />
          <div style={{ fontSize: 9, color: "var(--text-faint)" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// Enlace de WhatsApp con mensaje prellenado — no requiere backend ni API de
// pago: abre WhatsApp Web/App y la persona solo tiene que darle "Enviar".
function waLink(phone, message) {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message);
}

function WhatsappButton({ phone, message, label = "WhatsApp" }) {
  const link = waLink(phone, message);
  if (!link) return <span className="hint">Sin teléfono</span>;
  return (
    <a href={link} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ color: "#3fe07f", borderColor: "rgba(63,224,127,0.35)" }}>
      <Icon name="send" size={12} /> {label}
    </a>
  );
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return mins + "m";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h";
  return Math.floor(hrs / 24) + "d";
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}
