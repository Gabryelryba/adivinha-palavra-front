<script>
  import Timer from "phosphor-svelte/lib/Timer";
  import Translate from "phosphor-svelte/lib/Translate";
  import WaitingRoom from "arcade-hub-ui/WaitingRoom.svelte";
  import OptionPicker from "arcade-hub-ui/OptionPicker.svelte";
  import TextAa from "phosphor-svelte/lib/TextAa";
  import Hash from "phosphor-svelte/lib/Hash";
  import LimitPicker from "./LimitPicker.svelte";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // The shared waiting room, with Guess Word's settings: the round time, the
  // language of the words, the longest word a player may choose and the tries
  // per round. rules: { minPlayers, maxPlayers } from GuessWord.svelte.

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
  const timeChoices = $derived(TIMES.map((s) => ({ value: s, label: t("guessWord.lobby.minutes", { count: s / 60 }) })));
  const languageChoices = $derived(["pt", "en"].map((l) => ({ value: l, label: t(`guessWord.lobby.languages.${l}`) })));
</script>

<WaitingRoom {lobby} minPlayers={rules.minPlayers} maxPlayers={rules.maxPlayers} {...room}>
  {#snippet options(amHost)}
    <OptionPicker
      legend={t("guessWord.lobby.roundTime")}
      label={t("guessWord.lobby.roundTimeAria")}
      name="round-time"
      icon={Timer}
      choices={timeChoices}
      value={lobby.options?.roundTime}
      editable={amHost}
      onChange={(value) => onOption("roundTime", value)}
    />
    <OptionPicker
      legend={t("guessWord.lobby.language")}
      label={t("guessWord.lobby.languageAria")}
      name="word-language"
      icon={Translate}
      choices={languageChoices}
      value={lobby.options?.language}
      editable={amHost}
      onChange={(value) => onOption("language", value)}
    />
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
  {/snippet}
</WaitingRoom>
