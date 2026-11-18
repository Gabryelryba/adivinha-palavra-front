import { describe, test, expect } from "vitest";
import { letterStates, keyFromEvent, emptyGuess, fitGuess, guessWord, selectCell, editGuess, KEY_ROWS, keyGrid, GRID_COLUMNS, revealDelay } from "./keyboardState.js";

const C = "correct";
const P = "present";
const A = "absent";

describe("letterStates", () => {
  test("each letter keeps its best colour: green over yellow over grey", () => {
    const rows = [
      { word: "PATO", colors: [A, C, C, C] },
      { word: "TOGA", colors: [P, P, P, P] },
    ];
    expect(letterStates(rows)).toEqual({ P: A, A: C, T: C, O: C, G: P });
  });

  test("a repeated letter that is grey once and yellow once shows yellow", () => {
    // SALA against ASSA: the first A is yellow, the second green; L grey.
    expect(letterStates([{ word: "SALA", colors: [P, P, A, C] }])).toEqual({ S: P, A: C, L: A });
    expect(letterStates([{ word: "ARARA", colors: [P, A, P, A, A] }])).toEqual({ A: P, R: A });
  });

  test("a later grey never hides an earlier green", () => {
    const rows = [
      { word: "GATO", colors: [C, A, A, A] },
      { word: "AGUA", colors: [A, A, A, A] },
    ];
    expect(letterStates(rows).G).toBe(C);
  });

  test("rows without letters (someone else's) add nothing", () => {
    expect(letterStates([{ colors: [C, C, C, C] }])).toEqual({});
  });
});

describe("the guess being typed", () => {
  const type = (guess, ...keys) => keys.reduce((g, key) => editGuess(g, key).guess, guess);
  const show = ({ cells, cursor }) => cells.map((c, i) => (i === cursor ? `[${c ?? "_"}]` : (c ?? "_"))).join("");

  test("letters in order fill left to right", () => {
    expect(show(type(emptyGuess(4), "G", "A", "T", "O"))).toBe("GATO");
    expect(guessWord(type(emptyGuess(4), "G", "A", "T", "O"))).toBe("GATO");
  });

  test("out of order: pick a cell, write, and the cursor jumps to the next empty one", () => {
    let g = selectCell(emptyGuess(5), 3);
    g = type(g, "R");
    expect(show(g)).toBe("___R[_]");
    g = type(g, "O");
    expect(show(g), "wraps round to the first empty cell").toBe("[_]__RO");
    g = type(g, "C", "A", "S");
    expect(show(g), "the last empty cell filled: no cursor").toBe("CASRO");
    expect(guessWord(g)).toBe("CASRO");
  });

  test("a full row has no cursor, and more letters change nothing", () => {
    const full = type(emptyGuess(3), "A", "B", "C");
    expect(full.cursor).toBe(null);
    expect(type(full, "X")).toEqual(full);
    expect(guessWord(full)).toBe("ABC");
  });

  test("on a full row, a tapped cell takes a letter and the cursor goes again", () => {
    const g = selectCell(type(emptyGuess(3), "A", "B", "C"), 1);
    expect(show(g)).toBe("A[B]C");
    expect(show(type(g, "X"))).toBe("AXC");
    expect(type(g, "X").cursor).toBe(null);
  });

  test("on a full row, delete clears the last cell and puts the cursor there", () => {
    const full = type(emptyGuess(3), "A", "B", "C");
    expect(show(type(full, "BACKSPACE"))).toBe("AB[_]");
  });

  test("on a full row, arrows bring the cursor back: left at the end, right and space at the start", () => {
    const full = type(emptyGuess(3), "A", "B", "C");
    expect(show(type(full, "LEFT"))).toBe("AB[C]");
    expect(show(type(full, "RIGHT"))).toBe("[A]BC");
    expect(show(type(full, "SPACE"))).toBe("[A]BC");
  });

  test("a guess with no cursor still fits and still sends", () => {
    const full = type(emptyGuess(4), "G", "A", "T", "O");
    expect(fitGuess(full, 4)).toBe(full);
    expect(editGuess(full, "ENTER").submit).toBe(true);
  });

  test("space skips a cell without writing, and stops at the end", () => {
    expect(show(type(emptyGuess(4), "SPACE", "SPACE", "T"))).toBe("__T[_]");
    expect(show(type(emptyGuess(3), "SPACE", "SPACE", "SPACE", "SPACE"))).toBe("__[_]");
  });

  test("delete clears the cursor's cell; on an empty cell it clears the one before", () => {
    const full = type(emptyGuess(4), "G", "A", "T", "O");
    expect(show(type(full, "BACKSPACE"))).toBe("GAT[_]");
    expect(show(type(full, "BACKSPACE", "BACKSPACE"))).toBe("GA[_]_");
    expect(show(type(emptyGuess(3), "BACKSPACE"))).toBe("[_]__");
    expect(show(type(selectCell(full, 1), "BACKSPACE"))).toBe("G[_]TO");
  });

  test("arrows move the cursor and stop at the edges", () => {
    const g = emptyGuess(3);
    expect(show(type(g, "LEFT"))).toBe("[_]__");
    expect(show(type(g, "RIGHT", "RIGHT", "RIGHT"))).toBe("__[_]");
    expect(show(type(g, "RIGHT", "LEFT"))).toBe("[_]__");
  });

  test("enter asks to send; the word is null while a cell is empty", () => {
    const partial = type(emptyGuess(4), "G", "SPACE", "T", "O");
    expect(editGuess(partial, "ENTER").submit).toBe(true);
    expect(guessWord(partial)).toBe(null);
  });

  test("a guess for another length starts over", () => {
    const g = type(emptyGuess(4), "G");
    expect(fitGuess(g, 4)).toBe(g);
    expect(fitGuess(g, 5).cells).toEqual([null, null, null, null, null]);
    expect(fitGuess(null, 3).cells.length).toBe(3);
  });

  test("anything else changes nothing", () => {
    const g = emptyGuess(3);
    expect(editGuess(g, "1")).toEqual({ guess: g, submit: false });
  });
});

