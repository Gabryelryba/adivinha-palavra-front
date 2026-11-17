import { describe, test, expect, afterEach } from "vitest";
import { secondsLeft, formatClock, upcomingChoosers, outcomeText, roundScores, breakdownText, breakdownLine, scoringLines } from "./round.js";
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

describe("where the points came from", () => {
  const solver = [
    { kind: "solved", points: 100 },
    { kind: "triesLeft", count: 3, points: 45 },
    { kind: "speed", count: 30, points: 25 },
  ];

  test("each reason in words, singular and plural", () => {
    expect(breakdownLine(solver)).toBe("Guessed it +100 · 3 tries left +45 · Speed +25");
    expect(breakdownText({ kind: "triesLeft", count: 1, points: 15 })).toBe("1 try left +15");
    expect(breakdownText({ kind: "green", count: 2, points: 10 })).toBe("2 greens +10");
    expect(breakdownText({ kind: "yellow", count: 1, points: 2 })).toBe("1 yellow +2");
    expect(breakdownText({ kind: "chooserCap", count: 150, points: -30 })).toBe("Capped at 150");
    expect(breakdownText({ kind: "nobodyGuessed", points: 0 })).toBe("Nobody guessed it · 0");
  });

  test("in Portuguese", () => {
    setLanguage("pt-BR");
    expect(breakdownLine(solver)).toBe("Acertou +100 · 3 tentativas sobrando +45 · Rapidez +25");
    expect(breakdownText({ kind: "chooserTries", count: 3, points: 60 })).toBe("Acertaram na 3ª tentativa +60");
    expect(breakdownText({ kind: "chooserHeld", count: 60, points: 20 })).toBe("Resistiu 60 s +20");
  });

  test("a reason this site does not know is left out", () => {
    expect(breakdownLine([{ kind: "bonus", points: 5 }, { kind: "speed", points: 3 }])).toBe("Speed +3");
  });

  test("each row carries its reasons, adding up to what it gained", () => {
    const rows = roundScores(
      view({ phase: "reveal", solvedBy: 0, points: [170, 50, 15], breakdown: [solver, [{ kind: "chooserTries", count: 3, points: 50 }], [{ kind: "green", count: 3, points: 15 }]] }),
      players
    );
    for (const row of rows) expect(row.breakdown.reduce((s, i) => s + i.points, 0)).toBe(row.gained);
  });

  test("an older server sends no reasons: empty lists, no legend", () => {
    const rows = roundScores(view({ phase: "reveal", points: [10, 0, 5] }), players);
    expect(rows.every((r) => r.breakdown.length === 0)).toBe(true);
    expect(scoringLines(undefined)).toEqual([]);
  });

  test("the legend reads its numbers from the server", () => {
    const scoring = { solved: 100, perTryLeft: 15, speedMax: 50, green: 5, yellow: 2, chooserPerTry: 20, chooserPerSeconds: 3, chooserMax: 150 };
    const [solverLine, othersLine, chooserLine] = scoringLines(scoring);
    expect(solverLine).toBe("Whoever guesses it: 100, plus 15 per try left, plus up to 50 for speed.");
    expect(othersLine).toContain("5 per green and 2 per yellow");
    expect(chooserLine).toContain("up to 150");
    expect(scoringLines({ ...scoring, solved: 120 })[0]).toContain("120");
  });
});
