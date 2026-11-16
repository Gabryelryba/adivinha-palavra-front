import { describe, test, expect } from "vitest";
import { letterStates, keyFromEvent, emptyGuess, fitGuess, guessWord, selectCell, editGuess } from "./keyboardState.js";

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
    expect(show(type(emptyGuess(4), "G", "A", "T", "O"))).toBe("GAT[O]");
    expect(guessWord(type(emptyGuess(4), "G", "A", "T", "O"))).toBe("GATO");
  });

  test("out of order: pick a cell, write, and the cursor jumps to the next empty one", () => {
    let g = selectCell(emptyGuess(5), 3);
    g = type(g, "R");
    expect(show(g)).toBe("___R[_]");
    g = type(g, "O");
    expect(show(g), "wraps round to the first empty cell").toBe("[_]__RO");
    g = type(g, "C", "A", "S");
    expect(show(g)).toBe("CA[S]RO");
    expect(guessWord(g)).toBe("CASRO");
  });

  test("with every cell full the cursor stays where it wrote", () => {
    const g = type(selectCell(type(emptyGuess(3), "A", "B", "C"), 1), "X");
    expect(show(g)).toBe("A[X]C");
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
