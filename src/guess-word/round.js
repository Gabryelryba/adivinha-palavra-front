// Reading a Guess Word `state` for the screen: the clock, who chooses next, how
// a round ended, and the scores between rounds.

import { t } from "arcade-hub-ui/i18n/index.svelte.js";

// The server's deadlines are on its clock: `serverNow` comes with each state,
// so offset = serverNow - the local time it arrived at.
export function secondsLeft(endsAt, offset, now = Date.now()) {
  if (endsAt == null) return 0;
  return Math.max(0, Math.ceil((endsAt - (now + offset)) / 1000));
}

export const formatClock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// The choosers still to come after this round, in order, skipping who left.
export function upcomingChoosers(view, players) {
  const at = view.order.indexOf(view.round.chooser);
  return view.order.slice(at + 1).filter((seat) => !players[seat]?.left);
}

export const nameOf = (players, seat, me) => (seat === me ? t("common.you") : (players[seat]?.name ?? t("common.someone")));

// The line under the revealed word.
export function outcomeText(view, players, me) {
  const round = view.round;
  if (round.outcome === "solved") {
    const tries = round.players[round.solvedBy]?.tries ?? 0;
    return t("guessWord.reveal.solved", { name: nameOf(players, round.solvedBy, me), count: tries });
  }
  if (round.outcome === "no-tries") return t("guessWord.reveal.noTries");
  return t("guessWord.reveal.timeUp");
}

// Everyone still in the match (and anyone who scored this round), highest total
// first, with where their total stood before this round.
// -> [{ index, name, color, left, before, gained, total, solved, chose }]
export function roundScores(view, players) {
  const points = view.round.points ?? [];
  return view.order
    .filter((seat) => !players[seat]?.left || (points[seat] ?? 0) > 0)
    .map((seat) => {
      const total = view.scores[seat] ?? 0;
      const gained = points[seat] ?? 0;
      return {
        ...players[seat],
        index: seat,
        before: total - gained,
        gained,
        total,
        solved: view.round.solvedBy === seat,
        chose: view.round.chooser === seat,
      };
    })
    .sort((a, b) => b.total - a.total);
}
