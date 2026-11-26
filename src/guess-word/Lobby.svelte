<script>
  import Timer from "phosphor-svelte/lib/Timer";
  import Sword from "phosphor-svelte/lib/Sword";
  import WaitingRoom from "arcade-hub-ui/WaitingRoom.svelte";
  import OptionPicker from "arcade-hub-ui/OptionPicker.svelte";
  import TextAa from "phosphor-svelte/lib/TextAa";
  import Hash from "phosphor-svelte/lib/Hash";
  import LimitPicker from "./LimitPicker.svelte";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // The shared waiting room, with Guess Word's settings: the mode (Rounds or
  // Duel), the time to guess, and each mode's own: in Rounds the longest word a
  // player may choose and the tries per round; in Duel the letters of the drawn
  // word and the tries. rules: { minPlayers, maxPlayers } from GuessWord.svelte;
  // the server's `lobby.maxPlayers` wins, since a duel is for two.

  const LETTERS = {
    legend: "guessWord.lobby.maxLetters",
    pick: "guessWord.lobby.maxLettersPick",
    aria: "guessWord.lobby.maxLettersAria",
    on: "guessWord.lobby.limitOn",
    upTo: "guessWord.lobby.upTo",
  };
  const TRIES = {
    legend: "guessWord.lobby.maxTries",
    pick: "guessWord.lobby.maxTriesPick",
    aria: "guessWord.lobby.maxTriesAria",
    on: "guessWord.lobby.limitTriesOn",
    upTo: "guessWord.lobby.upToTries",
  };
  let { lobby, rules, onOption, ...room } = $props();

  const TIMES = [60, 120, 180];
  const DUEL_LETTERS = [4, 5, 6, 7];
  const DUEL_TRIES = [3, 4, 5, 6, 7, 8];
  const timeChoices = $derived(TIMES.map((s) => ({ value: s, label: t("guessWord.lobby.minutes", { count: s / 60 }) })));
  const modeChoices = $derived([
    { value: "rounds", label: t("guessWord.lobby.modeRounds") },
    { value: "duel", label: t("guessWord.lobby.modeDuel") },
  ]);
  const numberChoices = (values) => values.map((value) => ({ value, label: String(value) }));
  // An older server has no mode option: Rounds only, and no picker.
  const hasModes = $derived(lobby.options?.mode !== undefined);
  const duel = $derived(lobby.options?.mode === "duel");
</script>

<WaitingRoom {lobby} minPlayers={rules.minPlayers} maxPlayers={lobby.maxPlayers ?? rules.maxPlayers} {...room}>
  {#snippet options(amHost)}
    {#if hasModes}
      <OptionPicker
        legend={t("guessWord.lobby.mode")}
        label={t("guessWord.lobby.modeAria")}
        name="mode"
        icon={Sword}
        choices={modeChoices}
        value={lobby.options.mode}
        editable={amHost}
        onChange={(value) => onOption("mode", value)}
      />
      <p class="mode-note">{duel ? t("guessWord.lobby.duelNote") : t("guessWord.lobby.roundsNote")}</p>
    {/if}
    <OptionPicker
      legend={duel ? t("guessWord.lobby.duelTime") : t("guessWord.lobby.roundTime")}
      label={t("guessWord.lobby.roundTimeAria")}
      name="round-time"
      icon={Timer}
      choices={timeChoices}
      value={lobby.options?.roundTime}
      editable={amHost}
      onChange={(value) => onOption("roundTime", value)}
    />
    {#if duel}
      <OptionPicker
        legend={t("guessWord.lobby.duelLetters")}
        label={t("guessWord.lobby.duelLettersAria")}
        name="duel-letters"
        icon={TextAa}
        choices={numberChoices(DUEL_LETTERS)}
        value={lobby.options.duelLetters}
        editable={amHost}
        onChange={(value) => onOption("duelLetters", value)}
      />
      <OptionPicker
        legend={t("guessWord.lobby.duelTries")}
        label={t("guessWord.lobby.duelTriesAria")}
        name="duel-tries"
        icon={Hash}
        choices={numberChoices(DUEL_TRIES)}
        value={lobby.options.duelTries}
        editable={amHost}
        onChange={(value) => onOption("duelTries", value)}
      />
    {:else}
      <LimitPicker
        value={lobby.options?.maxLetters ?? 5}
        limits={[4, 5, 6, 7]}
        fallback={5}
        name="max-letters"
        icon={TextAa}
        text={LETTERS}
        editable={amHost}
        onChange={(value) => onOption("maxLetters", value)}
      />
      <!-- An older server has no maxTries option: nothing to show. -->
      {#if lobby.options?.maxTries !== undefined}
        <LimitPicker
          value={lobby.options.maxTries}
          limits={[6, 9, 12, 15]}
          fallback={6}
          name="max-tries"
          icon={Hash}
          text={TRIES}
          editable={amHost}
          onChange={(value) => onOption("maxTries", value)}
        />
      {/if}
    {/if}
  {/snippet}
</WaitingRoom>

<style>
  .mode-note {
    margin: -0.35rem 0 0;
    font-size: 0.85rem;
    color: var(--ink-muted);
    text-wrap: pretty;
  }
</style>
