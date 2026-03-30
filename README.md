# VS - Scraper de filmes, series e canais 🎬

Aplicativo desktop com Electron + React para pesquisar e abrir conteudos de multiplos provedores em uma interface unica.

O projeto combina:

- Frontend em React (renderer)
- Backend local em Express para agregacao e proxy de dados
- Scrapers e integracoes por provedor

## Funcionalidades ✨

- 📚 Listagem de catalogo por provedor
- 🔎 Busca por titulo/provedor
- 🪟 Abertura de player em nova janela/aba
- ⌨️ Navegacao por teclado nos cards
- 🖼️ Proxy de imagens para reduzir bloqueios de hotlink e 403
- 🧩 Suporte atual a:
	- Pobreflix
	- AnimeFire
	- Rei dos Canais
	- Pomfy

## Tecnologias 🛠️

- Electron Forge
- React
- Vite
- Node.js
- Express
- Axios
- Cheerio

## Estrutura do projeto 🗂️

```text
.
|- src/
|  |- container/            # componentes React
|  |- server/               # clientes/scrapers por provedor
|  |- server.js             # API local (Express)
|  |- renderer.jsx          # entrada do frontend
|  |- main.js               # processo principal Electron
|  |- preload.js            # preload do Electron
|- package.json
```

## Pre-requisitos 📋

- Node.js 18+
- npm

## Instalacao 🚀

```bash
npm install
```

## Como executar ▶️

Este projeto usa dois processos:

1. API local (backend)
2. Aplicativo Electron (frontend desktop)

Inicie em dois terminais separados na raiz do projeto:

Terminal 1 (API local):

```bash
node src/server.js
```

Terminal 2 (Electron):

```bash
npm start
```

Depois disso, o app abre em janela desktop e consome a API local em http://localhost:3000.

## Como usar 🧭

1. Selecione um provedor.
2. Navegue pelos cards da listagem.
3. Use a busca para filtrar por titulo.
4. Clique no card para abrir opcoes de reproducao.
5. Escolha o servidor/opcão para abrir o conteudo em nova janela/aba.

### Atalhos de teclado (listagem) ⌨️

- Setas direcionais: mover selecao entre cards
- Enter ou Espaco: abrir item selecionado

## Endpoints principais da API local 🌐

- `GET /api/provedores`
- `GET /api/filmes/:provider/:page`
- `GET /api/search/:provider/:query`
- `GET /api/video/:provider/:videoId`
- `GET /api/eps/:provider/:episodeUrl`
- `GET /api/image?url=...`

## Build e distribuicao 📦

```bash
npm run package
npm run make
```

## Possiveis problemas 🧯

- Porta 3000 ocupada: altere a porta em `src/server.js`.
- Erros de scraping: os provedores podem mudar HTML/rotas sem aviso.
- Falha ao carregar imagem: verifique se a rota `/api/image` esta ativa.

## Aviso ⚠️

O projeto depende de fontes externas de terceiros. Como esses provedores podem mudar, alguns fluxos podem quebrar sem alterações no codigo local.

## Licenca 📄

MIT
