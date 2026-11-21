// Diagnostics mode, on with ?diag=1 (DG-130): a log of what the browser does to
// the page and the connection when the player switches to another app, to find
// out what a phone does to a tab in the background. Nothing is sent anywhere:
// the log stays in this browser's localStorage (so it survives a reload) and the
// panel offers to copy it.
//
// main.js imports this module first, before socket.js creates the clientId, so
// the "load" line can tell whether the tab still had its clientId.

const LOG_KEY = "arcade-hub:diag-log";
const ON_KEY = "arcade-hub:diag";
export const MAX_LINES = 200;

// -> the list with the entry added at the end, keeping the last `max`.
export function appendEntry(list, entry, max = MAX_LINES) {
  const next = [...(Array.isArray(list) ? list : []), entry];
  return next.length > max ? next.slice(next.length - max) : next;
}

// One line per entry: local time with milliseconds, event, detail.
export function formatEntry({ at, event, detail }) {
  const d = new Date(at);
  const pad = (n, size = 2) => String(n).padStart(size, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  return detail ? `${time} ${event} ${detail}` : `${time} ${event}`;
}

function store(name) {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null;
  }
}

function isOn() {
  try {
    const asked = new URLSearchParams(globalThis.location?.search ?? "").get("diag");
    if (asked === "1") store("sessionStorage")?.setItem(ON_KEY, "1");
    if (asked === "0") store("sessionStorage")?.removeItem(ON_KEY);
    return store("sessionStorage")?.getItem(ON_KEY) === "1";
  } catch {
    return false;
  }
}

export const diagActive = isOn();

const listeners = new Set();

export function readLog() {
  try {
    const list = JSON.parse(store("localStorage")?.getItem(LOG_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function diagLog(event, detail = "") {
  if (!diagActive) return;
  const list = appendEntry(readLog(), { at: Date.now(), event, detail: String(detail ?? "") });
  try {
    store("localStorage")?.setItem(LOG_KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: the panel still shows what it has.
  }
  for (const fn of listeners) fn(list);
}

export function clearLog() {
  try {
    store("localStorage")?.removeItem(LOG_KEY);
  } catch {
    // Nothing to clear.
  }
  for (const fn of listeners) fn([]);
}

export function logText(list = readLog()) {
  const header = `${globalThis.navigator?.userAgent ?? ""}\n`;
  return header + list.map(formatEntry).join("\n");
}

// -> unsubscribe
export function onLog(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function startWatching() {
  const nav = globalThis.performance?.getEntriesByType?.("navigation")?.[0]?.type ?? "?";
  let hadClientId = "?";
  let hadRoom = "?";
  try {
    hadClientId = store("sessionStorage")?.getItem("arcade-hub:client-id") ? "sim" : "não (novo)";
    hadRoom = store("sessionStorage")?.getItem("arcade-hub:room") ? "sim" : "não";
  } catch {
    hadClientId = "sem sessionStorage";
  }
  diagLog("load", `navegação=${nav} clientId existia=${hadClientId} sala lembrada=${hadRoom} visível=${document.visibilityState}`);

  document.addEventListener("visibilitychange", () => diagLog("visibilitychange", document.visibilityState));
  window.addEventListener("pagehide", (e) => diagLog("pagehide", `persisted=${e.persisted}`));
  window.addEventListener("pageshow", (e) => diagLog("pageshow", `persisted=${e.persisted}`));
  document.addEventListener("freeze", () => diagLog("freeze"));
  document.addEventListener("resume", () => diagLog("resume"));
  window.addEventListener("online", () => diagLog("online"));
  window.addEventListener("offline", () => diagLog("offline"));
}

if (diagActive && typeof document !== "undefined") startWatching();
