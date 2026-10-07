// src/citizen/components/ui.tsx
// ── Citizen design-system primitives ─────────────────────────────────────
// Every primitive renders a `dsg-*` class from citizen-ui.css and accepts
// theme colors as CSS-var strings. No raw hex here — dark and light both work.

import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

/* ── Type ── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="dsg-eyebrow">{children}</div>;
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="dsg-h1">{children}</h1>;
}

/* ── Surfaces ── */

export function Card({
  children,
  accent,
  flush,
  style,
  className = "",
}: {
  children: ReactNode;
  accent?: string;
  flush?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`dsg-card${flush ? " dsg-card--flush" : ""} ${className}`}
      style={{ ...(accent ? ({ "--card-accent": accent } as CSSProperties) : null), ...style }}
    >
      {children}
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="dsg-sec-head">
      <h2 className="dsg-sec-title">{title}</h2>
      {action}
    </div>
  );
}

/* ── Stats ── */

export function Stat({
  icon,
  value,
  label,
  accent,
  loading,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="dsg-stat" style={{ "--stat-accent": accent } as CSSProperties}>
      <div className="dsg-stat-ic">{icon}</div>
      <div className="dsg-stat-num">{loading ? "—" : value}</div>
      <div className="dsg-stat-label">{label}</div>
    </div>
  );
}

/* ── Badges ── */

function tinted(color: string, bg: string, border: string): CSSProperties {
  return { color, backgroundColor: bg, borderColor: border };
}

/** Status pill with leading dot (PENDING / IN PROGRESS / RESOLVED …). */
export function StatusPill({
  color,
  bg,
  border,
  children,
}: {
  color: string;
  bg: string;
  border: string;
  children: ReactNode;
}) {
  return (
    <span className="dsg-pill" style={tinted(color, bg, border)}>
      <span className="dsg-dot" />
      {children}
    </span>
  );
}

/** Small category tag (report type, alert level …). */
export function Tag({
  color,
  bg,
  border,
  children,
}: {
  color: string;
  bg: string;
  border: string;
  children: ReactNode;
}) {
  return (
    <span className="dsg-tag" style={tinted(color, bg, border)}>
      {children}
    </span>
  );
}

/** Rounded-square glyph tile for list rows. */
export function Tile({ icon, color }: { icon: ReactNode; color?: string }) {
  return (
    <span className="dsg-tile" style={color ? { color } : undefined}>
      {icon}
    </span>
  );
}

/* ── Actions ── */

export function QuickAction({
  icon,
  label,
  to,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <Tile icon={icon} />
      {label}
    </>
  );
  if (to) {
    return (
      <Link to={to} className="dsg-qa">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="dsg-qa">
      {inner}
    </button>
  );
}

/* ── Feedback ── */

export function EmptyState({
  icon,
  title,
  sub,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="dsg-empty">
      <div className="dsg-empty-icon">{icon}</div>
      <div className="dsg-empty-title">{title}</div>
      {sub && <p className="dsg-empty-sub">{sub}</p>}
      {actionLabel && (
        <button type="button" className="dsg-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Shimmer placeholder block for loading lists. */
export function Skeleton({ width = "100%", height = 12 }: { width?: string | number; height?: string | number }) {
  return <div className="dsg-skel" style={{ width, height }} aria-hidden="true" />;
}

/** Three shimmer rows approximating a report/alert row. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "6px 0" }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Skeleton width={34} height={34} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width="45%" height={12} />
            <Skeleton width="90%" height={10} />
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton width={70} height={16} />
              <Skeleton width={52} height={12} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Notice strip ── */

export function Banner({
  icon,
  children,
  action,
  accent,
  bg,
  border,
}: {
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  accent?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <div
      className="dsg-banner"
      style={
        {
          ...(accent ? ({ "--banner-accent": accent } as CSSProperties) : null),
          ...(bg ? ({ "--banner-bg": bg } as CSSProperties) : null),
          ...(border ? ({ "--banner-border": border } as CSSProperties) : null),
        } as CSSProperties
      }
    >
      <span style={{ color: accent ?? "var(--c-pending)", fontSize: 15, display: "flex" }}>{icon}</span>
      <div className="dsg-banner-body">{children}</div>
      {action}
    </div>
  );
}
