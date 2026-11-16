<script>
  import { onMount, onDestroy, untrack } from "svelte";
  import ArrowLeft from "phosphor-svelte/lib/ArrowLeft";
  import { socket } from "arcade-hub-ui/socket.js";
  import { keepScreenAwake, allowScreenSleep } from "arcade-hub-ui/wakeLock.js";
  import { inviteUrl } from "arcade-hub-ui/invite.js";
  import GameMenu from "arcade-hub-ui/GameMenu.svelte";
  import ResultSheet from "arcade-hub-ui/ResultSheet.svelte";
  import { startHint } from "arcade-hub-ui/lobbyText.js";
  import Preview from "./Preview.svelte";
  import Lobby from "./Lobby.svelte";
  import ChooseWord from "./ChooseWord.svelte";
  import Board from "./Board.svelte";
  import Keyboard from "./Keyboard.svelte";
  import OthersProgress from "./OthersProgress.svelte";
  import Timer from "./Timer.svelte";
  import RoundScore from "./RoundScore.svelte";
  import { letterStates, keyFromEvent, emptyGuess, fitGuess, guessWord, selectCell, editGuess } from "./keyboardState.js";
  import { outcomeText, nameOf } from "./round.js";
  import { ranking, headline, rematchVote } from "./result.js";
  import { t, serverMessage, currentLanguage } from "arcade-hub-ui/i18n/index.svelte.js";

  const GAME_ID = "guess-word";
  // Seats in the waiting room, as on the server (games/<id> in arcade-hub-back).
  const rules = { minPlayers: 2, maxPlayers: 5 };
  const CHOOSE_SECONDS = 45;
  const REVEAL_SECONDS = 8;

  // Props come from GameApp (arcade-hub-ui), which mounts the game.
  let {
    onExit,
    inviteCode: invitedTo = null,
    onInviteUsed = () => {},
    onSwitchGame = () => false,
    ensureName = async () => null,
  } = $props();

  let status = $state("connecting"); // connecting | menu | joining | lobby | playing | ended
  let lobby = $state(null); // the last `lobby` event
  let notice = $state("");

  // The match: this player's seat, the seats, and this player's last `state`.
  let playerIndex = $state(null);
  let seats = $state([]);
  let game = $state(null);
  let offset = $state(0); // the server's clock minus this device's
  let roomCode = $state("");

  // The guess being typed, and what happened to the last one.
  let guess = $state(emptyGuess(0)); // fitted to the word's length where used
  let pending = $state(false);
  let shake = $state(0);
  let moveError = $state("");
  let chooseError = $state("");
  let moveErrorTimer;

  let joinError = $state("");
  let showJoinForm = $state(false);
  let slowServer = $state(false);
  let reconnecting = $state(false);
  let confirmLeave = $state(false);

  let noticeTimer;
  let resumeFailures = 0;

  // Read once: the invite is joined on the first connection only, not on later reconnects.
  let inviteCode = untrack(() => invitedTo);

  function say(message, ms = 4000) {
    clearTimeout(noticeTimer);
    notice = message;
    if (message) noticeTimer = setTimeout(() => (notice = ""), ms);
  }

  function showMoveError(message) {
    clearTimeout(moveErrorTimer);
    moveError = message;
    moveErrorTimer = setTimeout(() => (moveError = ""), 2200);
  }

  function handleConnect() {
    slowServer = false;
    if (status === "lobby") {
      resumeSeat();
    } else if (status === "playing" || status === "ended") {
      // A match cannot be resumed: the server has already taken this player out.
      backToMenu(t("guessWord.droppedOut"));
    } else if (inviteCode) {
      const code = inviteCode;
      inviteCode = null;
      onInviteUsed();
      status = "menu";
      sendJoin(code);
    } else {
      status = "menu";
    }
  }

  function handleDisconnect() {
    if (status === "lobby") reconnecting = true;
  }

  const MAX_RESUME_FAILURES = 3;

  // No answer means the connection is stale (a woken-up phone can think it is
  // still connected), so open a fresh one; its "connect" tries this again.
  function resumeSeat() {
    socket.timeout(4000).emit("resumeRoom", (err, res) => {
      if (status !== "lobby") return;
      if (err) {
        resumeFailures += 1;
        if (resumeFailures >= MAX_RESUME_FAILURES) backToMenu(t("guessWord.connectionLost"));
        else socket.disconnect().connect();
        return;
      }
      resumeFailures = 0;
      if (res?.ok && res.lobby) reconnecting = false;
      else backToMenu(t("guessWord.seatExpired"));
    });
  }

  function handleVisibility() {
    if (document.visibilityState !== "visible" || status !== "lobby") return;
    if (socket.connected) resumeSeat();
    else socket.connect();
  }

  function handleRoomCreated({ code }) {
    roomCode = code;
    status = "lobby";
  }

  function handleJoinedLobby({ code }) {
    roomCode = code;
    status = "lobby";
  }

  function handleLobby(view) {
    const before = lobby;
    lobby = view;
    roomCode = view.code;
    if (view.phase === "lobby" && status === "joining") status = "lobby";
    if (view.phase === "lobby" && status === "ended") {
      status = "lobby";
      game = null;
      say(t("guessWord.backInLobby"), 5000);
      return;
    }
    const wasHost = before?.players[before.you]?.host === true;
    if (status === "lobby" && before && !wasHost && view.players[view.you]?.host) {
      say(t("guessWord.nowHost"), 6000);
    }
  }

  function handleJoinError(refusal) {
    const { gameId } = refusal;
    // The code belongs to another game in the hub: open that game with it.
    if (gameId && gameId !== GAME_ID && onSwitchGame(gameId, roomCode)) return;
    joinError = gameId && gameId !== GAME_ID ? t("errors.join.other-game") : serverMessage("join", refusal);
    status = "menu";
    showJoinForm = true;
  }

  function handleStartRefused(check) {
    say(startHint(check));
  }

  function handleMatched({ playerIndex: index, players }) {
    playerIndex = index;
    seats = players;
    game = null;
    guess = emptyGuess(0);
    pending = false;
    status = "playing";
    confirmLeave = false;
    say("");
  }

  function handleState(state) {
    const before = game;
    game = state;
    if (typeof state.serverNow === "number") offset = state.serverNow - Date.now();
    if (Array.isArray(state.players)) seats = state.players;

    const round = state.round;
    const newRound = !before || before.round.number !== round.number;
    if (newRound || round.phase !== "guessing") {
      guess = emptyGuess(0);
      pending = false;
      chooseError = "";
    }
    const triesBefore = before?.round.number === round.number ? (before.round.players[playerIndex]?.tries ?? 0) : 0;
    if ((round.players[playerIndex]?.tries ?? 0) > triesBefore) {
      guess = emptyGuess(0);
      pending = false;
    }

    // The chooser left: the round was called off and the next one started.
    if (before && state.history.length > before.history.length) {
      const last = state.history.at(-1);
      if (last.outcome === "cancelled") say(t("guessWord.roundCancelled", { name: seats[last.chooser]?.name ?? t("common.someone") }), 5000);
    }

    if (state.winners) {
      status = "ended";
      confirmLeave = false;
    }
  }

  function handlePlayerLeft({ name }) {
    if (status === "playing" || status === "ended") say(t("guessWord.playerLeft", { name }), 3500);
  }

  function handleMoveRejected(refusal) {
    const message = serverMessage("move", refusal);
    pending = false;
    if (game?.round.phase === "choosing" && game.round.chooser === playerIndex) {
      chooseError = message;
      return;
    }
    shake += 1;
    showMoveError(message);
  }

  const listeners = {
    connect: handleConnect,
    disconnect: handleDisconnect,
    roomCreated: handleRoomCreated,
    joinedLobby: handleJoinedLobby,
    lobby: handleLobby,
    joinError: handleJoinError,
    startRefused: handleStartRefused,
    matched: handleMatched,
    state: handleState,
    moveRejected: handleMoveRejected,
    playerLeft: handlePlayerLeft,
  };

  // A physical keyboard types guesses too, unless a text field has the focus.
  function handleKeydown(evt) {
    if (!canGuess || evt.target.closest?.("input, textarea")) return;
    const key = keyFromEvent(evt);
    if (!key) return;
    evt.preventDefault();
    pressKey(key);
  }

  onMount(() => {
    for (const [event, handler] of Object.entries(listeners)) socket.on(event, handler);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKeydown);
    socket.connect();
    const slowTimer = setTimeout(() => {
      if (status === "connecting") slowServer = true;
    }, 4000);
    return () => clearTimeout(slowTimer);
  });

  onDestroy(() => {
    // Leaving the game screen gives the seat up at once.
    if (socket.connected && (status === "lobby" || status === "playing" || status === "ended")) socket.emit("leaveRoom");
    for (const [event, handler] of Object.entries(listeners)) socket.off(event, handler);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("keydown", handleKeydown);
    clearTimeout(noticeTimer);
    clearTimeout(moveErrorTimer);
    socket.disconnect();
  });

  async function sendJoin(code) {
    const name = await ensureName();
    if (!name) return;
    joinError = "";
    status = "joining";
    roomCode = code;
    socket.emit("joinRoom", { code, gameId: GAME_ID, name });
  }

  // The words default to the host's screen language; the host can change it in the room.
  async function createRoom() {
    const name = await ensureName();
    if (!name) return;
    joinError = "";
    const language = currentLanguage().startsWith("pt") ? "pt" : "en";
    socket.emit("createRoom", { gameId: GAME_ID, name, options: { language } });
  }

  function backToMenu(message = "") {
    status = "menu";
    lobby = null;
    game = null;
    seats = [];
    playerIndex = null;
    roomCode = "";
    reconnecting = false;
    confirmLeave = false;
    joinError = message;
    say("");
  }

  function leaveRoom() {
    socket.emit("leaveRoom");
    backToMenu();
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl(window.location.href, roomCode));
    } catch {
      // Clipboard API unavailable (e.g. insecure context): the code is on screen.
    }
  }

  // Leaving a live match takes the player out of it, so it takes a second tap.
  function handleBack() {
    if (status === "playing" && !confirmLeave) {
      confirmLeave = true;
      setTimeout(() => (confirmLeave = false), 3500);
      return;
    }
    onExit();
  }

  // A key on the guess: letters go in the cursor's cell, in any order (DG-65).
  function pressKey(key) {
    if (!canGuess) return;
    const next = editGuess(typing, key);
    guess = next.guess;
    if (!next.submit) return;
    const word = guessWord(guess);
    if (!word) {
      shake += 1;
      showMoveError(t("guessWord.round.notEnoughLetters"));
      return;
    }
    pending = true;
    socket.emit("move", { type: "guess", word });
  }

  function selectGuessCell(index) {
    if (canGuess) guess = selectCell(typing, index);
  }

  function choose(word) {
    chooseError = "";
    socket.emit("move", { type: "choose", word });
  }

  const inRoom = $derived(status === "lobby" || status === "playing" || status === "ended" || status === "joining");
  const inMatch = $derived((status === "playing" || status === "ended") && game !== null);
  const round = $derived(game?.round ?? null);
  const amChooser = $derived(round?.chooser === playerIndex);
  const mine = $derived(round?.players[playerIndex] ?? { tries: 0, rows: [] });
  const wordLength = $derived(round?.length ?? 5);
  const typing = $derived(fitGuess(guess, wordLength));
  const canGuess = $derived(
    status === "playing" && round?.phase === "guessing" && !amChooser && mine.tries < (game?.maxTries ?? 6) && !pending
  );
  const keyStates = $derived(letterStates(mine.rows));
  const phaseSeconds = $derived(
    round?.phase === "choosing" ? CHOOSE_SECONDS : round?.phase === "reveal" ? REVEAL_SECONDS : (game?.roundTime ?? 120)
  );

  const statusText = $derived.by(() => {
    if (!round) return "";
    if (round.phase === "reveal" || round.phase === "over") return round.outcome ? outcomeText(game, seats, playerIndex) : "";
    if (round.phase !== "guessing") return "";
    if (amChooser) return t("guessWord.round.watching", { word: round.word ?? "" }) + (round.drawn ? ` ${t("guessWord.round.drawn")}` : "");
    const left = (game.maxTries ?? 6) - mine.tries;
    if (left <= 0) return t("guessWord.round.noTries");
    return `${t("guessWord.round.yourTurn", { length: wordLength })} ${t("guessWord.round.triesLeft", { count: left })}`;
  });

  // A locked phone suspends the page and drops the connection, so keep the screen on in the room and in a match.
  $effect(() => {
    if (status !== "lobby" && status !== "playing") return;
    keepScreenAwake();
    return allowScreenSleep;
  });
