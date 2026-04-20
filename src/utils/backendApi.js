const LOCAL_FRONTEND_HOSTS = new Set(["localhost", "127.0.0.1"]);
const LOCAL_BACKEND_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function getCurrentHostname() {
  if (typeof window === "undefined") return "";
  return String(window.location.hostname || "").toLowerCase();
}

export function isLocalFrontendHost() {
  return LOCAL_FRONTEND_HOSTS.has(getCurrentHostname());
}

export function getLocalBackendFallbackBase() {
  const host = getCurrentHostname();
  if (host === "localhost") return "http://localhost:8000";
  if (host === "127.0.0.1") return "http://127.0.0.1:8000";
  return "";
}

export function sanitizeConfiguredBackendBase(configuredValue) {
  const normalized = String(configuredValue || "").trim().replace(/\/$/, "");
  if (!normalized) return "";
  if (typeof window === "undefined") return normalized;
  if (!isLocalFrontendHost() && LOCAL_BACKEND_RE.test(normalized)) return "";
  return normalized;
}

export function resolveBackendApiBase(configuredValue = import.meta.env.VITE_API_URL) {
  const configured = sanitizeConfiguredBackendBase(configuredValue);
  return configured || getLocalBackendFallbackBase();
}
