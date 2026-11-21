// Adivinha Palavra's own texts, in Brazilian Portuguese, added over the shared
// ones from arcade-hub-ui (registerMessages in main.js).

export default {
  meta: {
    description: "Adivinha Palavra: um Wordle em grupo para 2 a 5 jogadores. Um escolhe a palavra secreta e os outros correm para adivinhar. Sem cadastro: mande o código da sala e jogue.",
  },

  guessWord: {
    name: "Adivinha Palavra",
    leave: "Sair",
    leaveAria: "Sair da sala e voltar para o início",
    // "How to play" on the landing page, read with tList().
    steps: [
      { title: "Crie a sala e mande o link", text: "De 2 a 5 jogadores. Na sala de espera, o anfitrião escolhe o tempo de cada rodada, o tamanho máximo da palavra e as tentativas." },
      { title: "Um jogador escolhe a palavra secreta", text: "A cada rodada escolhe uma pessoa diferente. Todo mundo escolhe uma vez, numa ordem sorteada no começo." },
      { title: "Os outros tentam adivinhar", text: "Seis tentativas para cada um. Verde é letra certa no lugar certo, amarelo é letra que está em outro lugar, cinza é letra que não está na palavra." },
      { title: "Cada tentativa conta", text: "Quem acerta com menos tentativas marca mais, e quem escolheu marca a cada tentativa que a palavra leva. Vence quem somar mais pontos." },
    ],
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
      maxLetters: "Máximo de letras",
      maxLettersPick: "Letras",
      maxLettersAria: "Número máximo de letras da palavra",
      limitOn: "Limitar letras",
      noLimit: "Sem limite",
      upTo: "Até {count} letras",
      maxTries: "Tentativas por rodada",
      maxTriesPick: "Tentativas",
      maxTriesAria: "Tentativas de cada jogador por rodada",
      limitTriesOn: "Limitar tentativas",
      upToTries: "Até {count} tentativas",
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
      enter: "ENTER",
      backspace: "Apagar",
      yourBoard: "Suas tentativas",
      others: "Outros jogadores",
      progress: "{name}: {count} de 6 tentativas",
      cellEmpty: "Casa {n} de {total}, vazia",
      cellLetter: "Casa {n} de {total}, letra {letter}",
    },

    // O que uma tecla colorida diz para o leitor de tela.
    keyState: {
      correct: "{letter}, certa",
      present: "{letter}, em outro lugar",
      absent: "{letter}, não está na palavra",
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
      // O botão para seguir: todo mundo toca, ou o tempo acaba.
      chooseWord: "Escolher a Palavra",
      nextRound: "Próxima Rodada",
      seeResults: "Ver Resultado",
      waiting: "Esperando os outros · {n} de {m}",
    },

    // De onde vieram os pontos de cada jogador, um motivo por item (round.breakdown).
    breakdown: {
      solved: "Acertou +{points}",
      triesLeft: { one: "1 tentativa sobrando +{points}", other: "{count} tentativas sobrando +{points}" },
      green: { one: "1 verde +{points}", other: "{count} verdes +{points}" },
      yellow: { one: "1 amarela +{points}", other: "{count} amarelas +{points}" },
      // As tentativas que a palavra levou, com ou sem acerto.
      chooserTries: "Tentativas: {count} +{points}",
    },

    // A legenda embaixo do placar; os números vêm do servidor (scoring).
    scoring: {
      title: "Como a pontuação funciona",
      solver: "Quem acerta: {solved}, mais {perTryLeft} por tentativa que sobrou.",
      others: "Quem não acerta: {green} por letra verde e {yellow} por amarela, da melhor linha.",
      chooser: "Quem escolheu a palavra: {chooserPerTry} por tentativa até a palavra sair, com ou sem acerto. Se ninguém acertar, conta quem mais tentou.",
    },

    result: {
      pointsOf: "{score} pontos.",
    },
  },
};

