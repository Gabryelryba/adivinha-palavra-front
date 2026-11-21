<script>
  import { onMount } from "svelte";
  import { readLog, onLog, clearLog, logText, formatEntry } from "./diagnostics.js";

  // The diagnostics panel (?diag=1 only): the last lines of the log, and buttons
  // to copy it all or start over. Kept small and in a corner, out of the game's way.
  let entries = $state(readLog());
  let open = $state(false);
  let copied = $state("");

  onMount(() => onLog((list) => (entries = list)));

  async function copy() {
    const text = logText(entries);
    try {
      await navigator.clipboard.writeText(text);
      copied = "Copiado";
    } catch {
      // No clipboard (plain http on a LAN address): select the text to copy by hand.
      open = true;
      copied = "Selecione o texto e copie";
    }
    setTimeout(() => (copied = ""), 2500);
  }
</script>

<aside class="diag" aria-label="Diagnóstico">
  <div class="bar">
    <button type="button" onclick={() => (open = !open)}>Diag · {entries.length}</button>
    <button type="button" onclick={copy}>Copiar registro</button>
    <button type="button" onclick={clearLog}>Limpar</button>
    {#if copied}<span class="copied" role="status">{copied}</span>{/if}
  </div>
  {#if open}
    <pre>{entries.slice(-40).map(formatEntry).join("\n")}</pre>
  {/if}
</aside>

<style>
  .diag {
    position: fixed;
    left: 0.5rem;
    bottom: 0.5rem;
    z-index: 100;
    max-width: calc(100vw - 1rem);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--ink);
  }

  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }

  button {
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--line-strong);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }

  .copied {
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    background: var(--surface);
  }

  pre {
    margin-top: 0.3rem;
    max-height: 40vh;
    overflow: auto;
    padding: 0.5rem;
    border-radius: 6px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
  }
</style>
