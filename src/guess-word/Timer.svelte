<script>
  import { onDestroy } from "svelte";
  import Timer from "phosphor-svelte/lib/Timer";
  import { secondsLeft, formatClock } from "./round.js";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // The time left in this phase, on the server's clock. offset: serverNow minus
  // the local time the state arrived. total: the phase's length in seconds, for the bar.
  let { endsAt, offset, total } = $props();

  let now = $state(Date.now());
  const tick = setInterval(() => (now = Date.now()), 250);
  onDestroy(() => clearInterval(tick));

  // Never more than the phase's length, whatever the rounding and the network delay.
  const left = $derived(Math.min(total, secondsLeft(endsAt, offset, now)));
  const share = $derived(total > 0 ? Math.min(1, left / total) : 0);
</script>

<div class="timer" class:low={left <= 10} role="timer" aria-label={t("guessWord.round.timeLeft", { seconds: left })}>
  <Timer size={16} weight="light" aria-hidden="true" />
  <span class="time">{formatClock(left)}</span>
  <span class="track" aria-hidden="true"><span class="fill" style:transform="scaleX({share})"></span></span>
</div>

<style>
  .timer {
    display: inline-grid;
    grid-template-columns: auto auto;
    align-items: center;
    column-gap: 0.35rem;
    row-gap: 0.25rem;
    color: var(--ink-muted);
  }

  .time {
    font-family: var(--font-mono);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .track {
    grid-column: 1 / -1;
    height: 3px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }

  .fill {
    display: block;
    height: 100%;
    background: var(--accent);
    transform-origin: left;
    transition: transform 0.25s linear;
  }

  .low .time {
    color: var(--danger);
  }

  .low .fill {
    background: var(--danger);
  }
</style>
