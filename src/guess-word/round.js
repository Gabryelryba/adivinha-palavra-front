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

// The room's limit of tries per player: a number, or null for no limit. An older
// server sends none, and always played with 6.
export const triesLimit = (view) => (view?.maxTries === undefined ? 6 : view.maxTries);

// -> tries left, or null when there is no limit.
export const triesLeft = (limit, tries) => (limit === null ? null : Math.max(0, limit - tries));

// How many rows a board shows: the limit, or with no limit the rows played (plus
// the one being typed), never fewer than 6.
export const rowsShown = (limit, played, typing = false) => limit ?? Math.max(6, played + (typing ? 1 : 0));

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
// -> [{ index, name, color, left, before, gained, total, solved, chose, breakdown }]
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
        breakdown: view.round.breakdown?.[seat] ?? [],
      };
    })
    .sort((a, b) => b.total - a.total);
}

// One reason for a player's points, in the current language ("3 tries left
// +45"); "" for a kind this site does not know yet.
export function breakdownText({ kind, count, points }) {
  const key = `guessWord.breakdown.${kind}`;
  const text = t(key, { count, points });
  return text === key ? "" : text;
}

// A player's reasons on one line.
export const breakdownLine = (items) => items.map(breakdownText).filter(Boolean).join(" · ");

// The rules for the legend, from the server's `scoring`; [] when it sent none.
export function scoringLines(scoring) {
  if (!scoring) return [];
  return ["solver", "others", "chooser"].map((key) => t(`guessWord.scoring.${key}`, scoring));
}

// The button under the scores. The next round starts once everyone still in the
// match has tapped it (or when the clock runs out), so after tapping it waits.
// -> { available, label, waiting, readyCount, total }; available is false when
// the server does not support it (no round.ready).
export function nextButton(view, players, me) {
  const ready = view.round.ready;
  const here = view.order.filter((seat) => !players[seat]?.left);
  const upcoming = upcomingChoosers(view, players);
  const label =
    upcoming.length === 0
      ? t("guessWord.reveal.seeResults")
      : upcoming[0] === me
        ? t("guessWord.reveal.chooseWord")
        : t("guessWord.reveal.nextRound");
  const readyCount = Array.isArray(ready) ? ready.filter((seat) => here.includes(seat)).length : 0;
  return {
    available: Array.isArray(ready),
    label,
    waiting: Array.isArray(ready) && ready.includes(me),
    readyCount,
    total: here.length,
  };
}
