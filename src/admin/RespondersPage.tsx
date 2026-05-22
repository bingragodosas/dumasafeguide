import { useEffect, useState } from "react";
import { supabase } from "../js/supabase";
import {
  FaUsers,
  FaUserShield,
  FaUserCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaToggleOn,
  FaToggleOff,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const RP_STYLE = `
  .rp-root {
    font-family: 'IBM Plex Sans', sans-serif;
    color: #edf0fa;
  }
  .rp-header {
    display: flex; align-items: flex-end;
    justify-content: space-between; flex-wrap: wrap;
    gap: 14px; margin-bottom: 24px;
  }
  .rp-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(237,240,250,.28); margin-bottom: 4px;
  }
  .rp-title {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800; color: #f0f2f8;
    letter-spacing: -.02em; margin: 0 0 3px;
  }
  .rp-subtitle { font-size: 13px; color: rgba(237,240,250,.35); margin: 0; }
  .rp-add-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #e63946, #ff5d73);
    border: none; border-radius: 9px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; font-weight: 600; letter-spacing: .03em;
    color: #fff; cursor: pointer;
    box-shadow: 0 4px 14px rgba(230,57,70,.3);
    transition: all .18s; white-space: nowrap;
  }
  .rp-add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(230,57,70,.4); }
  .rp-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px; margin-bottom: 24px;
  }
  .rp-stat {
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 12px; padding: 16px 18px;
    position: relative; overflow: hidden;
  }
  .rp-stat::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: var(--s-accent);
  }
  .rp-stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 28px; font-weight: 800;
    color: var(--s-accent); line-height: 1; margin-bottom: 4px;
  }
  .rp-stat-label { font-size: 11px; color: rgba(237,240,250,.38); letter-spacing: .04em; }
  .rp-tabs {
    display: flex; gap: 4px;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 10px; padding: 4px;
    width: fit-content; margin-bottom: 14px;
  }
  .rp-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 18px; border-radius: 7px; border: none;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all .17s;
    background: transparent; color: rgba(237,240,250,.4);
  }
  .rp-tab:hover { color: rgba(237,240,250,.75); background: rgba(255,255,255,.04); }
  .rp-tab.active { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1); color: #fff; }
  .rp-tab-count {
    background: rgba(255,255,255,.1);
    border-radius: 6px; padding: 1px 6px;
    font-size: 10px; font-family: 'IBM Plex Mono', monospace; font-weight: 700;
    color: rgba(237,240,250,.5);
  }
  .rp-tab.active .rp-tab-count { background: rgba(230,57,70,.2); color: #ff7b87; }
  .rp-duty-filter { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .rp-duty-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px; border: 1px solid;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .17s; background: transparent;
  }
  .rp-duty-pill--all { border-color: rgba(255,255,255,.12); color: rgba(237,240,250,.45); }
  .rp-duty-pill--all.active, .rp-duty-pill--all:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.2); color: #fff; }
  .rp-duty-pill--on { border-color: rgba(46,204,143,.2); color: rgba(46,204,143,.6); }
  .rp-duty-pill--on.active, .rp-duty-pill--on:hover { background: rgba(46,204,143,.1); border-color: rgba(46,204,143,.4); color: #2ECC8F; }
  .rp-duty-pill--off { border-color: rgba(255,255,255,.08); color: rgba(237,240,250,.3); }
  .rp-duty-pill--off.active, .rp-duty-pill--off:hover { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.15); color: rgba(237,240,250,.6); }
  .rp-duty-dot { width: 6px; height: 6px; border-radius: 50%; }
  .rp-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .rp-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 340px; }
  .rp-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: rgba(237,240,250,.25); font-size: 12px; pointer-events: none;
  }
  .rp-search {
    width: 100%; padding: 9px 12px 9px 34px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; color: #edf0fa;
    outline: none; transition: border-color .17s;
    box-sizing: border-box;
  }
  .rp-search::placeholder { color: rgba(237,240,250,.25); }
  .rp-search:focus { border-color: rgba(255,255,255,.18); }
  .rp-refresh-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 14px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; color: rgba(237,240,250,.5);
    cursor: pointer; transition: all .17s;
  }
  .rp-refresh-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
  .rp-refresh-btn.spinning svg { animation: rpSpin .7s linear infinite; }
  @keyframes rpSpin { to { transform: rotate(360deg); } }
  .rp-notice {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 16px;
    background: rgba(123,158,255,.06);
    border: 1px solid rgba(123,158,255,.15);
    border-radius: 10px; margin-bottom: 16px;
    font-size: 13px; color: rgba(237,240,250,.5); line-height: 1.6;
  }
  .rp-notice-icon { color: #7B9EFF; margin-top: 2px; flex-shrink: 0; }
  .rp-table-wrap {
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; overflow: hidden;
  }
  .rp-table { width: 100%; border-collapse: collapse; }
  .rp-table thead tr { border-bottom: 1px solid rgba(255,255,255,.06); }
  .rp-table th {
    padding: 12px 16px;
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700;
    letter-spacing: .15em; text-transform: uppercase;
    color: rgba(237,240,250,.25); text-align: left;
  }
  .rp-table td {
    padding: 14px 16px;
    font-size: 13px; color: rgba(237,240,250,.75);
    border-bottom: 1px solid rgba(255,255,255,.04);
    vertical-align: middle;
  }
  .rp-table tbody tr:last-child td { border-bottom: none; }
  .rp-table tbody tr:hover td { background: rgba(255,255,255,.02); }
  .rp-avatar {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Mono', monospace; font-weight: 700;
    font-size: 11px; flex-shrink: 0;
  }
  .rp-avatar-responder { background: linear-gradient(135deg, #0a3060, #1565c0); color: #7B9EFF; border: 1px solid rgba(123,158,255,.25); }
  .rp-avatar-citizen { background: linear-gradient(135deg, #0a3d2e, #1a6645); color: #2ECC8F; border: 1px solid rgba(46,204,143,.25); }
  .rp-name-cell { display: flex; align-items: center; gap: 10px; }
  .rp-name { font-weight: 600; color: #f0f2f8; font-size: 13px; }
  .rp-source-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 5px;
    font-size: 9px; font-family: 'IBM Plex Mono', monospace; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase;
  }
  .rp-tag-auth { background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.2); color: #2ECC8F; }
  .rp-tag-manual { background: rgba(255,209,102,.1); border: 1px solid rgba(255,209,102,.2); color: #FFD166; }
  .rp-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 6px;
    font-size: 11px; font-weight: 600; font-family: 'IBM Plex Mono', monospace;
    text-transform: uppercase; letter-spacing: .06em;
  }
  .rp-status-active { background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.2); color: #2ECC8F; }
  .rp-status-inactive { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: rgba(237,240,250,.35); }
  .rp-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .rp-duty-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 6px;
    font-size: 11px; font-weight: 700; font-family: 'IBM Plex Mono', monospace;
    text-transform: uppercase; letter-spacing: .06em;
  }
  .rp-duty-badge--on { background: rgba(46,204,143,.1); border: 1px solid rgba(46,204,143,.25); color: #2ECC8F; }
  .rp-duty-badge--off { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09); color: rgba(237,240,250,.3); }
  .rp-duty-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .rp-duty-toggle {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px; border-radius: 6px; border: 1px solid;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .16s;
  }
  .rp-duty-toggle--on { background: rgba(46,204,143,.08); border-color: rgba(46,204,143,.2); color: #2ECC8F; }
  .rp-duty-toggle--on:hover { background: rgba(46,204,143,.16); border-color: rgba(46,204,143,.4); }
  .rp-duty-toggle--off { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: rgba(237,240,250,.4); }
  .rp-duty-toggle--off:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); color: rgba(237,240,250,.7); }
  .rp-action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
  .rp-btn-edit, .rp-btn-remove {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px; border-radius: 6px; border: 1px solid;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .16s;
  }
  .rp-btn-edit { background: rgba(123,158,255,.08); border-color: rgba(123,158,255,.2); color: #7B9EFF; }
  .rp-btn-edit:hover { background: rgba(123,158,255,.16); border-color: rgba(123,158,255,.4); }
  .rp-btn-remove { background: rgba(230,57,70,.07); border-color: rgba(230,57,70,.18); color: rgba(230,57,70,.7); }
  .rp-btn-remove:hover { background: rgba(230,57,70,.14); border-color: rgba(230,57,70,.35); color: #e63946; }
  .rp-empty { text-align: center; padding: 52px 20px; color: rgba(237,240,250,.25); }
  .rp-empty-icon { font-size: 32px; margin-bottom: 12px; opacity: .3; }
  .rp-empty-text { font-size: 14px; }

  /* ── Modal ── */
  .rp-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.65);
    backdrop-filter: blur(6px);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .rp-modal {
    background: #0d1626;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px; padding: 28px;
    width: 100%; max-width: 460px;
    box-shadow: 0 24px 60px rgba(0,0,0,.5);
    animation: rpModalIn .22s ease;
  }
  @keyframes rpModalIn { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
  .rp-modal-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #f0f2f8; margin: 0 0 6px; }
  .rp-modal-sub { font-size: 13px; color: rgba(237,240,250,.35); margin: 0 0 22px; line-height: 1.6; }

  /* Auth account toggle */
  .rp-auth-toggle {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px;
    background: rgba(123,158,255,.05);
    border: 1px solid rgba(123,158,255,.15);
    border-radius: 10px; margin-bottom: 18px; cursor: pointer;
    transition: background .17s;
  }
  .rp-auth-toggle:hover { background: rgba(123,158,255,.09); }
  .rp-auth-toggle-left { display: flex; flex-direction: column; gap: 2px; }
  .rp-auth-toggle-label { font-size: 13px; font-weight: 600; color: #7B9EFF; }
  .rp-auth-toggle-sub { font-size: 11px; color: rgba(237,240,250,.3); }
  .rp-auth-switch {
    width: 36px; height: 20px; border-radius: 10px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
    position: relative; transition: background .2s; flex-shrink: 0;
  }
  .rp-auth-switch.on { background: #7B9EFF; border-color: #7B9EFF; }
  .rp-auth-switch::after {
    content: ''; position: absolute;
    top: 2px; left: 2px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; transition: transform .2s;
  }
  .rp-auth-switch.on::after { transform: translateX(16px); }

  /* Auth section */
  .rp-auth-section {
    background: rgba(123,158,255,.04);
    border: 1px solid rgba(123,158,255,.12);
    border-radius: 10px; padding: 14px;
    margin-bottom: 4px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .rp-auth-section-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(123,158,255,.5);
    margin-bottom: 2px;
  }

  .rp-field { margin-bottom: 14px; }
  .rp-label { display: block; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(237,240,250,.3); margin-bottom: 6px; font-family: 'IBM Plex Mono', monospace; }
  .rp-input { width: 100%; padding: 10px 13px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; color: #edf0fa; outline: none; transition: border-color .17s; box-sizing: border-box; }
  .rp-input::placeholder { color: rgba(237,240,250,.22); }
  .rp-input:focus { border-color: rgba(123,158,255,.5); }
  .rp-input-wrap { position: relative; }
  .rp-pw-toggle { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(237,240,250,.3); cursor: pointer; padding: 2px; display: flex; align-items: center; }
  .rp-pw-toggle:hover { color: rgba(237,240,250,.7); }
  .rp-select { width: 100%; padding: 10px 13px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; color: #edf0fa; outline: none; cursor: pointer; box-sizing: border-box; }
  .rp-select option { background: #0d1626; }

  /* Error / success banners */
  .rp-modal-error { padding: 10px 14px; background: rgba(230,57,70,.08); border: 1px solid rgba(230,57,70,.2); border-radius: 8px; font-size: 12px; color: #ff7b87; margin-bottom: 14px; line-height: 1.5; }
  .rp-modal-success { padding: 10px 14px; background: rgba(46,204,143,.08); border: 1px solid rgba(46,204,143,.2); border-radius: 8px; font-size: 12px; color: #2ECC8F; margin-bottom: 14px; line-height: 1.5; }

  .rp-modal-actions { display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end; }
  .rp-modal-save { padding: 10px 22px; background: linear-gradient(135deg, #e63946, #ff5d73); border: none; border-radius: 8px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; transition: all .17s; box-shadow: 0 4px 12px rgba(230,57,70,.3); display: flex; align-items: center; gap: 8px; }
  .rp-modal-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(230,57,70,.4); }
  .rp-modal-save:disabled { opacity: .5; cursor: not-allowed; }
  .rp-modal-cancel { padding: 10px 18px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 500; color: rgba(237,240,250,.5); cursor: pointer; transition: all .17s; }
  .rp-modal-cancel:hover { background: rgba(255,255,255,.09); color: #fff; }
  .rp-spinner { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.2); border-top-color: #fff; animation: rpSpin .7s linear infinite; }
`;

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  return (
    name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "??"
  );
}

