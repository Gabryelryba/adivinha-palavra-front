// Adivinha Palavra's own texts, added over the shared ones from arcade-hub-ui
// (registerMessages in main.js). Keys must match in both languages: see
// i18n.test.js.

const en = {
  meta: {
    description: "Guess Word: a group Wordle for 2 to 5 players. One player picks a secret word, the others race to guess it. No account: share a room code and play.",
  },

  guessWord: {
    eyebrow: "Group Wordle · 2 to 5 players",
    lede: "Each round one player picks a secret word and everyone else races to guess it, six tries each. The first right guess ends the round. Everyone picks once; the most points wins.",
    leaveMatch: "Leave the Match?",
    leaveMatchAria: "Leave the match: tap again to confirm",
    openingRoom: "Opening a room…",
    starting: "The match is starting…",
    droppedOut: "Your connection dropped, so you left the match.",
    connectionLost: "The connection dropped. Join the room again with its code.",
    seatExpired: "Your seat in the room expired. Join again with the code.",
    backInLobby: "Back in the waiting room. Get ready for the next match.",
    nowHost: "The room’s creator left. You are the host now.",
    playerLeft: "{name} left the match.",
    roundCancelled: "Round called off: {name} left.",
    notEnough: "Not enough players left, so the match is over.",

    lobby: {
      roundTime: "Round time",
      roundTimeAria: "Time to guess each word",
      minutes: "{count} min",
      language: "Word language",
      languageAria: "Language of the words",
      maxLetters: "Longest word",
      maxLettersPick: "Letters",
      maxLettersAria: "Longest word a player may choose",
      limitOn: "Limit letters",
      noLimit: "No limit",
      upTo: "Up to {count} letters",
      languages: {
        pt: "Português",
        en: "English",
      },
    },

    choose: {
      title: "Pick a Word",
      help: "4 to {max} letters, from the dictionary. The others get 6 tries each.",
      helpExact: "Exactly 4 letters, from the dictionary. The others get 6 tries each.",
      label: "Secret word",
      placeholder: "Your word",
      confirm: "Confirm",
      drawNote: "If time runs out, the game picks a word for you.",
      length: "Use 4 to {max} letters.",
      lengthExact: "Use exactly 4 letters.",
      choosing: "{name} is picking the word…",
      nextUp: "Next to pick: {names}",
      lastRound: "This is the last round.",
    },

    round: {
      label: "Round {n} of {total}",
      timeLeft: "{seconds} seconds left",
      yourTurn: "Guess the word: {length} letters.",
      triesLeft: { one: "{count} try left", other: "{count} tries left" },
      noTries: "No tries left. Watch the others.",
      watching: "Your word is {word}. Watch them guess.",
      drawn: "The game drew this word.",
      notEnoughLetters: "Not enough letters",
      solved: "{name} got it.",
      youSolved: "You got it.",
      keyboard: "Keyboard",
      enter: "Enter",
      backspace: "Delete",
      yourBoard: "Your guesses",
      others: "Other players",
      progress: "{name}: {count} of 6 tries",
      cellEmpty: "Cell {n} of {total}, empty",
      cellLetter: "Cell {n} of {total}, letter {letter}",
    },

    reveal: {
      kicker: "Round {n}",
      word: "The word was",
      solved: { one: "{name} guessed it on the first try.", other: "{name} guessed it in {count} tries." },
      timeUp: "Time ran out and nobody guessed it.",
      noTries: "Everyone ran out of tries.",
      picked: "picked the word",
      guessed: "guessed it",
      next: "{name} picks next · {seconds} s",
      youNext: "You pick next · {seconds} s",
      finalIn: "Final result in {seconds} s",
    },

    result: {
      pointsOf: "{score} points.",
    },
  },
};