describe("keyFromEvent", () => {
  const key = (k, extra = {}) => keyFromEvent({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...extra });

  test("letters, accents folded, Enter and Backspace", () => {
    expect(key("a")).toBe("A");
    expect(key("é")).toBe("E");
    expect(key("ç")).toBe("C");
    expect(key("Enter")).toBe("ENTER");
    expect(key("Backspace")).toBe("BACKSPACE");
    expect(key(" ")).toBe("SPACE");
    expect(key("ArrowLeft")).toBe("LEFT");
    expect(key("ArrowRight")).toBe("RIGHT");
  });

  test("anything else, or a shortcut, is ignored", () => {
    expect(key("1")).toBe(null);
    expect(key("Shift")).toBe(null);
    expect(key("r", { ctrlKey: true })).toBe(null);
  });
});

describe("the keyboard's layout", () => {
  const grid = keyGrid();
  const at = (key) => grid.find((k) => k.key === key);
  const end = (k) => k.column + k.span - 1;

  test("Delete closes the second row and Enter the third", () => {
    expect(KEY_ROWS[1].at(-1)).toBe("BACKSPACE");
    expect(KEY_ROWS[2].at(-1)).toBe("ENTER");
    expect(KEY_ROWS.flat().filter((k) => /^[A-Z]$/.test(k))).toHaveLength(26);
  });

  test("each row starts one column further in: Q at 1, A at 2, Z at 3", () => {
    expect(at("Q").column).toBe(1);
    expect(at("A").column).toBe(2);
    expect(at("Z").column).toBe(3);
    expect(at("W").column).toBe(4);
    expect(grid.filter((k) => /^[A-Z]$/.test(k.key)).every((k) => k.span === 3)).toBe(true);
  });

  test("Delete and a wide Enter end at the grid's right edge; letters never overlap them", () => {
    expect(end(at("BACKSPACE"))).toBe(GRID_COLUMNS);
    expect(end(at("ENTER"))).toBe(GRID_COLUMNS);
    expect(at("ENTER").span).toBe(8);
    expect(end(at("L"))).toBeLessThan(at("BACKSPACE").column);
    expect(end(at("M"))).toBeLessThan(at("ENTER").column);
    expect(end(at("P"))).toBeLessThanOrEqual(GRID_COLUMNS);
  });

  test("the keys change colour once the newest row has turned over", () => {
    expect(revealDelay(5)).toBe(4 * 90 + 500);
    expect(revealDelay(1)).toBe(500);
  });
});
