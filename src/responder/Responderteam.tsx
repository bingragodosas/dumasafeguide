import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status?: string;       // "on_duty" | "off_duty" | "responding"
  unit?: string;
  avatar_url?: string | null;
  phone?: string | null;
  joined_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  on_duty:    { label: "ON DUTY",    color: "#00DC82", dot: "#00DC82" },
  responding: { label: "RESPONDING", color: "#F90",    dot: "#F90"    },
  off_duty:   { label: "OFF DUTY",   color: "rgba(216,234,248,0.28)", dot: "rgba(216,234,248,0.28)" },
};

const UNIT_COLORS: Record<string, string> = {
  "Alpha":   "#4D9EFF",
  "Bravo":   "#00DC82",
  "Charlie": "#F90",
  "Delta":   "#F33",
  "HQ":      "#C084FC",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Ico = {
  Users: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Radio: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
      <circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
    </svg>
  ),
  Activity: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Phone: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Mail: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Search: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Filter: ({ size = 13 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Clock: ({ size = 9 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --ink:   #06101C;
  --s1:    #070F1B;
  --edge:  rgba(255,255,255,0.07);
  --text:  #D8EAF8;
  --muted: rgba(216,234,248,0.45);
  --dim:   rgba(216,234,248,0.22);
  --cyan:  #00C8E0;
  --blue:  #4D9EFF;
  --green: #00DC82;
  --amber: #F90;
  --red:   #F33;
  --font-head: 'Bebas Neue','Arial Narrow',Arial,sans-serif;
  --font-mono: 'IBM Plex Mono','Fira Mono',monospace;
  --font-body: 'DM Sans',system-ui,sans-serif;
}

@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.rt{font-family:var(--font-body);color:var(--text);min-height:100vh;background:var(--ink)}

/* ── Header ── */
.rt-hd{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.rt-eyebrow{font-family:var(--font-mono);font-size:10px;color:rgba(0,200,224,.6);letter-spacing:.28em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.rt-eyebrow::before{content:'';display:block;width:20px;height:1px;background:var(--cyan);opacity:.5}
.rt-title{font-family:var(--font-head);font-size:42px;font-weight:400;color:#fff;letter-spacing:.04em;line-height:1}
.rt-subtitle{font-family:var(--font-mono);font-size:9px;color:var(--dim);letter-spacing:.18em;text-transform:uppercase;margin-top:4px}

/* ── Stats bar ── */
.rt-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px}
.rt-stat{background:rgba(6,17,32,.92);border:1px solid var(--edge);border-radius:12px;padding:16px;position:relative;overflow:hidden}
.rt-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.rt-stat-icon{font-size:16px;margin-bottom:10px;opacity:.85;display:flex;align-items:center}
.rt-stat-num{font-family:var(--font-head);font-size:34px;line-height:1;margin-bottom:5px;min-height:34px}
.rt-stat-lbl{font-family:var(--font-mono);font-size:8.5px;color:var(--dim);letter-spacing:.12em;text-transform:uppercase}

.rt-stat.sc-total  ::before,.rt-stat.sc-total  .rt-stat-icon,.rt-stat.sc-total  .rt-stat-num{color:var(--text)}
.rt-stat.sc-total  ::before{background:var(--text)}
.rt-stat.sc-active ::before{background:var(--green)}
.rt-stat.sc-active .rt-stat-icon,.rt-stat.sc-active .rt-stat-num{color:var(--green)}
.rt-stat.sc-resp   ::before{background:var(--amber)}
.rt-stat.sc-resp   .rt-stat-icon,.rt-stat.sc-resp   .rt-stat-num{color:var(--amber)}
.rt-stat.sc-off    ::before{background:var(--dim)}
.rt-stat.sc-off    .rt-stat-icon,.rt-stat.sc-off    .rt-stat-num{color:var(--muted)}

/* ── Skeleton ── */
.rt-skel{
  background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);
  background-size:200% 100%;
  animation:shimmer 1.4s ease infinite;
  border-radius:6px;
}
.rt-skel-num{height:34px;width:40px;border-radius:4px;margin-bottom:5px}

/* ── Toolbar ── */
.rt-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.rt-search-wrap{position:relative;flex:1;min-width:180px}
.rt-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--dim);pointer-events:none}
.rt-search{background:rgba(6,17,32,.92);border:1px solid var(--edge);border-radius:9px;padding:10px 12px 10px 36px;font-family:var(--font-body);font-size:13px;color:var(--text);outline:none;transition:border-color .2s;width:100%}
.rt-search::placeholder{color:var(--dim)}
.rt-search:focus{border-color:rgba(0,200,224,.3)}

.rt-filter-group{display:flex;gap:6px;flex-wrap:wrap}
.rt-filter-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 13px;background:rgba(255,255,255,.03);border:1px solid var(--edge);border-radius:8px;font-family:var(--font-mono);font-size:9px;font-weight:600;letter-spacing:.08em;color:var(--muted);cursor:pointer;transition:all .15s;white-space:nowrap}
.rt-filter-btn:hover{border-color:rgba(255,255,255,.15);color:var(--text)}
.rt-filter-btn.active{background:rgba(0,200,224,.08);border-color:rgba(0,200,224,.3);color:var(--cyan)}
.rt-filter-btn.f-on{border-color:rgba(0,220,130,.3);color:var(--green);background:rgba(0,220,130,.07)}
.rt-filter-btn.f-responding{border-color:rgba(255,153,0,.3);color:var(--amber);background:rgba(255,153,0,.07)}
.rt-filter-btn.f-off{border-color:rgba(216,234,248,.15);color:var(--muted);background:rgba(216,234,248,.04)}

/* ── Grid layout ── */
.rt-layout{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
@media(max-width:600px){.rt-layout{grid-template-columns:1fr}}

/* ── Member card ── */
.rt-card{
  background:rgba(6,17,32,.92);border:1px solid var(--edge);
  border-radius:14px;padding:18px;
  display:flex;flex-direction:column;gap:14px;
  transition:border-color .2s,box-shadow .2s,transform .2s;
  animation:slideUp .3s ease both;
  position:relative;overflow:hidden;
  cursor:default;
}
.rt-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:var(--card-accent,var(--cyan));
  opacity:.7;
}
.rt-card:hover{
  border-color:rgba(0,200,224,.22);
  box-shadow:0 8px 40px rgba(0,0,0,.4),0 0 0 1px rgba(0,200,224,.08);
  transform:translateY(-2px);
}

.rt-card-top{display:flex;align-items:flex-start;gap:12px}
.rt-avatar{
  width:46px;height:46px;border-radius:12px;
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  font-family:var(--font-head);font-size:20px;font-weight:400;color:#fff;
  background:var(--avatar-bg,rgba(0,200,224,.15));
  border:1px solid var(--avatar-border,rgba(0,200,224,.25));
  position:relative;
}
.rt-avatar-img{width:100%;height:100%;object-fit:cover;border-radius:11px}

.rt-status-dot{
  position:absolute;bottom:-3px;right:-3px;
  width:11px;height:11px;border-radius:50%;
  background:var(--dot-color,var(--dim));
  border:2px solid #06101C;
}
.rt-status-dot.responding{animation:pulse 1.2s ease-in-out infinite}

.rt-card-info{flex:1;min-width:0}
.rt-card-name{font-size:15px;font-weight:700;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rt-card-role{font-family:var(--font-mono);font-size:8.5px;color:var(--dim);letter-spacing:.1em;text-transform:uppercase;margin-top:3px}

.rt-unit-badge{
  display:inline-flex;align-items:center;gap:4px;
  font-family:var(--font-mono);font-size:8px;font-weight:700;
  padding:2px 8px;border-radius:4px;letter-spacing:.08em;
  background:var(--unit-bg,rgba(77,158,255,.08));
  border:1px solid var(--unit-border,rgba(77,158,255,.2));
  color:var(--unit-color,var(--blue));
  margin-top:5px;
}

/* ── Status badge ── */
.rt-status-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--font-mono);font-size:8px;font-weight:700;
  padding:3px 9px;border-radius:5px;letter-spacing:.08em;
  border:1px solid currentColor;
  opacity:.85;
}

/* ── Contact row ── */
.rt-contacts{display:flex;flex-direction:column;gap:5px;border-top:1px solid var(--edge);padding-top:12px}
.rt-contact-row{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--muted)}
.rt-contact-row span{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── Footer ── */
.rt-card-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}
.rt-meta{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:8.5px;color:var(--dim)}