const ptBR = {
  meta: {
    description: "Adivinha Palavra: um Wordle em grupo para 2 a 5 jogadores. Um escolhe a palavra secreta e os outros correm para adivinhar. Sem cadastro: mande o código da sala e jogue.",
  },

  guessWord: {
    eyebrow: "Wordle em grupo · 2 a 5 jogadores",
    lede: "A cada rodada, um jogador escolhe uma palavra secreta e os outros correm para adivinhar, com seis tentativas cada. O primeiro acerto encerra a rodada. Todo mundo escolhe uma vez; vence quem fizer mais pontos.",
    leaveMatch: "Sair da Partida?",
    leaveMatchAria: "Sair da partida: toque de novo para confirmar",
    openingRoom: "Abrindo uma sala…",
    starting: "A partida está começando…",
    droppedOut: "Sua conexão caiu, então você saiu da partida.",
    connectionLost: "A conexão caiu. Entre na sala de novo com o código.",
    seatExpired: "Seu lugar na sala expirou. Entre de novo com o código.",
    backInLobby: "De volta à sala de espera. Prepare-se para a próxima partida.",
    nowHost: "Quem criou a sala saiu. Agora você é o anfitrião.",
    playerLeft: "{name} saiu da partida.",
    roundCancelled: "Rodada cancelada: {name} saiu.",
    notEnough: "Não sobraram jogadores suficientes, então a partida acabou.",

    lobby: {
      roundTime: "Tempo da rodada",
      roundTimeAria: "Tempo para adivinhar cada palavra",
      minutes: "{count} min",
      language: "Idioma das palavras",
      languageAria: "Idioma das palavras",
      maxLetters: "Máximo de letras",
      maxLettersPick: "Letras",
      maxLettersAria: "Número máximo de letras da palavra",
      limitOn: "Limitar letras",
      noLimit: "Sem limite",
      upTo: "Até {count} letras",
      languages: {
        pt: "Português",
        en: "English",
      },
    },

    choose: {
      title: "Escolha uma Palavra",
      help: "De 4 a {max} letras, do dicionário. Os outros têm 6 tentativas cada.",
      helpExact: "Exatamente 4 letras, do dicionário. Os outros têm 6 tentativas cada.",
      label: "Palavra secreta",
      placeholder: "Sua palavra",
      confirm: "Confirmar",
      drawNote: "Se o tempo acabar, o jogo sorteia uma palavra para você.",
      length: "Use de 4 a {max} letras.",
      lengthExact: "Use exatamente 4 letras.",
      choosing: "{name} está escolhendo a palavra…",
      nextUp: "Próximos a escolher: {names}",
      lastRound: "Esta é a última rodada.",
    },

    round: {
      label: "Rodada {n} de {total}",
      timeLeft: "Faltam {seconds} segundos",
      yourTurn: "Adivinhe a palavra: {length} letras.",
      triesLeft: { one: "Resta {count} tentativa", other: "Restam {count} tentativas" },
      noTries: "Acabaram suas tentativas. Acompanhe os outros.",
      watching: "Sua palavra é {word}. Veja os outros tentando.",
      drawn: "O jogo sorteou esta palavra.",
      notEnoughLetters: "Faltam letras",
      solved: "{name} acertou.",
      youSolved: "Você acertou.",
      keyboard: "Teclado",
      enter: "Enter",
      backspace: "Apagar",
      yourBoard: "Suas tentativas",
      others: "Outros jogadores",
      progress: "{name}: {count} de 6 tentativas",
      cellEmpty: "Casa {n} de {total}, vazia",
      cellLetter: "Casa {n} de {total}, letra {letter}",
    },

    reveal: {
      kicker: "Rodada {n}",
      word: "A palavra era",
      solved: { one: "{name} acertou de primeira.", other: "{name} acertou em {count} tentativas." },
      timeUp: "O tempo acabou e ninguém acertou.",
      noTries: "Acabaram as tentativas de todo mundo.",
      picked: "escolheu a palavra",
      guessed: "acertou",
      next: "{name} escolhe a próxima · {seconds} s",
      youNext: "Você escolhe a próxima · {seconds} s",
      finalIn: "Resultado final em {seconds} s",
    },

    result: {
      pointsOf: "{score} pontos.",
    },
  },
};

export default { en, "pt-BR": ptBR };
