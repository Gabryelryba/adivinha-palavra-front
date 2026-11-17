<script>
  import { onDestroy } from "svelte";
  import Check from "phosphor-svelte/lib/Check";
  import PencilSimple from "phosphor-svelte/lib/PencilSimple";
  import Avatar from "arcade-hub-ui/Avatar.svelte";
  import { outcomeText, roundScores, upcomingChoosers, nameOf, secondsLeft, breakdownLine, scoringLines, nextButton } from "./round.js";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // Between rounds: the word turns over letter by letter, each player's bar grows
  // to their new total while the number counts up from the old one, with this
  // round's points beside it and where they came from; the scoring rules; then
  // who picks next, and when.
  // onNext: this player has seen the scores (the round moves on once everyone has).
  let { view, players, me, offset, onNext = () => {} } = $props();

  const rows = $derived(roundScores(view, players));
  const top = $derived(Math.max(1, ...rows.map((r) => r.total)));
  const next = $derived(upcomingChoosers(view, players)[0]);
  const button = $derived(nextButton(view, players, me));
  // Tapped here, before the server's next state says so.
  let tapped = $state(false);
  const waiting = $derived(tapped || button.waiting);

  function moveOn() {
    if (waiting) return;
    tapped = true;
    onNext();
  }
  const word = $derived(view.round.word ?? "");

  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // The numbers count from the old totals to the new ones.
  let progress = $state(reduced ? 1 : 0);
  let grown = $state(reduced);
  const COUNT_MS = 1100;
  const START_MS = 700;
  let frame;
  const start = setTimeout(() => {
    grown = true;
    const began = performance.now();
    const step = (time) => {
      progress = Math.min(1, (time - began) / COUNT_MS);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }, START_MS);
  // A hidden tab does not run animation frames: land on the totals anyway.
  const land = setTimeout(() => (progress = 1), START_MS + COUNT_MS + 200);

  let now = $state(Date.now());
  const tick = setInterval(() => (now = Date.now()), 250);
  const left = $derived(secondsLeft(view.round.endsAt, offset, now));

  onDestroy(() => {
    clearTimeout(start);
    clearTimeout(land);
    clearInterval(tick);
    cancelAnimationFrame(frame);
  });

  const shown = (row) => Math.round(row.before + (row.total - row.before) * progress);
</script>

<div class="scrim" aria-hidden="true"></div>
<section class="sheet bezel" role="dialog" aria-modal="false" aria-labelledby="guess-word-round-title">
  <div class="sheet-core bezel-core">
    <p class="kicker">{t("guessWord.reveal.kicker", { n: view.round.number })}</p>
    <h2 id="guess-word-round-title" class="sr-only">{t("guessWord.reveal.word")} {word}</h2>
    <p class="label" aria-hidden="true">{t("guessWord.reveal.word")}</p>
    <p class="word" style:--len={word.length} aria-hidden="true" translate="no">
      {#each [...word] as letter, i (i)}
        <span class="tile" style:--i={i}>{letter}</span>
      {/each}
    </p>
    <p class="outcome">{outcomeText(view, players, me)}</p>

    <ol class="scores">
      {#each rows as row, i (row.index)}
        <li class="score-row" class:me={row.index === me} style:--c="var(--player-{row.color})" style:--n={i}>
          <Avatar name={row.name} color={row.color} size="1.8rem" />
          <span class="body">
            <span class="line">
              <span class="name" translate="no">{row.index === me ? t("common.you") : row.name}</span>
              {#if row.solved}
                <span class="mark" title={t("guessWord.reveal.guessed")}><Check size={12} weight="bold" aria-label={t("guessWord.reveal.guessed")} /></span>
              {/if}
              {#if row.chose}
                <span class="mark chose" title={t("guessWord.reveal.picked")}><PencilSimple size={12} weight="bold" aria-label={t("guessWord.reveal.picked")} /></span>
              {/if}
              {#if row.gained > 0}<span class="gain">+{row.gained}</span>{/if}
              <span class="total">{shown(row)}</span>
            </span>
            {#if breakdownLine(row.breakdown)}
              <span class="why">{breakdownLine(row.breakdown)}</span>
            {/if}
            <span class="track" aria-hidden="true">
              <span class="fill" style:transform="scaleX({(grown ? row.total : row.before) / top})"></span>
            </span>
          </span>
        </li>
      {/each}
    </ol>

    {#if view.scoring}
      <details class="rules">
        <summary>{t("guessWord.scoring.title")}</summary>
        <ul>
          {#each scoringLines(view.scoring) as line, i (i)}
            <li>{line}</li>
          {/each}
        </ul>
      </details>
    {/if}

    {#if button.available}
      <div class="move-on" aria-live="polite">
        <button class="btn btn-primary" onclick={moveOn} disabled={waiting}>
          {waiting ? t("guessWord.reveal.waiting", { n: Math.max(button.readyCount, 1), m: button.total }) : button.label}
        </button>
      </div>
    {/if}

    <p class="next" aria-live="polite">
      {#if next === undefined}
        {t("guessWord.reveal.finalIn", { seconds: left })}
      {:else if next === me}
        {t("guessWord.reveal.youNext", { seconds: left })}
      {:else}
        {t("guessWord.reveal.next", { name: nameOf(players, next, me), seconds: left })}
      {/if}
    </p>
  </div>
</section>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: linear-gradient(to bottom, color-mix(in srgb, var(--scrim) 45%, transparent), var(--scrim));
    pointer-events: none;
    animation: fade 0.4s var(--ease-spring);
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  .sheet {
    position: fixed;
    z-index: 41;
    left: 50%;
    bottom: max(0.75rem, env(safe-area-inset-bottom));
    width: min(30rem, calc(100% - 1.5rem));
    max-height: calc(100dvh - 1.5rem);
    overflow: auto;
    translate: -50% 0;
    background: var(--scrim);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    animation: rise 0.6s var(--ease-spring);
  }

  @keyframes rise {
    from {
      transform: translateY(40px);
      opacity: 0;
    }
  }

  .sheet-core {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
    padding: 1.1rem 1.2rem 1rem;
  }

  .kicker,
  .label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .word {
    --size: min(2.6rem, calc((100vw - 5rem) / var(--len)));
    display: flex;
    gap: 0.3rem;
    margin: 0.2rem 0 0.1rem;
  }

  .tile {
    display: grid;
    place-items: center;
    width: var(--size);
    height: var(--size);
    border-radius: 0.45rem;
    background: var(--tile-correct);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: calc(var(--size) * 0.5);
    animation: turn 0.5s var(--ease-spring) backwards;
    animation-delay: calc(150ms + var(--i) * 110ms);
  }

  @keyframes turn {
    from {
      transform: rotateX(90deg);
      opacity: 0;
    }
  }

  .outcome {
    color: var(--ink-muted);
    font-size: 0.95rem;
  }

  .scores {
    list-style: none;
    margin: 0.6rem 0 0.2rem;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }

  .score-row {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.35rem 0.5rem;
    border-radius: 0.9rem;
    background: var(--sheen);
    animation: row-in 0.5s var(--ease-spring) backwards;
    animation-delay: calc(300ms + var(--n) * 70ms);
  }

  @keyframes row-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  /* The reasons for a player's points: small, and free to wrap on a phone. */
  .why {
    font-size: 0.78rem;
    line-height: 1.35;
    color: var(--ink-muted);
    text-wrap: pretty;
  }

  .move-on {
    display: grid;
    margin-top: 0.3rem;
  }

  .move-on .btn {
    width: 100%;
  }

  .rules {
    margin: 0.1rem 0 0.2rem;
    font-size: 0.82rem;
    color: var(--ink-muted);
  }

  .rules summary {
    cursor: pointer;
    width: fit-content;
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    font-weight: 600;
    color: var(--accent-text);
    border-radius: var(--radius-sm);
  }

  .rules summary:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .rules ul {
    margin: 0 0 0.4rem;
    padding-left: 1.1rem;
    display: grid;
    gap: 0.3rem;
  }

  .score-row.me {
    background: var(--sheen-strong);
  }

  .body {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 0.3rem;
  }

  .line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  .name {
    min-width: 0;
    flex: 0 1 auto;
    font-weight: 600;
    font-size: 0.92rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mark {
    flex: none;
    display: grid;
    place-items: center;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    background: var(--tile-correct);
    color: var(--ink);
  }

  .mark.chose {
    background: var(--surface-hover);
  }

  .gain {
    flex: none;
    margin-left: auto;
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    background: var(--accent-text-soft);
    color: var(--accent-text);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.78rem;
    animation: pop 0.45s var(--ease-spring) backwards;
    animation-delay: calc(900ms + var(--n) * 70ms);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
  }

  .total {
    flex: none;
    min-width: 2.6rem;
    margin-left: auto;
    text-align: right;
    font-family: var(--font-mono);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .gain + .total {
    margin-left: 0;
  }

  .track {
    height: 6px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }

  .fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--c);
    transform-origin: left;
    transition: transform 1.1s var(--ease-spring);
  }

  .next {
    margin-top: 0.3rem;
    text-align: center;
    color: var(--ink-muted);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (min-width: 900px) {
    .sheet {
      bottom: auto;
      top: 50%;
      translate: -50% -50%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scrim,
    .sheet,
    .tile,
    .score-row,
    .gain {
      animation: none;
    }

    .fill {
      transition: none;
    }
  }
</style>