interface ProfileUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at?: string;
  source: "auth";
}

interface ManualResponder {
  id: string;
  name: string | null;
  email: string;
  status: string;
  on_duty: boolean;
  source: "manual";
}

type TabId = "responders" | "citizens";
type DutyFilter = "all" | "on" | "off";

export default function RespondersPage() {
  const [tab, setTab]               = useState<TabId>("responders");
  const [dutyFilter, setDutyFilter] = useState<DutyFilter>("all");

  const [profileResponders, setProfileResponders] = useState<ProfileUser[]>([]);
  const [citizens, setCitizens]                   = useState<ProfileUser[]>([]);
  const [manualResponders, setManualResponders]   = useState<ManualResponder[]>([]);

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Add modal state
  const [showAdd, setShowAdd]         = useState(false);
  const [createAuth, setCreateAuth]   = useState(true);  // toggle: create real auth account
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [modalError, setModalError]   = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [formData, setFormData]       = useState({
    name: "", email: "", password: "", on_duty: true,
  });

  // Edit modal state
  const [showEdit, setShowEdit]   = useState(false);
  const [selected, setSelected]   = useState<ManualResponder | null>(null);
  const [editForm, setEditForm]   = useState({ name: "", email: "", on_duty: true });

  const fetchAll = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at");

    if (profilesError) console.error("profiles fetch error:", profilesError.message);

    const profileRows = profiles ?? [];

    setProfileResponders(
      profileRows.filter((p) => p.role === "responder")
        .map((p) => ({ ...p, source: "auth" as const }))
    );
    setCitizens(
      profileRows.filter((p) => p.role === "citizen" || !p.role)
        .map((p) => ({ ...p, source: "auth" as const }))
    );

    const { data: manual } = await supabase.from("responders").select("*");
    setManualResponders(
      (manual ?? []).map((r) => ({ ...r, on_duty: r.on_duty ?? false, source: "manual" as const }))
    );

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Add Responder ─────────────────────────────────────────────────────────
  const addResponder = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError("Name and email are required.");
      return;
    }
    if (createAuth && formData.password.length < 6) {
      setModalError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setModalError(null);
    setModalSuccess(null);

    // Step 1: Create Supabase auth account if toggled on
    if (createAuth) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: { full_name: formData.name.trim(), role: "responder" },
        },
      });

      if (signUpError) {
        setModalError(`Auth account error: ${signUpError.message}`);
        setSaving(false);
        return;
      }

      // Step 2: Upsert into profiles table with role = responder
      const userId = signUpData.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: formData.name.trim(),
          email: formData.email.trim(),
          role: "responder",
        });
      }
    }

    // Step 3: Always insert into responders table
    const { error: insertError } = await supabase.from("responders").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      status: "active",
      on_duty: formData.on_duty,
    });

    if (insertError) {
      setModalError(`Responder record error: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setModalSuccess(
      createAuth
        ? `✓ Auth account + responder record created for ${formData.email}`
        : `✓ Responder record added for ${formData.name}`
    );
    setSaving(false);
    setFormData({ name: "", email: "", password: "", on_duty: true });
    setCreateAuth(true);
    fetchAll(true);

    // Auto-close after 1.5s
    setTimeout(() => { setShowAdd(false); setModalSuccess(null); }, 1500);
  };

  const updateResponder = async () => {
    if (!selected) return;
    await supabase
      .from("responders")
      .update({ name: editForm.name, email: editForm.email, on_duty: editForm.on_duty })
      .eq("id", selected.id);
    setShowEdit(false);
    setSelected(null);
    fetchAll(true);
  };

  const removeResponder = async (id: string) => {
    if (!confirm("Remove this responder?")) return;
    await supabase.from("responders").delete().eq("id", id);
    setManualResponders((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleDuty = async (r: ManualResponder) => {
    setTogglingId(r.id);
    const newDuty = !r.on_duty;
    await supabase.from("responders").update({ on_duty: newDuty }).eq("id", r.id);
    setManualResponders((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, on_duty: newDuty } : x))
    );
    setTogglingId(null);
  };

  const q = search.toLowerCase();

  const allResponders: Array<ProfileUser | ManualResponder> = [
    ...profileResponders,
    ...manualResponders,
  ];

  const filteredResponders = allResponders.filter((r) => {
    const name  = "full_name" in r ? (r.full_name ?? "") : (r.name ?? "");
    const email = r.email ?? "";
    const matchesSearch = name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    if (dutyFilter !== "all" && "on_duty" in r) {
      if (dutyFilter === "on" && !r.on_duty) return false;
      if (dutyFilter === "off" && r.on_duty) return false;
    }
    return matchesSearch;
  });

  const filteredCitizens = citizens.filter(
    (c) =>
      (c.full_name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
  );

  const onDutyCount  = manualResponders.filter((r) => r.on_duty).length;
  const offDutyCount = manualResponders.filter((r) => !r.on_duty).length;

  const stats = [
    { label: "Total Responders", value: allResponders.length,     accent: "#7B9EFF" },
    { label: "On Duty",          value: onDutyCount,              accent: "#2ECC8F" },
    { label: "Off Duty",         value: offDutyCount,             accent: "#FFD166" },
    { label: "Auth Accounts",    value: profileResponders.length, accent: "#FB923C" },
    { label: "Citizens",         value: citizens.length,          accent: "#B0B8CC" },
  ];

  const renderResponderRow = (r: ProfileUser | ManualResponder, i: number) => {
    const isAuth   = "full_name" in r;
    const name     = isAuth ? (r.full_name ?? "Unknown") : ((r as ManualResponder).name ?? "Unknown");
    const status   = isAuth ? "active" : (r as ManualResponder).status;
    const isOnDuty = isAuth ? true : (r as ManualResponder).on_duty;

    return (
      <tr key={r.id ?? i}>
        <td>
          <div className="rp-name-cell">
            <div className="rp-avatar rp-avatar-responder">{getInitials(name)}</div>
            <div>
              <div className="rp-name">{name || "—"}</div>
              <span className={`rp-source-tag ${isAuth ? "rp-tag-auth" : "rp-tag-manual"}`}>
                {isAuth ? "✓ Signed Up" : "Manual"}
              </span>
            </div>
          </div>
        </td>
        <td style={{ color: "rgba(237,240,250,.55)", fontSize: 12 }}>{r.email || "—"}</td>
        <td>
          <span className={`rp-status-badge ${status === "active" ? "rp-status-active" : "rp-status-inactive"}`}>
            <span className="rp-status-dot" />{status || "active"}
          </span>
        </td>
        <td>
          <span className={`rp-duty-badge ${isOnDuty ? "rp-duty-badge--on" : "rp-duty-badge--off"}`}>
            <span className="rp-duty-badge-dot" />{isOnDuty ? "On Duty" : "Off Duty"}
          </span>
        </td>
        <td>
          {!isAuth ? (
            <div className="rp-action-btns">
              <button
                className={`rp-duty-toggle ${isOnDuty ? "rp-duty-toggle--on" : "rp-duty-toggle--off"}`}
                onClick={() => toggleDuty(r as ManualResponder)}
                disabled={togglingId === r.id}
              >
                {isOnDuty ? <FaToggleOn size={11} /> : <FaToggleOff size={11} />}
                {togglingId === r.id ? "…" : isOnDuty ? "On Duty" : "Off Duty"}
              </button>
              <button
                className="rp-btn-edit"
                onClick={() => {
                  setSelected(r as ManualResponder);
                  setEditForm({ name: (r as ManualResponder).name ?? "", email: r.email, on_duty: (r as ManualResponder).on_duty });
                  setShowEdit(true);
                }}
              >
                <FaEdit size={10} /> Edit
              </button>
              <button className="rp-btn-remove" onClick={() => removeResponder(r.id)}>
                <FaTrash size={10} /> Remove
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(237,240,250,.2)", fontFamily: "monospace" }}>
              Auth-managed
            </span>
          )}
        </td>
      </tr>
    );
  };

  const renderCitizenRow = (c: ProfileUser, i: number) => (
    <tr key={c.id ?? i}>
      <td>
        <div className="rp-name-cell">
          <div className="rp-avatar rp-avatar-citizen">{getInitials(c.full_name)}</div>
          <div>
            <div className="rp-name">{c.full_name || "—"}</div>
            <span className="rp-source-tag rp-tag-auth">✓ Registered</span>
          </div>
        </div>
      </td>
      <td style={{ color: "rgba(237,240,250,.55)", fontSize: 12 }}>{c.email || "—"}</td>
      <td><span className="rp-status-badge rp-status-active"><span className="rp-status-dot" /> Active</span></td>
      <td><span className="rp-duty-badge rp-duty-badge--on"><span className="rp-duty-badge-dot" /> Registered</span></td>
      <td style={{ fontSize: 12, color: "rgba(237,240,250,.3)", fontFamily: "monospace" }}>
        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
      </td>
    </tr>
  );

  return (
    <>
      <style>{RP_STYLE}</style>
      <div className="rp-root">

        <div className="rp-header">
          <div>
            <div className="rp-eyebrow">Personnel Management</div>
            <h2 className="rp-title">Responders & Citizens</h2>
            <p className="rp-subtitle">All registered accounts and manually-added responders</p>
          </div>
          <button className="rp-add-btn" onClick={() => { setFormData({ name: "", email: "", password: "", on_duty: true }); setModalError(null); setModalSuccess(null); setShowAdd(true); }}>
            <FaPlus size={11} /> Add Responder
          </button>
        </div>

        <div className="rp-stats">
          {stats.map((s) => (
            <div key={s.label} className="rp-stat" style={{ "--s-accent": s.accent } as React.CSSProperties}>
              <div className="rp-stat-num">{loading ? "—" : s.value}</div>
              <div className="rp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rp-tabs">
          <button className={`rp-tab${tab === "responders" ? " active" : ""}`} onClick={() => { setTab("responders"); setDutyFilter("all"); }}>
            <FaUserShield size={11} /> Responders <span className="rp-tab-count">{allResponders.length}</span>
          </button>
          <button className={`rp-tab${tab === "citizens" ? " active" : ""}`} onClick={() => setTab("citizens")}>
            <FaUserCircle size={11} /> Citizens <span className="rp-tab-count">{citizens.length}</span>
          </button>
        </div>

        {tab === "responders" && (
          <div className="rp-duty-filter">
            <button className={`rp-duty-pill rp-duty-pill--all${dutyFilter === "all" ? " active" : ""}`} onClick={() => setDutyFilter("all")}>All ({allResponders.length})</button>
            <button className={`rp-duty-pill rp-duty-pill--on${dutyFilter === "on" ? " active" : ""}`} onClick={() => setDutyFilter("on")}>
              <span className="rp-duty-dot" style={{ background: "#2ECC8F" }} /> On Duty ({onDutyCount})
            </button>
            <button className={`rp-duty-pill rp-duty-pill--off${dutyFilter === "off" ? " active" : ""}`} onClick={() => setDutyFilter("off")}>
              <span className="rp-duty-dot" style={{ background: "rgba(237,240,250,.3)" }} /> Off Duty ({offDutyCount})
            </button>
          </div>
        )}

        <div className="rp-notice">
          <FaUserShield className="rp-notice-icon" size={13} />
          <span>
            <strong style={{ color: "#7B9EFF" }}>Auth accounts</strong> are from your <code style={{ fontFamily: "monospace", fontSize: 11 }}>profiles</code> table.{" "}
            <strong style={{ color: "#FFD166" }}>Manual entries</strong> are from the <code style={{ fontFamily: "monospace", fontSize: 11 }}>responders</code> table.
            Use <strong style={{ color: "#2ECC8F" }}>Add Responder</strong> to create both at once.
          </span>
        </div>

        <div className="rp-toolbar">
          <div className="rp-search-wrap">
            <FaSearch className="rp-search-icon" />
            <input className="rp-search" placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className={`rp-refresh-btn${refreshing ? " spinning" : ""}`} onClick={() => fetchAll(true)}>
            <FaSyncAlt size={11} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}><div className="rp-spinner" /></div>
        ) : (
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Status</th><th>Duty</th><th>{tab === "citizens" ? "Joined" : "Actions"}</th></tr>
              </thead>
              <tbody>
                {tab === "responders" && (
                  filteredResponders.length === 0
                    ? <tr><td colSpan={5}><div className="rp-empty"><div className="rp-empty-icon"><FaUsers /></div><div className="rp-empty-text">No responders found</div></div></td></tr>
                    : filteredResponders.map(renderResponderRow)
                )}
                {tab === "citizens" && (
                  filteredCitizens.length === 0
                    ? <tr><td colSpan={5}><div className="rp-empty"><div className="rp-empty-icon"><FaUserCircle /></div><div className="rp-empty-text">No citizens found</div></div></td></tr>
                    : filteredCitizens.map(renderCitizenRow)
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Add Responder Modal ── */}
        {showAdd && (
          <div className="rp-overlay" onClick={() => setShowAdd(false)}>
            <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="rp-modal-title">Add Responder</h3>
              <p className="rp-modal-sub">Create a login account and add them to the responders list in one step.</p>

              {/* Auth account toggle */}
              <div className="rp-auth-toggle" onClick={() => setCreateAuth((v) => !v)}>
                <div className="rp-auth-toggle-left">
                  <span className="rp-auth-toggle-label">Create Login Account</span>
                  <span className="rp-auth-toggle-sub">Lets the responder log in to the app with email & password</span>
                </div>
                <div className={`rp-auth-switch${createAuth ? " on" : ""}`} />
              </div>

              {/* Basic info */}
              <div className="rp-field">
                <label className="rp-label">Full Name</label>
                <input className="rp-input" placeholder="e.g. Juan dela Cruz" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="rp-field">
                <label className="rp-label">Email</label>
                <input className="rp-input" type="email" placeholder="e.g. juan@bfp.gov.ph" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              {/* Password — only shown when creating auth account */}
              {createAuth && (
                <div className="rp-auth-section">
                  <div className="rp-auth-section-label">Login Credentials</div>
                  <div className="rp-field" style={{ marginBottom: 0 }}>
                    <label className="rp-label">Password</label>
                    <div className="rp-input-wrap">
                      <input
                        className="rp-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        style={{ paddingRight: 38 }}
                      />
                      <button className="rp-pw-toggle" type="button" onClick={() => setShowPassword((v) => !v)}>
                        {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rp-field" style={{ marginTop: 14 }}>
                <label className="rp-label">Duty Status</label>
                <select className="rp-select" value={formData.on_duty ? "on" : "off"} onChange={(e) => setFormData({ ...formData, on_duty: e.target.value === "on" })}>
                  <option value="on">On Duty</option>
                  <option value="off">Off Duty</option>
                </select>
              </div>

              {modalError   && <div className="rp-modal-error">⚠ {modalError}</div>}
              {modalSuccess && <div className="rp-modal-success">{modalSuccess}</div>}

              <div className="rp-modal-actions">
                <button className="rp-modal-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="rp-modal-save" onClick={addResponder} disabled={saving}>
                  {saving && <span className="rp-spinner" />}
                  {saving ? "Saving…" : "Add Responder"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Modal ── */}
        {showEdit && (
          <div className="rp-overlay" onClick={() => setShowEdit(false)}>
            <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="rp-modal-title">Edit Responder</h3>
              <p className="rp-modal-sub">Update the details for this manual entry.</p>
              <div className="rp-field">
                <label className="rp-label">Full Name</label>
                <input className="rp-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="rp-field">
                <label className="rp-label">Email</label>
                <input className="rp-input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="rp-field">
                <label className="rp-label">Duty Status</label>
                <select className="rp-select" value={editForm.on_duty ? "on" : "off"} onChange={(e) => setEditForm({ ...editForm, on_duty: e.target.value === "on" })}>
                  <option value="on">On Duty</option>
                  <option value="off">Off Duty</option>
                </select>
              </div>
              <div className="rp-modal-actions">
                <button className="rp-modal-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
                <button className="rp-modal-save" onClick={updateResponder}>Update</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}