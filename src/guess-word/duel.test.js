import { describe, test, expect } from "vitest";
import { isDuel, opponentOf, duelStatus, duelHeadline, duelRows } from "./duel.js";

const players = [
  { index: 0, name: "Iara", color: 1 },
  { index: 1, name: "Caetano", color: 2 },
];

const view = (extra = {}) => ({
  mode: "duel",
  maxTries: 4,
  length: 5,
  word: null,
  outcome: null,
  solvedBy: null,
  winners: null,
  boards: [
    { index: 0, tries: 1, solved: false, left: false, rows: [{ word: "PRATO", colors: ["absent", "absent", "present", "absent", "correct"] }] },
    { index: 1, tries: 2, solved: false, left: false, rows: [{ colors: ["absent", "absent", "absent", "absent", "absent"] }, { colors: ["correct", "absent", "absent", "absent", "absent"] }] },
  ],
  ...extra,
});

describe("reading a duel", () => {
  test("tells a duel from a rounds match, and finds the opponent", () => {
    expect(isDuel(view())).toBe(true);
    expect(isDuel({ round: {} })).toBe(false);
    expect(opponentOf(view(), 0)).toBe(1);
    expect(opponentOf(view(), 1)).toBe(0);
  });

  test("the status says who to beat, the length and the tries left", () => {
    expect(duelStatus(view(), players, 0)).toBe("Acerte antes de Caetano: 5 letras. Restam 3 tentativas");
    const out = view();
    out.boards[0].tries = 4;
    expect(duelStatus(out, players, 0)).toBe("Acabaram suas tentativas. Torça para Caetano errar.");
  });
});

describe("the result of a duel", () => {
  test("win", () => {
    const end = view({ outcome: "solved", solvedBy: 0, winners: [0], word: "GATOS" });
    end.boards[0].tries = 3;
    expect(duelHeadline(end, players, 0)).toEqual({
      title: "Você Venceu",
      detail: "Você acertou em 3 tentativas. A palavra era GATOS.",
      won: true,
    });
  });

  test("loss", () => {
    const end = view({ outcome: "solved", solvedBy: 1, winners: [1], word: "GATOS" });
    expect(duelHeadline(end, players, 0)).toEqual({
      title: "Caetano Venceu",
      detail: "Caetano acertou primeiro, em 2 tentativas. A palavra era GATOS.",
      won: false,
    });
  });

  test("draw, out of tries or out of time", () => {
    const noTries = duelHeadline(view({ outcome: "no-tries", winners: [0, 1], word: "GATOS" }), players, 0);
    expect(noTries).toEqual({ title: "Empate", detail: "Acabaram as tentativas dos dois. A palavra era GATOS.", won: false });
    const timeUp = duelHeadline(view({ outcome: "time-up", winners: [0, 1], word: "GATOS" }), players, 1);
    expect(timeUp).toEqual({ title: "Empate", detail: "O tempo acabou sem acerto. A palavra era GATOS.", won: false });
  });

  test("forfeit, from both sides", () => {
    const end = view({ outcome: "forfeit", winners: [0], word: "GATOS" });
    expect(duelHeadline(end, players, 0)).toEqual({
      title: "Você Venceu",
      detail: "Caetano saiu, então você venceu por W.O. A palavra era GATOS.",
      won: true,
    });
    expect(duelHeadline(end, players, 1).won).toBe(false);
  });

  test("rows: the winner first, with the tries used", () => {
    const end = view({ outcome: "solved", solvedBy: 1, winners: [1], word: "GATOS" });
    const rows = duelRows(end, players);
    expect(rows.map((r) => [r.name, r.winner, r.score])).toEqual([
      ["Caetano", true, "2/4"],
      ["Iara", false, "1/4"],
    ]);
    const draw = duelRows(view({ outcome: "time-up", winners: [0, 1] }), players);
    expect(draw.every((r) => !r.winner)).toBe(true);
  });
});
