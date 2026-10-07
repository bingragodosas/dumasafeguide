import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, any>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY =
  (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAEyz-wD6yQmn6txp";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: (msg: string) => void;
  onReady?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Maps Cloudflare Turnstile error codes to actionable messages so users
 * (and developers via the console) can tell a blocked script apart from a
 * misconfigured site key.
 */
function describeTurnstileError(code: unknown): string {
  const c = String(code ?? "").toLowerCase();
  console.error("[TurnstileWidget] error code:", code);
  switch (c) {
    case "invalid-sitekey":
      return "Security check is misconfigured (invalid site key). Please contact support.";
    case "invalid-domain":
      return "Security check rejected this domain. Please contact support.";
    case "unsupported-browser":
      return "Security check isn't supported by this browser. Please try Chrome, Edge, or Firefox.";
    case "timeout":
    case "timeout-or-duplicate":
      return "Security check timed out. Please retry.";
    case "rate-limited":
      return "Too many security checks. Please wait a minute and retry.";
    case "network-error":
      return "Security check couldn't reach Cloudflare. Check your connection or VPN and retry.";
    default:
      return "Security check failed to load. Check your connection / ad-blocker and retry.";
  }
}

/**
 * Renders Cloudflare Turnstile once per mount and loads the script only when this
 * component is mounted. Ensures a single widget instance per mount + proper cleanup.
 *
 * Reliability notes:
 * - Every mount injects a FRESH script tag (removing stale ones first), so the
 *   parent's Retry button (which remounts via `key`) actually reloads Cloudflare
 *   instead of re-listening to a dead/blocked tag forever.
 * - A script `onerror` fires the error path immediately instead of waiting out
 *   the full 10s poll window.
 */
export default function TurnstileWidget({
  onToken,
  onExpired,
  onError,
  onReady,
  theme = "dark",
  className,
  style,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);
  onTokenRef.current = onToken;
  onExpiredRef.current = onExpired;
  onErrorRef.current = onError;
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const renderWidget = () => {
      if (cancelled) return false;
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) {
        return !!widgetIdRef.current;
      }
      if (containerRef.current.childElementCount > 0) {
        containerRef.current.innerHTML = "";
      }
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme,
          callback: (token: string) => {
            if (cancelled) return;
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            if (cancelled) return;
            onExpiredRef.current?.();
            try {
              if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current);
            } catch {}
          },
          "timeout-callback": () => {
            if (cancelled) return;
            onErrorRef.current?.("Security check timed out. Please retry.");
          },
          "error-callback": (code?: string) => {
            if (cancelled) return;
            onErrorRef.current?.(describeTurnstileError(code));
          },
        });
        if (!cancelled) onReadyRef.current?.();
        return true;
      } catch (e) {
        console.error("[TurnstileWidget] render failed:", e);
        onErrorRef.current?.("Security check failed to load. Check your connection / ad-blocker and retry.");
        return false;
      }
    };

    // Always (re)inject a fresh API script on mount. A previous tag may have
    // been blocked by an ad-blocker/VPN (its `load` never fires), in which
    // case merely listening to it would hang until the poll window expires —
    // and every Retry remount would hang the same way. Removing stale tags
    // first guarantees each mount gets a real load attempt + an `onerror`.
    const injectScript = () => {
      try {
        document
          .querySelectorAll<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]')
          .forEach((s) => s.remove());
      } catch {}
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => renderWidget());
      script.addEventListener("error", () => {
        if (cancelled) return;
        onErrorRef.current?.(
          "Security check script was blocked. Disable your ad-blocker for this site (or allow challenges.cloudflare.com) and retry."
        );
      });
      document.head.appendChild(script);
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let attempts = 0;
      pollTimer = setInterval(() => {
        attempts += 1;
        if (window.turnstile) {
          if (pollTimer) clearInterval(pollTimer);
          renderWidget();
        } else if (attempts > 50) {
          if (pollTimer) clearInterval(pollTimer);
          if (!cancelled) onErrorRef.current?.("Security check failed to load. Check your connection / ad-blocker and retry.");
        }
      }, 200);

      injectScript();
    }

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch {}
      widgetIdRef.current = null;
    };
  }, [theme]);

  return <div ref={containerRef} className={className} style={style} />;
}

export { TURNSTILE_SITE_KEY };
