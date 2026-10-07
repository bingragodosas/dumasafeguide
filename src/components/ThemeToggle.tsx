// src/components/ThemeToggle.tsx
//
// Small sun/moon toggle for the opt-in light mode.
// Works anywhere inside <ThemeProvider>.

import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, isLight } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={isLight}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: compact ? "6px 8px" : "7px 12px",
        borderRadius: "8px",
        border: "1px solid var(--clr-border)",
        background: "var(--clr-surface)",
        color: "var(--clr-text-muted)",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true">{isLight ? "🌙" : "☀️"}</span>
      {!compact && <span>{isLight ? "Dark" : "Light"}</span>}
      <span
        aria-hidden="true"
        style={{
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        {theme}
      </span>
    </button>
  );
}
