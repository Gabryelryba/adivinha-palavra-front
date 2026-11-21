<script>
  import OptionPicker from "arcade-hub-ui/OptionPicker.svelte";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // A room setting with a limit: a switch (on by default) and the numbers to
  // pick from. Off is the server's 0 (no limit). Turning it back on restores the
  // last number picked. The host changes it; everyone else sees it as text.
  // Used for the longest word and for the tries per round.
  // name: an id for the field ("max-letters"); icon: a phosphor component;
  // text: { legend, pick, aria, on, upTo } as i18n keys (upTo takes { count }).
  let { value, limits, fallback = limits[0], name, icon: Icon, text, editable = false, onChange } = $props();

  const on = $derived(value !== 0);
  let last = $state(fallback);
  $effect(() => {
    if (value !== 0 && value != null) last = value;
  });

  const labelId = $derived(`guess-word-${name}-label`);
  const choices = $derived(limits.map((n) => ({ value: n, label: String(n) })));
</script>

{#if editable}
  <div class="limit">
    <div class="head">
      <span class="legend" id={labelId}><Icon size={18} weight="light" aria-hidden="true" />{t(text.legend)}</span>
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        onclick={() => onChange(on ? 0 : last)}
      >
        <span class="switch-text">{on ? t(text.on) : t("guessWord.lobby.noLimit")}</span>
        <span class="track" aria-hidden="true"><span class="thumb"></span></span>
      </button>
    </div>
    {#if on}
      <OptionPicker legend={t(text.pick)} label={t(text.aria)} {name} {choices} {value} editable onChange={(n) => onChange(n)} />
    {/if}
  </div>
{:else}
  <div class="limit">
    <span class="legend"><Icon size={18} weight="light" aria-hidden="true" />{t(text.legend)}</span>
    <p class="chosen">
      {#key value}
        <span class="value-chip">{on ? t(text.upTo, { count: value }) : t("guessWord.lobby.noLimit")}</span>
      {/key}
    </p>
  </div>
{/if}

<style>
  .limit {
    display: grid;
    gap: 0.55rem;
    min-width: 0;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .legend {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.92rem;
    font-weight: 600;
  }

  .legend :global(svg) {
    color: var(--accent-text);
  }

  .legend,
  .switch-text {
    white-space: nowrap;
  }

  /* Phones: inside the settings panel there is no room for both the legend and
     the switch's words; the switch itself (and aria-checked) shows the state. */
  @media (max-width: 420px) {
    .switch-text {
      display: none;
    }

    .switch {
      padding-left: 0.3rem;
    }
  }

  /* The picker below repeats a small legend for screen readers only. */
  .limit :global(legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 2.5rem;
    padding: 0 0.3rem 0 0.75rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--bg-deep);
    color: var(--ink-muted);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.3s var(--ease-spring);
  }

  .switch:hover {
    color: var(--ink);
    border-color: var(--line-strong);
  }

  .switch[aria-checked="true"] {
    color: var(--ink);
    border-color: var(--accent-line);
  }

  .switch:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .track {
    position: relative;
    width: 2.6rem;
    height: 1.6rem;
    border-radius: 999px;
    background: var(--surface-hover);
    transition: background-color 0.3s var(--ease-spring);
  }

  .switch[aria-checked="true"] .track {
    background: var(--accent);
  }

  .thumb {
    position: absolute;
    top: 0.2rem;
    left: 0.2rem;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: var(--ink);
    transition: transform 0.35s var(--ease-spring);
  }

  .switch[aria-checked="true"] .thumb {
    transform: translateX(1rem);
  }

  .chosen {
    margin: 0;
  }

  /* Same chip as OptionPicker's read-only view. */
  .value-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    background: var(--accent-soft);
    border: 1px solid var(--accent-line);
    color: var(--ink);
    font-weight: 600;
    font-size: 0.92rem;
    animation: chip-in 0.6s var(--ease-spring);
  }

  @keyframes chip-in {
    from {
      transform: scale(0.88);
      background: var(--accent-line);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .thumb,
    .track {
      transition: none;
    }

    .value-chip {
      animation: none;
    }
  }
</style>
