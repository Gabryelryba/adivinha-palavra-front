<script>
  import { onMount, onDestroy, untrack } from "svelte";
  import ArrowLeft from "phosphor-svelte/lib/ArrowLeft";
  import { socket } from "arcade-hub-ui/socket.js";
  import { keepScreenAwake, allowScreenSleep } from "arcade-hub-ui/wakeLock.js";
  import { inviteUrl } from "arcade-hub-ui/invite.js";
  import GameLanding from "arcade-hub-ui/GameLanding.svelte";
  import ResultSheet from "arcade-hub-ui/ResultSheet.svelte";
  import { startHint } from "arcade-hub-ui/lobbyText.js";
  import { rememberRoom, recallRoom, forgetRoom } from "arcade-hub-ui/roomMemory.js";
  import { connectDecision } from "./resume.js";
  import { diagActive, diagLog } from "../diagnostics.js";
  import DiagPanel from "../DiagPanel.svelte";
  import Preview from "./Preview.svelte";
  import Lobby from "./Lobby.svelte";
  import ChooseWord from "./ChooseWord.svelte";
  import Board from "./Board.svelte";
  import Keyboard from "./Keyboard.svelte";
  import OthersProgress from "./OthersProgress.svelte";
  import Timer from "./Timer.svelte";
  import RoundScore from "./RoundScore.svelte";
  import OpponentBoard from "./OpponentBoard.svelte";
  import { isDuel, opponentOf, duelStatus, duelHeadline, duelRows } from "./duel.js";
  import { letterStates, keyFromEvent, emptyGuess, fitGuess, guessWord, selectCell, editGuess, revealDelay } from "./keyboardState.js";
  import { outcomeText, nameOf, triesLimit, triesLeft, rowsShown } from "./round.js";
  import { ranking, headline, rematchVote } from "./result.js";
  import { t, tList, serverMessage } from "arcade-hub-ui/i18n/index.svelte.js";

  const GAME_ID = "guess-word";
  // Seats in the waiting room, as on the server (games/<id> in arcade-hub-back).
  const rules = { minPlayers: 2, maxPlayers: 5 };
  const CHOOSE_SECONDS = 45;
  // The scores between rounds last as long as the server says (round.endsAt - round.startedAt).
  const REVEAL_FALLBACK_SECONDS = 15;

  // Props come from GameApp (arcade-hub-ui), which mounts the game.
  let {
    inviteCode: invitedTo = null,
    onInviteUsed = () => {},
    playerName = null,
    ensureName = async () => null,
    editName = null,
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
    const decision = connectDecision({ status, remembered: recallRoom(), inviteCode, gameId: GAME_ID });
    if (diagActive) diagLog("decision", decision.action);
    if (decision.usedInvite) {
      inviteCode = null;
      onInviteUsed();
    }
    if (decision.action === "resume-seat") {
      resumeSeat();
    } else if (decision.action === "dropped") {
      // A match cannot be resumed: the server has already taken this player out.
      backToMenu(t("guessWord.droppedOut"));
    } else if (decision.action === "resume-remembered") {
      resumeRemembered(decision.code, decision.joinAfter);
    } else {
      status = "menu";
      if (decision.action === "join") sendJoin(decision.code);
    }
  }

  // The page reloaded while in a waiting room (a phone brought the tab back from
  // the background): take the same seat, as host if it was the host's. The
  // screen keeps showing "connecting" meanwhile; the server sends the room's
  // `lobby` right before it answers.
  function resumeRemembered(code, joinAfter) {
    socket.timeout(4000).emit("resumeRoom", (err, res) => {
      if (status !== "connecting" && status !== "menu") return;
      if (!err && res?.ok && res.lobby) {
        roomCode = res.code;
        status = "lobby";
        reconnecting = false;
        rememberRoom({ code: res.code, gameId: GAME_ID });
        return;
      }
      forgetRoom();
      if (joinAfter) {
        status = "menu";
        sendJoin(joinAfter);
        return;
      }
      backToMenu(t(err ? "guessWord.connectionLost" : "guessWord.seatExpired"));
    });
  }

  // Leaving the page (another app, a locked phone) is when the room is
  // remembered last, so the 3 minutes count from there.
  function rememberOnLeave() {
    if (status === "lobby" && roomCode) rememberRoom({ code: roomCode, gameId: GAME_ID });
  }

  // In a match it only says so: a match cannot be resumed, so the next
  // connection lands on the menu with the reason (connectDecision: "dropped").
  function handleDisconnect() {
    if (status === "lobby" || status === "playing") reconnecting = true;
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
    if (document.visibilityState === "hidden") rememberOnLeave();
    if (document.visibilityState !== "visible" || status !== "lobby") return;
    if (socket.connected) resumeSeat();
    else socket.connect();
  }

  function handleRoomCreated({ code }) {
    roomCode = code;
    status = "lobby";
    rememberRoom({ code, gameId: GAME_ID });
  }

  function handleJoinedLobby({ code }) {
    roomCode = code;
    status = "lobby";
    rememberRoom({ code, gameId: GAME_ID });
  }

  function handleLobby(view) {
    const before = lobby;
    lobby = view;
    roomCode = view.code;
    if (view.phase === "lobby" && status === "joining") status = "lobby";
    if (view.phase === "lobby" && status === "lobby") rememberRoom({ code: view.code, gameId: GAME_ID });
    if (view.phase === "lobby" && status === "ended") {
      status = "lobby";
      game = null;
      rememberRoom({ code: view.code, gameId: GAME_ID });
      say(t("guessWord.backInLobby"), 5000);
      return;
    }
    const wasHost = before?.players[before.you]?.host === true;
    if (status === "lobby" && before && !wasHost && view.players[view.you]?.host) {
      say(t("guessWord.nowHost"), 6000);
    }
  }

  // A code from another game's room is refused by the server as room-not-found.
  function handleJoinError(refusal) {
    forgetRoom();
    joinError = serverMessage("join", refusal);
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
    // A match cannot be resumed; remembered only to say why a reload lands on the menu.
    if (roomCode) rememberRoom({ code: roomCode, gameId: GAME_ID, phase: "playing" });
    say("");
  }

  // The most greens in any one row of a duel board.
  const bestGreens = (board) => Math.max(0, ...(board?.rows ?? []).map((r) => r.colors.filter((c) => c === "correct").length));

  // A duel's state: no rounds, one board per seat.
  function handleDuelState(before, state) {
    const triesBefore = isDuel(before) ? (before.boards[playerIndex]?.tries ?? 0) : 0;
    if (!isDuel(before) || (state.boards[playerIndex]?.tries ?? 0) > triesBefore) {
      guess = emptyGuess(0);
      pending = false;
    }
    // The opponent placed a new letter right: worth a word, but never the letter.
    const rival = opponentOf(state, playerIndex);
    if (isDuel(before) && !state.winners && bestGreens(state.boards[rival]) > bestGreens(before.boards[rival])) {
      say(t("guessWord.duel.greenAlert", { name: seats[rival]?.name ?? t("common.someone") }), 2500);
    }
    if (state.winners) {
      status = "ended";
      confirmLeave = false;
    }
  }

  function handleState(state) {
    const before = game;
    game = state;
    if (typeof state.serverNow === "number") offset = state.serverNow - Date.now();
    if (Array.isArray(state.players)) seats = state.players;
    if (isDuel(state)) return handleDuelState(before, state);

    const round = state.round;
    const newRound = !before?.round || before.round.number !== round.number;
    if (newRound || round.phase !== "guessing") {
      guess = emptyGuess(0);
      pending = false;
      chooseError = "";
    }
    const triesBefore = before?.round?.number === round.number ? (before.round.players[playerIndex]?.tries ?? 0) : 0;
    if ((round.players[playerIndex]?.tries ?? 0) > triesBefore) {
      guess = emptyGuess(0);
      pending = false;
    }

    // The chooser left: the round was called off and the next one started.
    if (before?.history && state.history.length > before.history.length) {
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

  // The last kind of move sent, to tell what a refusal answers.
  let lastMove = null;

  function handleMoveRejected(refusal) {
    // "I have seen the scores" arriving after the round moved on: nothing to say.
    if (lastMove === "next") return;
    const message = serverMessage("move", refusal);
    pending = false;
    if (game?.round?.phase === "choosing" && game.round.chooser === playerIndex) {
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

  // ?diag=1 only (DG-130): the socket's side of the diagnostics log.
  let droppedAt = null;
  const diagListeners = {
    connect: () => {
      diagLog("connect", droppedAt ? `${Math.round((Date.now() - droppedAt) / 1000)} s depois da queda` : "");
      droppedAt = null;
    },
    disconnect: (reason) => {
      droppedAt = Date.now();
      diagLog("disconnect", reason);
    },
    connect_error: (err) => diagLog("connect_error", err?.message ?? ""),
  };

  $effect(() => {
    if (diagActive) diagLog("status", status);
  });

  onMount(() => {
    for (const [event, handler] of Object.entries(listeners)) socket.on(event, handler);
    if (diagActive) for (const [event, handler] of Object.entries(diagListeners)) socket.on(event, handler);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", rememberOnLeave);
    window.addEventListener("keydown", handleKeydown);
    socket.connect();
    const slowTimer = setTimeout(() => {
      if (status === "connecting") slowServer = true;
    }, 4000);
    return () => clearTimeout(slowTimer);
  });

  // Runs when the game screen is taken down, never on a reload or when the tab
  // is discarded: a reload must not send leaveRoom, or the seat would be gone
  // before the new page asks for it back.
  onDestroy(() => {
    // Leaving the game screen gives the seat up at once.
    if (socket.connected && (status === "lobby" || status === "playing" || status === "ended")) socket.emit("leaveRoom");
    forgetRoom();
    for (const [event, handler] of Object.entries(listeners)) socket.off(event, handler);
    for (const [event, handler] of Object.entries(diagListeners)) socket.off(event, handler);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", rememberOnLeave);
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

  async function createRoom() {
    const name = await ensureName();
    if (!name) return;
    joinError = "";
    socket.emit("createRoom", { gameId: GAME_ID, name });
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
    forgetRoom();
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

  // Leave goes back to the landing page. Leaving a live match takes the player
  // out of it, so it takes a second tap.
  function handleBack() {
    if (status === "playing" && !confirmLeave) {
      confirmLeave = true;
      setTimeout(() => (confirmLeave = false), 3500);
      return;
    }
    leaveRoom();
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
    lastMove = "guess";
    socket.emit("move", { type: "guess", word });
  }

  function selectGuessCell(index) {
    if (canGuess) guess = selectCell(typing, index);
  }

  function choose(word) {
    chooseError = "";
    lastMove = "choose";
    socket.emit("move", { type: "choose", word });
  }

  function moveOn() {
    lastMove = "next";
    socket.emit("move", { type: "next" });
  }

  const inRoom = $derived(status === "lobby" || status === "playing" || status === "ended" || status === "joining");
  const inMatch = $derived((status === "playing" || status === "ended") && game !== null);
  // A duel has no rounds: one word, one board per seat (duel.js).
  const duel = $derived(isDuel(game));
  const round = $derived(game?.round ?? null);
  const amChooser = $derived(round?.chooser === playerIndex);
  const mine = $derived((duel ? game.boards[playerIndex] : round?.players[playerIndex]) ?? { tries: 0, rows: [] });
  const rival = $derived(duel ? game.boards[opponentOf(game, playerIndex)] : null);
  const wordLength = $derived((duel ? game.length : round?.length) ?? 5);
  const typing = $derived(fitGuess(guess, wordLength));
  // The room's limit of tries, or null for no limit (DG-150).
  const limit = $derived(triesLimit(game));
  const myTriesLeft = $derived(triesLeft(limit, mine.tries));
  const canGuess = $derived(
    status === "playing" &&
      myTriesLeft !== 0 &&
      !pending &&
      (duel ? !game.winners : round?.phase === "guessing" && !amChooser)
  );
  const keyStates = $derived(letterStates(mine.rows));
  // The keys show a new row's colours only once its tiles have turned over.
  // Compared as text, so the many states other players' moves bring do not
  // restart the wait.
  const keySignature = $derived(JSON.stringify(keyStates));
  const myRowCount = $derived(mine.rows.length);
  let shownKeyStates = $state({});
  let shownRowCount = 0;
  const calm = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  $effect(() => {
    const next = JSON.parse(keySignature);
    const count = myRowCount;
    if (calm || count <= shownRowCount) {
      shownKeyStates = next;
      shownRowCount = count;
      return;
    }
    const timer = setTimeout(() => {
      shownKeyStates = next;
      shownRowCount = count;
    }, revealDelay(wordLength));
    return () => clearTimeout(timer);
  });
  const phaseSeconds = $derived(
    duel
      ? (game.roundTime ?? 120)
      : round?.phase === "choosing"
      ? CHOOSE_SECONDS
      : round?.phase === "reveal"
        ? round.endsAt && round.startedAt
          ? Math.round((round.endsAt - round.startedAt) / 1000)
          : REVEAL_FALLBACK_SECONDS
        : (game?.roundTime ?? 120)
  );

  const statusText = $derived.by(() => {
    if (duel) return game.winners ? duelHeadline(game, seats, playerIndex).title : duelStatus(game, seats, playerIndex);
    if (!round) return "";
    if (round.phase === "reveal" || round.phase === "over") return round.outcome ? outcomeText(game, seats, playerIndex) : "";
    if (round.phase !== "guessing") return "";
    if (amChooser) return t("guessWord.round.watching", { word: round.word ?? "" }) + (round.drawn ? ` ${t("guessWord.round.drawn")}` : "");
    if (myTriesLeft === 0) return t("guessWord.round.noTries");
    const turn = t("guessWord.round.yourTurn", { length: wordLength });
    return myTriesLeft === null ? turn : `${turn} ${t("guessWord.round.triesLeft", { count: myTriesLeft })}`;
  });

  // A locked phone suspends the page and drops the connection, so keep the screen on in the room and in a match.
  $effect(() => {
    if (status !== "lobby" && status !== "playing") return;
    keepScreenAwake();
    return allowScreenSleep;
  });
</script>

<main class="screen" class:in-game={inMatch}>
  {#if inRoom}
    <header class="topbar">
      <button
        class="btn btn-ghost back"
        class:btn-danger={confirmLeave}
        onclick={handleBack}
        aria-label={confirmLeave ? t("guessWord.leaveMatchAria") : t("guessWord.leaveAria")}
      >
        <ArrowLeft size={18} weight="light" aria-hidden="true" />
        <span>{confirmLeave ? t("guessWord.leaveMatch") : t("guessWord.leave")}</span>
      </button>
      {#if inMatch && duel}
        <span class="round-label">{t("guessWord.duel.label")}</span>
        {#if game.endsAt}<Timer endsAt={game.endsAt} {offset} total={phaseSeconds} />{/if}
      {:else if inMatch && round && round.phase !== "over"}
        <span class="round-label">{t("guessWord.round.label", { n: round.number, total: game.rounds })}</span>
        <Timer endsAt={round.endsAt} {offset} total={phaseSeconds} />
      {:else if inRoom}
        <span class="game-name" translate="no">{t("guessWord.name")}</span>
      {/if}
    </header>
  {/if}

  {#if status === "menu" || status === "connecting"}
    <GameLanding
      gameId={GAME_ID}
      eyebrow={t("guessWord.eyebrow")}
      title={t("guessWord.name")}
      lede={t("guessWord.lede")}
      steps={tList("guessWord.steps")}
      connecting={status === "connecting"}
      {slowServer}
      bind:joinError
      bind:showJoinForm
      onCreate={createRoom}
      onJoin={sendJoin}
      {playerName}
      onEditName={editName}
    >
      {#snippet art()}<Preview />{/snippet}
    </GameLanding>
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
  {:else if inMatch && duel}
    <section class="match duel">
      <p class="status-line match-status" class:highlight={canGuess} class:error={moveError} role="status" aria-live="polite">
        {moveError || (reconnecting ? t("common.reconnecting") : notice || statusText)}
      </p>
      <div class="duel-boards">
        <div class="duel-rival">
          <OpponentBoard
            rows={rival?.rows ?? []}
            length={wordLength}
            rowCount={game.maxTries}
            name={seats[rival?.index]?.name ?? t("common.someone")}
            color={seats[rival?.index]?.color ?? 2}
            tries={rival?.tries ?? 0}
            maxTries={game.maxTries}
          />
        </div>
        <div class="duel-mine">
          <p class="duel-you">{t("guessWord.duel.you")}</p>
          <Board
            rows={mine.rows}
            length={wordLength}
            guess={typing}
            rowCount={game.maxTries}
            active={!game.winners && myTriesLeft !== 0}
            {shake}
            onSelect={selectGuessCell}
          />
        </div>
      </div>
      <Keyboard states={shownKeyStates} disabled={!canGuess} onKey={pressKey} />
    </section>
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
          rowCount={rowsShown(limit, mine.tries, round.phase === "guessing" && myTriesLeft !== 0)}
          active={round.phase === "guessing" && myTriesLeft !== 0}
          {shake}
          onSelect={selectGuessCell}
        />
        <Keyboard states={shownKeyStates} disabled={!canGuess} onKey={pressKey} />
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
    <RoundScore view={game} players={seats} me={playerIndex} {offset} onNext={moveOn} />
  {/key}
{/if}

{#if status === "ended" && game?.winners}
  <ResultSheet
    id="guess-word"
    head={duel ? duelHeadline(game, seats, playerIndex) : headline(game, seats, playerIndex)}
    rows={duel ? duelRows(game, seats) : ranking(game, seats)}
    vote={rematchVote(seats, playerIndex)}
    me={playerIndex}
    onPlayAgain={() => socket.emit("playAgain")}
    onBackToLobby={() => socket.emit("backToLobby")}
    onMenu={leaveRoom}
  />
{/if}

{#if diagActive}
  <DiagPanel />
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

  /* ---- Duel: the opponent's board and yours ----
     Phones: the opponent's smaller, on top; yours under it, then the keyboard.
     Wide screens: side by side, the same size. Each board sizes its tiles by
     the space it is given (size containers in Board and OpponentBoard). */
  .match.duel {
    max-width: 980px;
  }

  .duel-boards {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    display: grid;
    grid-template-rows: minmax(0, 2fr) minmax(0, 5fr);
    gap: 0.6rem;
  }

  .duel-rival,
  .duel-mine {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .duel-you {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-muted);
  }

  /* On a phone the opponent's name sits on the board's line, to save height. */
  @media (max-width: 719px) {
    .duel-you {
      display: none;
    }
  }

  @media (min-width: 720px) {
    .duel-boards {
      grid-template-rows: minmax(0, 1fr);
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.5rem;
    }
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
