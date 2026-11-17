<script>
  import ArrowRight from "phosphor-svelte/lib/ArrowRight";
  import Avatar from "arcade-hub-ui/Avatar.svelte";
  import { upcomingChoosers, nameOf } from "./round.js";
  import { t, joinNames } from "arcade-hub-ui/i18n/index.svelte.js";

  // The choosing phase. The chooser types a word of 4 to 8 letters (the server
  // checks the dictionary; error is its refusal, already translated); everyone
  // else sees who is choosing and who comes next.
  let { view, players, me, error = "", onChoose } = $props();

  const MIN = 4;
  // The room's limit, from the server (4 to 8).
  const max = $derived(view.maxLetters ?? 8);
  const exact = $derived(max === MIN);

  let word = $state("");
  let local = $state("");
  let input;

  const chooser = $derived(view.round.chooser);
  const mine = $derived(chooser === me);
  const next = $derived(upcomingChoosers(view, players));
  const shown = $derived(local || error);

  $effect(() => {
    if (mine) requestAnimationFrame(() => input?.focus());
  });

  function clean(value) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, max);
  }

  function submit(evt) {
    evt.preventDefault();
    if (word.length < MIN || word.length > max) {
      local = exact ? t("guessWord.choose.lengthExact") : t("guessWord.choose.length", { max });
      input?.focus();
      return;
    }
    local = "";
    onChoose(word);
  }
</script>

<section class="choose">
  {#if mine}
    <form class="pick" onsubmit={submit} novalidate>
      <h2>{t("guessWord.choose.title")}</h2>
      <p class="help">{exact ? t("guessWord.choose.helpExact") : t("guessWord.choose.help", { max })}</p>
      <label class="sr-only" for="guess-word-secret">{t("guessWord.choose.label")}</label>
      <div class="row">
        <input
          id="guess-word-secret"
          bind:this={input}
          class="word-input"
          class:invalid={shown}
          type="text"
          name="secret-word"
          inputmode="text"
          placeholder={t("guessWord.choose.placeholder")}
          autocomplete="off"
          autocorrect="off"
          autocapitalize="characters"
          spellcheck="false"
          enterkeyhint="done"
          maxlength={max + 4}
          aria-invalid={shown ? "true" : undefined}
          aria-describedby="guess-word-secret-note"
          value={word}
          oninput={(evt) => {
            word = clean(evt.currentTarget.value);
            evt.currentTarget.value = word;
            local = "";
          }}
          translate="no"
        />
        <button class="btn btn-primary" type="submit" disabled={word.length < MIN}>
          {t("guessWord.choose.confirm")}
          <span class="orb"><ArrowRight size={16} weight="bold" aria-hidden="true" /></span>
        </button>
      </div>
      <p id="guess-word-secret-note" class:error={shown} class="note" role={shown ? "alert" : undefined}>
        {shown || t("guessWord.choose.drawNote")}
      </p>
      <p class="count" aria-hidden="true">{word.length}/{max}</p>
    </form>
  {:else}
    <div class="waiting">
      <Avatar name={players[chooser]?.name ?? "?"} color={players[chooser]?.color ?? 1} size="3.4rem" />
      <p class="who" role="status" aria-live="polite">
        <span class="pulse" aria-hidden="true"></span>
        {t("guessWord.choose.choosing", { name: nameOf(players, chooser, me) })}
      </p>
      <p class="help">
        {next.length > 0
          ? t("guessWord.choose.nextUp", { names: joinNames(next.map((seat) => nameOf(players, seat, me))) })
          : t("guessWord.choose.lastRound")}
      </p>
    </div>
  {/if}
</section>

<style>
  .choose {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: center;
    width: 100%;
    padding-bottom: 2rem;
  }

  .pick {
    display: grid;
    gap: 0.6rem;
    width: min(26rem, 100%);
  }

  h2 {
    font-size: clamp(1.6rem, 7vw, 2.2rem);
    letter-spacing: -0.035em;
    line-height: 1.05;
  }

  .help {
    color: var(--ink-muted);
    font-size: 0.95rem;
    text-wrap: pretty;
  }

  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.4rem;
  }

  .word-input {
    flex: 1 1 0;
    min-width: 0;
    min-height: 3.2rem;
    padding: 0 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line-strong);
    background: var(--bg-deep);
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 1.3rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    transition: border-color 0.3s var(--ease-spring);
  }

  .word-input::placeholder {
    letter-spacing: normal;
    font-weight: 500;
    font-size: 1rem;
    text-transform: none;
    color: var(--ink-faint);
  }

  .word-input:focus-visible {
    outline: none;
    border-color: var(--focus);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .word-input.invalid {
    border-color: var(--danger);
  }

  .note {
    min-height: 1.4em;
    color: var(--ink-faint);
    font-size: 0.9rem;
  }

  .note.error {
    color: var(--danger);
    font-weight: 500;
  }

  .count {
    justify-self: end;
    margin-top: -1.9rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--ink-faint);
  }

  .waiting {
    display: grid;
    justify-items: center;
    gap: 0.8rem;
    text-align: center;
    max-width: 24rem;
  }

  .who {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 600;
    font-size: 1.05rem;
  }

  .pulse {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: breathe 1.8s ease-in-out infinite;
  }

  @keyframes breathe {
    50% {
      opacity: 0.25;
      transform: scale(0.75);
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (max-width: 380px) {
    .row {
      flex-direction: column;
    }

    .count {
      margin-top: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse {
      animation: none;
    }
  }
</style>
