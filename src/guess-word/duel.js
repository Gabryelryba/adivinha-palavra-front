// Reading a Duel `state` for the screen (arcade-hub-back games/guess-word/duel.js):
// two players race to guess one word the server drew. The state has `boards`
// (one per seat: { index, tries, solved, left, rows }) instead of a round.

import { t } from "arcade-hub-ui/i18n/index.svelte.js";
import { nameOf } from "./round.js";

export const isDuel = (view) => view?.mode === "duel";

// The other seat.
export const opponentOf = (view, me) => view.boards.find((b) => b.index !== me)?.index ?? null;

// The line above the boards while the duel is on.
export function duelStatus(view, players, me) {
  const mine = view.boards[me];
  const rival = nameOf(players, opponentOf(view, me), me);
  const left = Math.max(0, view.maxTries - (mine?.tries ?? 0));
  if (left === 0) return t("guessWord.duel.noTries", { name: rival });
  return `${t("guessWord.duel.yourTurn", { name: rival, length: view.length })} ${t("guessWord.round.triesLeft", { count: left })}`;
}

// How the duel ended, for the result sheet. -> { title, detail, won }
export function duelHeadline(view, players, me) {
  const winners = view.winners ?? [];
  const won = winners.length === 1 && winners[0] === me;
  const rival = nameOf(players, opponentOf(view, me), me);
  const word = t("guessWord.duel.wordWas", { word: view.word ?? "" });
  const winnerTitle = won ? t("result.youWin") : t("result.theyWin", { name: nameOf(players, winners[0], me) });
  if (view.outcome === "solved") {
    const tries = view.boards[view.solvedBy]?.tries ?? 0;
    const detail = won
      ? t("guessWord.duel.youSolved", { count: tries })
      : t("guessWord.duel.theySolved", { name: rival, count: tries });
    return { title: winnerTitle, detail: `${detail} ${word}`, won };
  }
  if (view.outcome === "forfeit") {
    const detail = won ? t("guessWord.duel.forfeitWin", { name: rival }) : t("guessWord.duel.forfeitLoss");
    return { title: winnerTitle, detail: `${detail} ${word}`, won };
  }
  const why = view.outcome === "no-tries" ? t("guessWord.duel.drawNoTries") : t("guessWord.duel.drawTimeUp");
  return { title: t("guessWord.duel.draw"), detail: `${why} ${word}`, won: false };
}

// The result sheet's rows: the winner first, each with the tries used.
// -> [{ index, name, color, left?, again?, score, winner }]
export function duelRows(view, players) {
  const winners = view.winners ?? [];
  return view.boards
    .map((board) => ({
      ...players[board.index],
      index: board.index,
      score: t("guessWord.duel.triesUsed", { count: board.tries, max: view.maxTries }),
      winner: winners.length === 1 && winners[0] === board.index,
    }))
    .sort((a, b) => Number(b.winner) - Number(a.winner) || a.index - b.index);
}
