<script>
  import Backspace from "phosphor-svelte/lib/Backspace";
  import { KEY_ROWS } from "./keyboardState.js";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // QWERTY with Enter and Delete. states: { letter: best colour so far }.
  let { states = {}, disabled = false, onKey } = $props();
</script>

<div class="keyboard" role="group" aria-label={t("guessWord.round.keyboard")} translate="no">
  {#each KEY_ROWS as row, r (r)}
    <div class="key-row">
      {#each row as key (key)}
        {#if key === "ENTER"}
          <button class="key wide" {disabled} onclick={() => onKey("ENTER")}>{t("guessWord.round.enter")}</button>
        {:else if key === "BACKSPACE"}
          <button class="key wide" {disabled} onclick={() => onKey("BACKSPACE")} aria-label={t("guessWord.round.backspace")}>
            <Backspace size={20} weight="light" aria-hidden="true" />
          </button>
        {:else}
          <button class="key {states[key] ?? ''}" {disabled} onclick={() => onKey(key)}>{key}</button>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  .keyboard {
    display: grid;
    gap: 0.4rem;
    width: 100%;
    max-width: 32rem;
    margin: 0 auto;
    user-select: none;
    touch-action: manipulation;
  }

  .key-row {
    display: flex;
    justify-content: center;
    gap: 0.3rem;
  }

  .key {
    flex: 1 1 0;
    min-width: 0;
    height: clamp(2.5rem, 7dvh, 3.4rem);
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 0.5rem;
    background: var(--surface-hover);
    color: var(--ink);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      background-color 0.3s var(--ease-spring),
      transform 0.15s var(--ease-spring);
  }

  .key:active:not(:disabled) {
    transform: scale(0.94);
  }

  .key:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .key:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .wide {
    flex-grow: 1.6;
    font-family: inherit;
    font-size: 0.8rem;
  }

  .correct {
    background: var(--tile-correct);
  }

  .present {
    background: var(--tile-present);
  }

  .absent {
    background: var(--tile-absent);
    color: var(--ink-faint);
  }

  /* The middle row is a key shorter, as on a real keyboard. */
  .key-row:nth-child(2) {
    padding: 0 4.5%;
  }

  @media (max-width: 360px) {
    .key-row {
      gap: 0.22rem;
    }

    .key {
      font-size: 0.85rem;
    }

    .wide {
      flex-grow: 1.9;
      padding: 0;
      font-size: 0.68rem;
    }
  }
</style>
