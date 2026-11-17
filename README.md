# adivinha-palavra-front

Adivinha Palavra (Guess Word em inglês) é um site independente: um Wordle em grupo para 2 a 5 jogadores. A cada rodada um jogador escolhe a palavra secreta e os outros correm para adivinhar em seis tentativas. Todos escolhem uma vez; ganha quem somar mais pontos.

Este repositório é só o site do jogo. O servidor é o [arcade-hub-back](https://github.com/Gabryelryba/arcade-hub-back) (id do jogo: `guess-word`), compartilhado com os outros jogos. O código comum (componentes, socket, i18n, estilos) vem do pacote [arcade-hub-ui](https://github.com/Gabryelryba/arcade-hub-ui).

## Stack

- [Svelte 5](https://svelte.dev/) + [Vite](https://vitejs.dev/)
- [socket.io-client](https://socket.io/) para a sincronização com o backend
- `arcade-hub-ui` como dependência git com tag fixa
- [Vitest](https://vitest.dev/) para os testes

## Rodar localmente

```bash
npm install
npm run dev
```

O `npm install` baixa o `arcade-hub-ui` do GitHub. O repositório é público, então não precisa de login nem de token.

Precisa do [arcade-hub-back](https://github.com/Gabryelryba/arcade-hub-back) rodando (padrão `http://localhost:3001`; troque com `VITE_SERVER_URL`, veja `.env.example`).

## Estrutura

- `src/main.js`: registra os textos do jogo e monta a página (`GameApp` do `arcade-hub-ui`) com o jogo
- `src/guess-word/`: o jogo
- `src/i18n.js`: textos próprios do jogo, em português e inglês

## Outros comandos

```bash
npm test         # testes (Vitest)
npm run build    # build de produção em dist/
npm run preview  # serve o build
```

## Landing page

A primeira tela do site é a landing page do jogo (`GameLanding` do `arcade-hub-ui`): o nome, a chamada e o tabuleiro animado (`Preview.svelte`), **Criar Sala**, **Entrar com Código** e a seção "Como jogar". Os passos de "Como jogar" ficam em `guessWord.steps` no `src/i18n.js`, nos dois idiomas.

Não existe mais o hub Recreio: o site não leva a outros jogos, e sair de uma sala ou partida volta para a landing page. Um código de sala de outro jogo é recusado pelo servidor como sala inexistente.

## Endereço

Produção: https://adivinha-palavra.onrender.com. Convites são `https://adivinha-palavra.onrender.com/?code=ABCDE`.

## Deploy (Render)

Static site no plano gratuito, descrito no `render.yaml` (Blueprint). O serviço se chama `adivinha-palavra`, sem o sufixo `-front` do repositório, porque o nome do serviço define o endereço.

1. No Render: New → Blueprint e escolha este repositório. O app do Render no GitHub precisa ter acesso a ele.
2. Confira o endereço gerado. Tem que ser exatamente `https://adivinha-palavra.onrender.com`. Se o Render acrescentar um sufixo (`adivinha-palavra-xxxx`), apague o serviço e crie de novo com o nome `adivinha-palavra-jogo`. Nesse caso, atualize o `CORS_ORIGIN` do `arcade-hub-back`.
3. A origem do site precisa estar no `CORS_ORIGIN` do `arcade-hub-back`.

O build roda `npm ci && npm run build` com `VITE_SERVER_URL=https://arcade-hub-back.onrender.com` e publica `dist/`. Cada push no `main` gera um novo deploy.
