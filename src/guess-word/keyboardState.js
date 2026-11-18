// The on-screen keyboard: each letter shows the best colour it has had in this
// player's rows (green over yellow over grey); typing fills the guess's cells.

export const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "BACKSPACE"],
  ["Z", "X", "C", "V", "B", "N", "M", "ENTER"],
];

// Where each key sits on a grid of 32 columns: a letter takes 3; each row starts
// one column further in than the one above, as on a real keyboard; Delete closes
// the second row and a wide Enter the third, both at the right edge.
// -> [{ key, row, column, span }] (1-based, for grid-row / grid-column)
export const GRID_COLUMNS = 32;
const WIDE = { BACKSPACE: { column: 30, span: 3 }, ENTER: { column: 25, span: 8 } };

export function keyGrid() {
  return KEY_ROWS.flatMap((keys, r) => {
    let column = r + 1;
    return keys.map((key) => {
      if (WIDE[key]) return { key, row: r + 1, ...WIDE[key] };
      const cell = { key, row: r + 1, column, span: 3 };
      column += 3;
      return cell;
    });
  });
}

// How long the newest row takes to turn over on the board (Board.svelte: each
// tile flips for 500 ms, 90 ms after the one before). The keys change colour
// after that, so they do not give the answer away before the tiles do.
export const revealDelay = (length) => Math.max(0, length - 1) * 90 + 500;

const RANK = { absent: 1, present: 2, correct: 3 };

// rows: [{ word, colors }] -> { [letter]: "correct" | "present" | "absent" }
export function letterStates(rows) {
  const states = {};
  for (const { word, colors } of rows) {
    if (!word) continue;
    [...word].forEach((letter, i) => {
      const color = colors[i];
      if ((RANK[color] ?? 0) > (RANK[states[letter]] ?? 0)) states[letter] = color;
    });
  }
  return states;
}

// The guess being typed: one cell per letter (null when empty) and a cursor, so
// letters can go in any cell, in any order, with gaps.
// guess = { cells: [letter | null], cursor }
export const emptyGuess = (length) => ({ cells: Array(length).fill(null), cursor: 0 });

// The same guess for a word of this length, or a fresh one if the length changed.
export const fitGuess = (guess, length) => (guess?.cells.length === length ? guess : emptyGuess(length));

// The guessed word, or null while a cell is empty.
export const guessWord = ({ cells }) => (cells.length > 0 && cells.every(Boolean) ? cells.join("") : null);

const clamp = (n, cells) => Math.max(0, Math.min(cells.length - 1, n));

// The first empty cell after `from`, wrapping round; -1 if none is empty.
function nextEmpty(cells, from) {
  for (let step = 1; step <= cells.length; step++) {
    const i = (from + step) % cells.length;
    if (!cells[i]) return i;
  }
  return -1;
}

// Put the cursor on a cell (tapped or clicked).
export const selectCell = (guess, index) => ({ ...guess, cursor: clamp(index, guess.cells) });

// One key on the guess. key: a letter, "ENTER", "BACKSPACE", "SPACE", "LEFT" or
// "RIGHT" (physical keys already mapped by keyFromEvent). -> { guess, submit }
//  - a letter fills the cursor's cell and moves to the next empty one (or stays);
//  - SPACE moves on one cell without writing;
//  - BACKSPACE clears the cursor's cell, or if it was empty, the one before;
//  - LEFT / RIGHT move the cursor;
//  - ENTER asks to send (the caller checks the guess is full).
export function editGuess(guess, key) {
  const { cells, cursor } = guess;
  if (key === "ENTER") return { guess, submit: true };
  if (key === "LEFT") return { guess: { cells, cursor: clamp(cursor - 1, cells) }, submit: false };
  if (key === "RIGHT" || key === "SPACE") return { guess: { cells, cursor: clamp(cursor + 1, cells) }, submit: false };
  if (key === "BACKSPACE") {
    const at = cells[cursor] || cursor === 0 ? cursor : cursor - 1;
    const next = [...cells];
    next[at] = null;
    return { guess: { cells: next, cursor: at }, submit: false };
  }
  if (/^[A-Z]$/.test(key)) {
    const next = [...cells];
    next[cursor] = key;
    const empty = nextEmpty(next, cursor);
    return { guess: { cells: next, cursor: empty === -1 ? cursor : empty }, submit: false };
  }
  return { guess, submit: false };
}

// A physical key, as the on-screen keyboard names it, or null. Accented letters
// count as the plain one (é is E, ç is C), as the server compares words.
export function keyFromEvent(evt) {
  if (evt.ctrlKey || evt.metaKey || evt.altKey) return null;
  if (evt.key === "Enter") return "ENTER";
  if (evt.key === "Backspace") return "BACKSPACE";
  if (evt.key === " ") return "SPACE";
  if (evt.key === "ArrowLeft") return "LEFT";
  if (evt.key === "ArrowRight") return "RIGHT";
  if (evt.key.length !== 1) return null;
  const letter = evt.key.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : null;
}