/* ── Empty / loading states ── */
.rt-empty{
  grid-column:1/-1;text-align:center;padding:60px;
  font-family:var(--font-mono);font-size:10.5px;color:var(--dim);letter-spacing:.12em
}
.rt-skel-card{
  background:rgba(6,17,32,.92);border:1px solid var(--edge);
  border-radius:14px;padding:18px;
  display:flex;flex-direction:column;gap:14px;
}
.rt-skel-avatar{width:46px;height:46px;border-radius:12px}
.rt-skel-name{height:16px;width:60%}
.rt-skel-role{height:10px;width:35%;margin-top:5px}
.rt-skel-line{height:11px;width:80%}
.rt-skel-line-sm{height:11px;width:55%}

/* ── Spinner ── */
.rt-spinner{display:inline-block;width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.1);border-top-color:var(--cyan);animation:spin .7s linear infinite}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function cls(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

function formatDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rt-skel-card">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div className="rt-skel rt-skel-avatar" />
            <div style={{ flex: 1 }}>
              <div className="rt-skel rt-skel-name" />
              <div className="rt-skel rt-skel-role" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="rt-skel rt-skel-line" />
            <div className="rt-skel rt-skel-line-sm" />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Member Card ─────────────────────────────────────────────────────────────

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const status     = member.status ?? "off_duty";
  const statusMeta = STATUS_META[status] ?? STATUS_META.off_duty;
  const unit       = member.unit ?? "HQ";
  const unitColor  = UNIT_COLORS[unit] ?? "#4D9EFF";

  const avatarBg     = `${unitColor}22`;
  const avatarBorder = `${unitColor}40`;
  const cardAccent   = unitColor;

  return (
    <div
      className="rt-card"
      style={{
        animationDelay: `${index * 0.05}s`,
        ["--card-accent" as any]: cardAccent,
        ["--avatar-bg"   as any]: avatarBg,
        ["--avatar-border" as any]: avatarBorder,
      }}
    >
      {/* Top row */}
      <div className="rt-card-top">
        <div className="rt-avatar">
          {member.avatar_url
            ? <img src={member.avatar_url} alt={member.full_name} className="rt-avatar-img" />
            : getInitials(member.full_name)
          }
          <span
            className={cls("rt-status-dot", status === "responding" && "responding")}
            style={{ ["--dot-color" as any]: statusMeta.dot }}
          />
        </div>

        <div className="rt-card-info">
          <div className="rt-card-name">{member.full_name}</div>
          <div className="rt-card-role">{member.role}</div>
          <div
            className="rt-unit-badge"
            style={{
              ["--unit-bg"     as any]: avatarBg,
              ["--unit-border" as any]: avatarBorder,
              ["--unit-color"  as any]: unitColor,
            }}
          >
            <Ico.Shield size={8} />
            {unit} Unit
          </div>
        </div>

        <span
          className="rt-status-badge"
          style={{ color: statusMeta.color, borderColor: `${statusMeta.color}40` }}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* Contact details */}
      {(member.email || member.phone) && (
        <div className="rt-contacts">
          {member.email && (
            <div className="rt-contact-row">
              <Ico.Mail size={11} />
              <span>{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="rt-contact-row">
              <Ico.Phone size={11} />
              <span>{member.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="rt-card-foot">
        <span className="rt-meta">
          <Ico.Clock size={9} />
          Joined {formatDate(member.joined_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResponderTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"all" | "on_duty" | "responding" | "off_duty">("all");

  const loadTeam = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status, unit, avatar_url, phone, joined_at")
        .in("role", ["responder", "admin"])
        .order("full_name", { ascending: true });
      setMembers(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();

    // Real-time presence updates
    const ch = supabase
      .channel("team-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        loadTeam
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Derived counts ──────────────────────────────────────────────────────────
  const counts = {
    total:      members.length,
    on_duty:    members.filter((m) => m.status === "on_duty").length,
    responding: members.filter((m) => m.status === "responding").length,
    off_duty:   members.filter((m) => !m.status || m.status === "off_duty").length,
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const visible = members.filter((m) => {
    const matchSearch =
      !search ||
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.unit ?? "").toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all" ||
      (filter === "off_duty" ? !m.status || m.status === "off_duty" : m.status === filter);

    return matchSearch && matchFilter;
  });

  const statCards = [
    { label: "Total Members",  value: counts.total,      colorClass: "sc-total",  icon: <Ico.Users size={16} />    },
    { label: "On Duty",        value: counts.on_duty,    colorClass: "sc-active", icon: <Ico.Shield size={16} />   },
    { label: "Responding",     value: counts.responding, colorClass: "sc-resp",   icon: <Ico.Radio size={16} />    },
    { label: "Off Duty",       value: counts.off_duty,   colorClass: "sc-off",    icon: <Ico.Activity size={16} /> },
  ];

  const filterOpts: { key: typeof filter; label: string; cls: string }[] = [
    { key: "all",        label: "ALL",        cls: ""              },
    { key: "on_duty",    label: "ON DUTY",    cls: "f-on"          },
    { key: "responding", label: "RESPONDING", cls: "f-responding"  },
    { key: "off_duty",   label: "OFF DUTY",   cls: "f-off"         },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="rt">

        {/* ── Header ── */}
        <div className="rt-hd">
          <div>
            <div className="rt-eyebrow">Field Operations</div>
            <div className="rt-title">TEAM</div>
            <div className="rt-subtitle">Responder roster &amp; status</div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="rt-stats">
          {statCards.map((s) => (
            <div key={s.label} className={cls("rt-stat", s.colorClass)}>
              <div className="rt-stat-icon">{s.icon}</div>
              <div className="rt-stat-num">
                {loading
                  ? <div className="rt-skel rt-skel-num" />
                  : s.value
                }
              </div>
              <div className="rt-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="rt-toolbar">
          <div className="rt-search-wrap">
            <span className="rt-search-icon"><Ico.Search size={14} /></span>
            <input
              className="rt-search"
              placeholder="Search by name, email or unit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rt-filter-group">
            <span style={{ display:"inline-flex",alignItems:"center",color:"var(--dim)",marginRight:2 }}>
              <Ico.Filter size={12} />
            </span>
            {filterOpts.map((f) => (
              <button
                key={f.key}
                className={cls("rt-filter-btn", f.cls, filter === f.key && "active")}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="rt-layout">
          {loading ? (
            <SkeletonCards count={6} />
          ) : visible.length === 0 ? (
            <div className="rt-empty">
              {search ? `NO RESULTS FOR "${search.toUpperCase()}"` : "NO TEAM MEMBERS FOUND"}
            </div>
          ) : (
            visible.map((m, i) => (
              <MemberCard key={m.id} member={m} index={i} />
            ))
          )}
        </div>

      </div>
    </>
  );
}