<script>
  import Backspace from "phosphor-svelte/lib/Backspace";
  import { keyGrid } from "./keyboardState.js";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // Three staggered rows on a grid of 32 columns (keyGrid): Delete closes the
  // second row and a wide Enter the third. states: { letter: best colour so far }.
  let { states = {}, disabled = false, onKey } = $props();

  const keys = keyGrid();

  // A grey key's letter almost disappears on screen, so every coloured key says
  // its state out loud.
  const label = (key) => {
    if (key === "ENTER") return t("guessWord.round.enter");
    if (key === "BACKSPACE") return t("guessWord.round.backspace");
    return states[key] ? t(`guessWord.keyState.${states[key]}`, { letter: key }) : key;
  };
</script>

<div class="keyboard" role="group" aria-label={t("guessWord.round.keyboard")} translate="no">
  {#each keys as { key, row, column, span } (key)}
    <button
      class="key {states[key] ?? ''}"
      class:enter={key === "ENTER"}
      style:grid-row={row}
      style:grid-column="{column} / span {span}"
      {disabled}
      aria-label={label(key)}
      onclick={() => onKey(key)}
    >
      {#if key === "ENTER"}
        {t("guessWord.round.enter")}
      {:else if key === "BACKSPACE"}
        <Backspace size="1em" weight="regular" aria-hidden="true" />
      {:else}
        {key}
      {/if}
    </button>
  {/each}
</div>

<style>
  /* The whole keyboard is sized by its height; the letters follow it. */
  .keyboard {
    --kbd-height: clamp(8.5rem, 20dvh, 12rem);
    display: grid;
    grid-template-columns: repeat(32, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 0.25em;
    width: 100%;
    max-width: 38rem;
    height: var(--kbd-height);
    margin: 0 auto;
    padding: 0 0 0.3em;
    font-size: calc(var(--kbd-height) / 7);
    user-select: none;
    touch-action: manipulation;
  }

  .key {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 8%;
    background: var(--surface-raised);
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition:
      background-color 0.5s ease-in-out,
      color 0.5s ease-in-out,
      transform 0.15s var(--ease-spring);
  }

  .key:active:not(:disabled) {
    transform: scale(0.94);
  }

  .key:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }

  .key:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .enter {
    font-size: 0.9em;
  }

  .correct {
    background: var(--tile-correct);
  }

  .present {
    background: var(--tile-present);
  }

  /* Not in the word: the key stays, its letter fades into the background. */
  .absent {
    background: var(--surface-hover);
    color: var(--bg);
  }

  /* On a phone the keyboard runs almost edge to edge, into the page's side
     margins, so the keys stay close to square. */
  @media (max-width: 640px) {
    .keyboard {
      width: calc(100% + 2 * var(--edge-gutter) - 0.8rem);
      max-width: none;
      margin-inline: calc(0.4rem - var(--edge-gutter));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .key {
      transition: none;
    }
  }
</style>
