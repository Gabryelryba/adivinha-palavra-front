import { describe, test, expect } from "vitest";
import { connectDecision } from "./resume.js";

const GAME = "guess-word";
const room = (code, phase = "lobby", gameId = GAME) => ({ code, gameId, phase, at: 1 });

describe("connectDecision", () => {
  test("in the waiting room on this page: ask for the seat back", () => {
    expect(connectDecision({ status: "lobby", remembered: room("AAAAA"), gameId: GAME }).action).toBe("resume-seat");
  });

  test("in a match on this page: the match went on without us", () => {
    expect(connectDecision({ status: "playing", gameId: GAME }).action).toBe("dropped");
    expect(connectDecision({ status: "ended", gameId: GAME }).action).toBe("dropped");
  });

  test("after a reload in a waiting room: resume the remembered room", () => {
    expect(connectDecision({ status: "connecting", remembered: room("AAAAA"), gameId: GAME })).toEqual({
      action: "resume-remembered",
      code: "AAAAA",
      joinAfter: null,
      usedInvite: false,
    });
  });

  test("after a reload in a match: back to the menu, saying why", () => {
    expect(connectDecision({ status: "connecting", remembered: room("AAAAA", "playing"), gameId: GAME }).action).toBe(
      "dropped"
    );
  });

  test("the invite to the same room: resume first, join as a fallback", () => {
    expect(connectDecision({ status: "connecting", remembered: room("AAAAA"), inviteCode: "AAAAA", gameId: GAME })).toEqual({
      action: "resume-remembered",
      code: "AAAAA",
      joinAfter: "AAAAA",
      usedInvite: true,
    });
  });

  test("an invite to another room wins over the remembered one", () => {
    expect(connectDecision({ status: "connecting", remembered: room("AAAAA"), inviteCode: "BBBBB", gameId: GAME })).toEqual({
      action: "join",
      code: "BBBBB",
      usedInvite: true,
    });
  });

  test("a room remembered for another game is ignored", () => {
    expect(connectDecision({ status: "connecting", remembered: room("AAAAA", "lobby", "dotz"), gameId: GAME }).action).toBe(
      "menu"
    );
  });

  test("nothing remembered and no invite: the menu", () => {
    expect(connectDecision({ status: "connecting", gameId: GAME })).toEqual({ action: "menu", usedInvite: false });
    expect(connectDecision({ status: "menu", remembered: null, gameId: GAME }).action).toBe("menu");
  });

  test("only an invite: join it", () => {
    expect(connectDecision({ status: "connecting", inviteCode: "CCCCC", gameId: GAME })).toEqual({
      action: "join",
      code: "CCCCC",
      usedInvite: true,
    });
  });
});
