<script>
  // The hub card and menu art: three guesses closing in on a word, the tiles
  // turning one by one. CSS only; still under "reduce motion".
  const ROWS = [
    { word: "PLUMA", colors: ["absent", "present", "absent", "absent", "present"] },
    { word: "CLARO", colors: ["correct", "present", "present", "present", "present"] },
    { word: "CORAL", colors: ["correct", "correct", "correct", "correct", "correct"] },
  ];
</script>

<div class="preview" translate="no">
  {#each ROWS as row, r (row.word)}
    <div class="row">
      {#each [...row.word] as letter, i (i)}
        <span class="tile {row.colors[i]}" style:--d="{r * 1.1 + i * 0.12}s">{letter}</span>
      {/each}
    </div>
  {/each}
</div>

<style>
  .preview {
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(5, 2.1rem);
    gap: 0.35rem;
  }

  .tile {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border-radius: 0.45rem;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--ink);
    animation: turn 4.5s var(--ease-spring) infinite;
    animation-delay: var(--d);
  }

  .correct {
    --to: var(--tile-correct);
  }

  .present {
    --to: var(--tile-present);
  }

  .absent {
    --to: var(--tile-absent);
  }

  /* Blank, a quick turn, then the colour holds until the loop starts over. */
  @keyframes turn {
    0%,
    6% {
      background: var(--surface-raised);
      transform: rotateX(0);
    }
    12% {
      background: var(--surface-raised);
      transform: rotateX(90deg);
    }
    18%,
    90% {
      background: var(--to);
      transform: rotateX(0);
    }
    100% {
      background: var(--surface-raised);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tile {
      animation: none;
      background: var(--to);
    }
  }
</style>
