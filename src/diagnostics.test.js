import { describe, test, expect } from "vitest";
import { appendEntry, formatEntry, diagActive, diagLog, readLog, MAX_LINES } from "./diagnostics.js";

describe("diagnostics", () => {
  test("is off without ?diag=1, and then logs nothing", () => {
    expect(diagActive).toBe(false);
    diagLog("connect", "x");
    expect(readLog()).toEqual([]);
  });

  test("keeps only the last lines", () => {
    let list = [];
    for (let i = 0; i < MAX_LINES + 5; i++) list = appendEntry(list, { at: i, event: `e${i}`, detail: "" });
    expect(list).toHaveLength(MAX_LINES);
    expect(list[0].event).toBe("e5");
    expect(list.at(-1).event).toBe(`e${MAX_LINES + 4}`);
  });

  test("a broken list starts over", () => {
    expect(appendEntry(null, { at: 0, event: "load", detail: "" })).toHaveLength(1);
  });

  test("formats a line with the local time, the event and the detail", () => {
    const at = new Date(2026, 10, 20, 9, 5, 7, 42).getTime();
    expect(formatEntry({ at, event: "disconnect", detail: "transport close" })).toBe("09:05:07.042 disconnect transport close");
    expect(formatEntry({ at, event: "freeze", detail: "" })).toBe("09:05:07.042 freeze");
  });
});
