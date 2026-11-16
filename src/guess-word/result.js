// End of a Guess Word match: the shared ranking and vote (src/lib/result.js),
// with points under a single winner.

import { t } from "arcade-hub-ui/i18n/index.svelte.js";
import { ranking, rematchVote, headline as sharedHeadline } from "arcade-hub-ui/result.js";

export { ranking, rematchVote };

// -> { title, detail, won }
export function headline(view, players, me) {
  const here = players.filter((p) => !p.left).length;
  return sharedHeadline({
    winners: view.winners ?? [],
    scores: view.scores,
    players,
    me,
    forfeit: here < 2 && players.length > 1,
    soloDetail: (score) => t("guessWord.result.pointsOf", { score }),
  });
}
