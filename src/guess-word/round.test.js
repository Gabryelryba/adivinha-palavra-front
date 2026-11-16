import { describe, test, expect, afterEach } from "vitest";
import { secondsLeft, formatClock, upcomingChoosers, outcomeText, roundScores } from "./round.js";
import { headline } from "./result.js";
import { setLanguage } from "arcade-hub-ui/i18n/index.svelte.js";

afterEach(() => setLanguage("en"));

const players = [
  { index: 0, name: "Iara", color: 1 },
  { index: 1, name: "Caetano", color: 2 },
  { index: 2, name: "Lívia", color: 3 },
];

const view = (round, extra = {}) => ({
  order: [1, 2, 0],
  scores: [170, 50, 15],
  round: { chooser: 1, solvedBy: null, points: null, players: [], ...round },
  winners: null,
  ...extra,
});

describe("the clock", () => {
  test("counts down on the server's time", () => {
    // The server is 2 s ahead of this device.
    expect(secondsLeft(10_000, 2_000, 5_000)).toBe(3);
    expect(secondsLeft(10_000, 2_000, 7_500)).toBe(1);
    expect(secondsLeft(10_000, 2_000, 9_000)).toBe(0);
    expect(secondsLeft(null, 0)).toBe(0);
  });

  test("minutes and seconds", () => {
    expect(formatClock(125)).toBe("2:05");
    expect(formatClock(9)).toBe("0:09");
  });
});

test("who chooses next, skipping whoever left", () => {
  expect(upcomingChoosers(view({ chooser: 1 }), players)).toEqual([2, 0]);
  expect(upcomingChoosers(view({ chooser: 1 }), [players[0], players[1], { ...players[2], left: true }])).toEqual([0]);
  expect(upcomingChoosers(view({ chooser: 0 }), players)).toEqual([]);
});

describe("how the round ended", () => {
  test("in English", () => {
    const solved = view({ outcome: "solved", solvedBy: 0, players: [{ tries: 2 }, {}, {}] });
    expect(outcomeText(solved, players, 2)).toBe("Iara guessed it in 2 tries.");
    expect(outcomeText(view({ outcome: "solved", solvedBy: 0, players: [{ tries: 1 }] }), players, 0)).toBe(
      "You guessed it on the first try."
    );
    expect(outcomeText(view({ outcome: "time-up" }), players, 0)).toBe("Time ran out and nobody guessed it.");
    expect(outcomeText(view({ outcome: "no-tries" }), players, 0)).toBe("Everyone ran out of tries.");
  });

  test("in Portuguese", () => {
    setLanguage("pt-BR");
    const solved = view({ outcome: "solved", solvedBy: 0, players: [{ tries: 3 }] });
    expect(outcomeText(solved, players, 2)).toBe("Iara acertou em 3 tentativas.");
    expect(outcomeText(view({ outcome: "time-up" }), players, 0)).toBe("O tempo acabou e ninguém acertou.");
  });
});

test("scores between rounds: highest first, from the total before this round", () => {
  const v = view({ outcome: "solved", solvedBy: 0, points: [170, 50, 15] });
  const rows = roundScores(v, players);
  expect(rows.map((r) => r.name)).toEqual(["Iara", "Caetano", "Lívia"]);
  expect(rows[0]).toMatchObject({ before: 0, gained: 170, total: 170, solved: true, chose: false });
  expect(rows[1]).toMatchObject({ chose: true, gained: 50 });
});

describe("the final headline", () => {
  test("a single winner, with points", () => {
    const end = view({ phase: "over" }, { winners: [0] });
    expect(headline(end, players, 0)).toEqual({ title: "You Win", detail: "170 points.", won: true });
    setLanguage("pt-BR");
    expect(headline(end, players, 1)).toEqual({ title: "Iara Venceu", detail: "170 pontos.", won: false });
  });

  test("a shared win", () => {
    const end = view({ phase: "over" }, { winners: [0, 1], scores: [100, 100, 0] });
    expect(headline(end, players, 2).title).toBe("It’s a Tie");
    expect(headline(end, players, 0).detail).toBe("You share the top with Caetano.");
  });

  test("everyone else left", () => {
    const end = view({ phase: "over" }, { winners: [0] });
    const gone = [players[0], { ...players[1], left: true }, { ...players[2], left: true }];
    expect(headline(end, gone, 0).detail).toBe("Everyone else left the match.");
  });
});
