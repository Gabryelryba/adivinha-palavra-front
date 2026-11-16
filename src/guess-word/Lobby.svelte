<script>
  import Timer from "phosphor-svelte/lib/Timer";
  import Translate from "phosphor-svelte/lib/Translate";
  import WaitingRoom from "arcade-hub-ui/WaitingRoom.svelte";
  import OptionPicker from "arcade-hub-ui/OptionPicker.svelte";
  import LetterLimit from "./LetterLimit.svelte";
  import { t } from "arcade-hub-ui/i18n/index.svelte.js";

  // The shared waiting room, with Guess Word's settings: the round time, the
  // language of the words and the longest word a player may choose. rules: { minPlayers, maxPlayers } from GuessWord.svelte.
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
    <LetterLimit value={lobby.options?.maxLetters ?? 5} editable={amHost} onChange={(value) => onOption("maxLetters", value)} />
  {/snippet}
</WaitingRoom>
