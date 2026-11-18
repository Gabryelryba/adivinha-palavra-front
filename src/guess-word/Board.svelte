<script>
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // This player's six rows: the guesses so far (letters and colours), the one
  // being typed, then empty rows. The tiles fill the space the board is given.
  // guess: the row being typed ({ cells, cursor }, see keyboardState.js; cursor
  // is null once the row is full); its cells are buttons, so a tap puts the
  // cursor there (onSelect).
  // shake: bump it to shake the typing row (a refused or short word).
  let { rows = [], length, guess = null, maxTries = 6, active = false, shake = 0, onSelect = () => {} } = $props();

  const lines = $derived(
    Array.from({ length: maxTries }, (_, r) => {
      if (r < rows.length) return { kind: "done", letters: [...rows[r].word], colors: rows[r].colors };
      if (r === rows.length && active) return { kind: "typing", letters: guess?.cells ?? [], colors: [] };
      return { kind: "empty", letters: [], colors: [] };
    })
  );

  const cellLabel = (i, letter) =>
    letter
      ? t("guessWord.round.cellLetter", { n: i + 1, total: length, letter })
      : t("guessWord.round.cellEmpty", { n: i + 1, total: length });
</script>

<div class="board-slot">
  <div class="board" style:--len={length} role="img" aria-label={t("guessWord.round.yourBoard")} translate="no">
    {#each lines as line, r (r)}
      {#key line.kind === "typing" ? `typing-${shake}` : r}
        <div class="line {line.kind}" class:shake={line.kind === "typing" && shake > 0}>
          {#each Array(length) as _, i (i)}
            {#if line.kind === "typing"}
              <button
                type="button"
                class="tile cell"
                class:filled={line.letters[i]}
                class:cursor={guess?.cursor === i}
                aria-label={cellLabel(i, line.letters[i])}
                aria-current={guess?.cursor === i ? "true" : undefined}
                onclick={() => onSelect(i)}>{line.letters[i] ?? ""}</button
              >
            {:else}
              <span class="tile {line.colors[i] ?? ''}" class:filled={line.letters[i]} style:--i={i}>{line.letters[i] ?? ""}</span>
            {/if}
          {/each}
        </div>
      {/key}
    {/each}
  </div>
</div>

<style>
  /* The tiles take the largest size that fits both ways. */
  .board-slot {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    display: grid;
    place-items: center;
    container-type: size;
  }

  .board {
    --gap: 0.3rem;
    --tile: min(calc((100cqw - (var(--len) - 1) * var(--gap)) / var(--len)), calc((100cqh - 5 * var(--gap)) / 6), 3.6rem);
    display: grid;
    gap: var(--gap);
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
    border: 1px solid var(--line);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: calc(var(--tile) * 0.5);
    color: var(--ink);
  }

  .tile.filled {
    border-color: var(--line-strong);
  }

  .typing .tile.filled {
    animation: pop 0.15s var(--ease-spring);
  }

  /* The typing row's cells are buttons: a tap puts the cursor there. */
  .cell {
    padding: 0;
    background: transparent;
    cursor: pointer;
    transition: border-color 0.2s var(--ease-spring);
  }

  /* The active cell: a thick bar under it. A full row has none (cursor null). */
  .cell.cursor {
    border-bottom-width: 0.25em;
    border-bottom-color: var(--surface-raised);
  }

  .cell:focus-visible {
    outline: 2px solid var(--accent-text);
    outline-offset: 2px;
  }

  @keyframes pop {
    50% {
      transform: scale(1.08);
    }
  }

  .done .tile {
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

  .shake {
    animation: shake 0.4s var(--ease-spring);
  }

  @keyframes shake {
    20%,
    60% {
      transform: translateX(-6px);
    }
    40%,
    80% {
      transform: translateX(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .done .tile,
    .shake,
    .typing .tile.filled {
      animation: none;
    }
  }
</style>