</script>

<main class="screen" class:in-game={inMatch}>
  <header class="topbar">
    <button
      class="btn btn-ghost back"
      class:btn-danger={confirmLeave}
      onclick={handleBack}
      aria-label={confirmLeave ? t("guessWord.leaveMatchAria") : t("common.backToHub")}
    >
      <ArrowLeft size={18} weight="light" aria-hidden="true" />
      <span>{confirmLeave ? t("guessWord.leaveMatch") : "Recreio"}</span>
    </button>
    {#if inMatch && round && round.phase !== "over"}
      <span class="round-label">{t("guessWord.round.label", { n: round.number, total: game.rounds })}</span>
      <Timer endsAt={round.endsAt} {offset} total={phaseSeconds} />
    {:else if inRoom}
      <span class="game-name" translate="no">{t("games.guess-word.name")}</span>
    {/if}
  </header>

  {#if status === "menu" || status === "connecting"}
    <GameMenu
      gameId={GAME_ID}
      eyebrow={t("guessWord.eyebrow")}
      title={t("games.guess-word.name")}
      lede={t("guessWord.lede")}
      connecting={status === "connecting"}
      {slowServer}
      bind:joinError
      bind:showJoinForm
      onCreate={createRoom}
      onJoin={sendJoin}
    >
      {#snippet art()}<Preview />{/snippet}
    </GameMenu>
  {:else if status === "joining" || (status === "lobby" && !lobby)}
    <section class="center-state" aria-busy="true">
      <p class="status-line" role="status" aria-live="polite">
        <span class="pulse" aria-hidden="true"></span>{roomCode
          ? t("common.joiningRoom", { code: roomCode })
          : t("guessWord.openingRoom")}
      </p>
      <span class="skeleton"></span>
    </section>
  {:else if status === "lobby"}
    <Lobby
      {lobby}
      {rules}
      {notice}
      {reconnecting}
      onReady={(ready) => socket.emit("setReady", { ready })}
      onOption={(key, value) => socket.emit("setOption", { key, value })}
      onStart={() => socket.emit("startGame")}
      onCopyLink={copyInviteLink}
      onLeave={leaveRoom}
    />
  {:else if inMatch}
    <section class="match">
      <p class="status-line match-status" class:highlight={canGuess} class:error={moveError} role="status" aria-live="polite">
        {moveError || notice || statusText}
      </p>
      {#if round.phase === "choosing"}
        <ChooseWord view={game} players={seats} me={playerIndex} error={chooseError} onChoose={choose} />
      {:else if amChooser}
        <div class="watch">
          <OthersProgress view={game} players={seats} me={playerIndex} letters />
        </div>
      {:else}
        <OthersProgress view={game} players={seats} me={playerIndex} />
        <Board
          rows={mine.rows}
          length={wordLength}
          guess={typing}
          maxTries={game.maxTries}
          active={round.phase === "guessing" && mine.tries < (game.maxTries ?? 6)}
          {shake}
          onSelect={selectGuessCell}
        />
        <Keyboard states={keyStates} disabled={!canGuess} onKey={pressKey} />
      {/if}
    </section>
  {:else}
    <section class="center-state">
      <p class="status-line" role="status" aria-live="polite">
        <span class="pulse" aria-hidden="true"></span>{t("guessWord.starting")}
      </p>
    </section>
  {/if}
</main>

{#if inMatch && round?.phase === "reveal"}
  {#key round.number}
    <RoundScore view={game} players={seats} me={playerIndex} {offset} />
  {/key}
{/if}

{#if status === "ended" && game?.winners}
  <ResultSheet
    id="guess-word"
    head={headline(game, seats, playerIndex)}
    rows={ranking(game, seats)}
    vote={rematchVote(seats, playerIndex)}
    me={playerIndex}
    onPlayAgain={() => socket.emit("playAgain")}
    onBackToLobby={() => socket.emit("backToLobby")}
    onMenu={leaveRoom}
  />
{/if}

<style>
  .screen {
    position: relative;
    z-index: 1;
    flex: 1;
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--edge-gutter) max(2rem, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    margin-left: -0.6rem;
  }

  .back {
    min-height: 2.75rem;
    padding: 0 0.85rem;
  }

  .game-name {
    margin-left: auto;
    font-weight: 600;
    color: var(--ink-muted);
    letter-spacing: -0.01em;
  }

  .round-label {
    margin-left: auto;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-muted);
    white-space: nowrap;
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

  .center-state {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 1rem;
    max-width: 34rem;
    padding-bottom: 4rem;
  }

  .status-line {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--ink-muted);
    font-weight: 500;
  }

  .skeleton {
    width: 100%;
    height: 14rem;
    border-radius: var(--radius-xl);
    background: linear-gradient(90deg, var(--surface) 0%, var(--surface-raised) 50%, var(--surface) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }

  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }

  /* ---- Match: one viewport tall, the board takes the height that is left ---- */
  .screen.in-game {
    height: 100vh;
    height: 100dvh;
    min-height: 0;
    padding-top: max(0.75rem, env(safe-area-inset-top));
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }

  .match {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding-top: 0.25rem;
  }

  /* Two lines reserved, so a longer message never moves the board. */
  .match-status {
    justify-content: center;
    text-align: center;
    min-height: 2.6em;
    font-weight: 600;
    font-size: 0.92rem;
    text-wrap: balance;
    transition: color 0.3s var(--ease-spring);
  }

  .match-status.highlight {
    color: var(--ink);
  }

  .match-status.error {
    color: var(--danger);
  }

  /* The chooser's view: a size container, so the boards inside
     (OthersProgress) grow to fill it. A 0 basis (not 0%) keeps its height
     definite, as .board-slot in Board.svelte: with 0% the container's
     height reads as 0 inside it. */
  .watch {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    overflow: auto;
    padding-top: 0.5rem;
    container-type: size;
  }

  @media (max-height: 620px) {
    .match {
      gap: 0.4rem;
    }

    .match-status {
      min-height: 2.4em;
      font-size: 0.85rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse {
      animation: none;
    }
  }
</style>
