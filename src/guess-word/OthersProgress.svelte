<script>
  import Check from "phosphor-svelte/lib/Check";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";
  import { triesLimit, rowsShown } from "./round.js";

  // Everyone else who is guessing this round: their rows as colours only, in
  // their player colour. With `letters` (the chooser's view) the rows show the
  // words too, in bigger boards.
  let { view, players, me, letters = false } = $props();

  const others = $derived(
    view.round.players.filter((p) => p.index !== me && p.index !== view.round.chooser && players[p.index] && !players[p.index].left)
  );
  const length = $derived(view.round.length ?? 5);
  // The chooser's view lays the boards out by how many there are: one fills
  // the space, two sit side by side, three or four make a 2 × 2 grid.
  const cols = $derived(others.length > 1 ? 2 : 1);
  const rows = $derived(Math.max(1, Math.ceil(others.length / cols)));
  // Rows per board: the room's limit, or with no limit what each one has played
  // (at least 6). The boards share one size, set by the tallest.
  const limit = $derived(triesLimit(view));
  const rowsOf = (other) => rowsShown(limit, other.tries);
  const tries = $derived(Math.max(6, ...others.map(rowsOf)));
</script>

<ul
  class="others"
  class:letters
  style:--cols={cols}
  style:--rows={rows}
  style:--len={length}
  style:--tries={tries}
  aria-label={t("guessWord.round.others")}
>
  {#each others as other (other.index)}
    {@const player = players[other.index]}
    <li class="other" class:solved={other.solved} style:--c="var(--player-{player.color})">
      <span class="who" title={t("guessWord.round.progress", { name: player.name, count: other.tries })}>
        <span class="dot" aria-hidden="true"></span>
        <span class="name" translate="no">{player.name}</span>
        {#if other.solved}<Check size={12} weight="bold" aria-hidden="true" />{/if}
      </span>
      <span class="mini" aria-label={t("guessWord.round.progress", { name: player.name, count: other.tries })} role="img" translate="no">
        {#each Array(rowsOf(other)) as _, r (r)}
          {#each Array(length) as _, i (i)}
            {@const row = other.rows[r]}
            <i class={row?.colors[i] ?? ""}>{letters && row?.word ? row.word[i] : ""}</i>
          {/each}
        {/each}
      </span>
    </li>
  {/each}
</ul>

<style>
  .others {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 0.75rem;
    width: 100%;
  }

  .other {
    display: grid;
    gap: 0.25rem;
    justify-items: center;
    min-width: 0;
  }

  .who {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 5.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink-muted);
  }

  .solved .who {
    color: var(--ink);
  }

  .who :global(svg) {
    flex: none;
    color: var(--tile-correct);
  }

  .dot {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--c);
  }

  .name {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* The small boards above a guesser's own board stay about as tall as six rows
     of 5px cells: with more rows the cells get thinner (down to 2px). */
  .mini {
    --cell: max(2px, min(5px, calc((42px - (var(--tries) - 1) * 1px) / var(--tries))));
    display: grid;
    grid-template-columns: repeat(var(--len), var(--cell));
    gap: 1px;
    padding: 3px;
    border-radius: 4px;
    border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  }

  .mini i {
    height: var(--cell);
    border-radius: 1px;
    background: var(--line);
  }

  .mini i.correct {
    background: var(--tile-correct);
  }

  .mini i.present {
    background: var(--tile-present);
  }

  .mini i.absent {
    background: var(--tile-absent);
  }

  /* The chooser's view: boards with the letters, as big as the space allows.
     The parent (.watch in GuessWord) is a size container: each board gets its
     share of the width and height (--cols × --rows), less the name line, the
     board's padding and the gaps, with the same 3.6rem cap as the player's
     own board (Board.svelte). */
  .letters {
    --col-gap: 0.75rem;
    --row-gap: 1rem;
    --name: 1.6rem;
    --gap: 0.25rem;
    --pad: 0.4rem;
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    align-content: center;
    gap: var(--row-gap) var(--col-gap);
    min-height: 100%;
  }

  .letters .other {
    --col: calc((100cqw - (var(--cols) - 1) * var(--col-gap)) / var(--cols));
    --row: calc((100cqh - (var(--rows) - 1) * var(--row-gap)) / var(--rows));
    --size: max(
      1rem,
      min(
        calc((var(--col) - 2 * var(--pad) - 2px - (var(--len) - 1) * var(--gap)) / var(--len)),
        calc((var(--row) - var(--name) - 0.25rem - 2 * var(--pad) - 2px - (var(--tries) - 1) * var(--gap)) / var(--tries)),
        3.6rem
      )
    );
  }

  .letters .who {
    max-width: 100%;
    height: var(--name);
    font-size: clamp(0.85rem, calc(var(--size) * 0.36), 1.05rem);
  }

  .letters .dot {
    width: 8px;
    height: 8px;
  }

  .letters .mini {
    --cell: var(--size);
    gap: var(--gap);
    padding: var(--pad);
    border-radius: calc(var(--cell) * 0.24);
  }

  .letters .mini i {
    display: grid;
    place-items: center;
    height: var(--cell);
    border-radius: calc(var(--cell) * 0.16);
    font-family: var(--font-mono);
    font-style: normal;
    font-weight: 700;
    font-size: calc(var(--cell) * 0.55);
    color: var(--ink);
  }
</style>
