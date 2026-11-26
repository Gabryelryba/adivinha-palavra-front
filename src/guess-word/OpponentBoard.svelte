<script>
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // The other player's board in a duel: their rows as colours only (green,
  // yellow, grey), then empty rows up to the limit of tries. The server sends
  // their letters only once the duel is over; then they show too.
  // name / color: the opponent's, for the header. Sized like Board.svelte: the
  // tiles take the largest size that fits the space the board is given.
  let { rows = [], length, rowCount, name, color, tries = 0, maxTries } = $props();

  const lines = $derived(
    Array.from({ length: Math.max(rowCount, rows.length) }, (_, r) => ({
      letters: rows[r]?.word ? [...rows[r].word] : [],
      colors: rows[r]?.colors ?? [],
    }))
  );
</script>

<div class="opponent" style:--c="var(--player-{color})">
  <p class="who">
    <span class="dot" aria-hidden="true"></span>
    <span class="name" translate="no">{name}</span>
    <span class="tries">{t("guessWord.duel.opponentTries", { count: tries, max: maxTries })}</span>
  </p>
  <div class="slot">
    <div class="board" style:--len={length} style:--rows={lines.length} role="img" aria-label={t("guessWord.duel.opponent", { name })} translate="no">
      {#each lines as line, r (r)}
        <div class="line">
          {#each Array(length) as _, i (i)}
            <span class="tile {line.colors[i] ?? ''}" class:played={line.colors[i]} style:--i={i}>{line.letters[i] ?? ""}</span>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .opponent {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .who {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-muted);
  }

  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
  }

  .name {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tries {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--ink-faint);
  }

  /* A size container with a 0 basis (not 0%), so its height is definite and
     the tiles can be sized by it (see .board-slot in Board.svelte). */
  .slot {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    overflow: hidden;
    container-type: size;
  }

  .board {
    --gap: 0.25rem;
    --by-width: calc((100cqw - (var(--len) - 1) * var(--gap)) / var(--len));
    --by-height: calc((100cqh - 4px - (var(--rows) - 1) * var(--gap)) / var(--rows));
    --tile: max(0.5rem, min(var(--by-width), var(--by-height), 3.6rem));
    margin: auto;
    padding: 2px;
    display: grid;
    gap: var(--gap);
    border-radius: calc(var(--tile) * 0.2);
  }

  .line {
    display: grid;
    grid-template-columns: repeat(var(--len), var(--tile));
    gap: var(--gap);
  }

  .tile {
    display: grid;
    place-items: center;
    height: var(--tile);
    border-radius: calc(var(--tile) * 0.16);
    border: 1px solid color-mix(in srgb, var(--c) 35%, var(--line));
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: calc(var(--tile) * 0.5);
    color: var(--ink);
  }

  .tile.played {
    border-color: transparent;
    animation: flip 0.5s var(--ease-spring) backwards;
    animation-delay: calc(var(--i) * 90ms);
  }

  @keyframes flip {
    0% {
      transform: rotateX(0);
      background: transparent;
    }
    50% {
      transform: rotateX(90deg);
      background: transparent;
    }
    51% {
      transform: rotateX(90deg);
    }
  }

  .correct {
    background: var(--tile-correct);
  }

  .present {
    background: var(--tile-present);
  }

  .absent {
    background: var(--tile-absent);
  }

  @media (prefers-reduced-motion: reduce) {
    .tile.played {
      animation: none;
    }
  }
</style>
