# VS - Scraper de filmes, series e canais 🎬

Aplicativo desktop com Electron + React para pesquisar e abrir conteúdos de múltiplos provedores em uma interface única.

O projeto combina:

- Frontend em React (renderer)
- Backend local em Express para agregação e proxy de dados
- Scrapers e integrações por provedor

## Funcionalidades ✨

- 📚 Listagem de catálogo por provedor
- 🔎 Busca por título/provedor
- 🪟 Abertura de player em nova janela/aba
- ⌨️ Navegação por teclado nos cards
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
|  |- server/               # clientes e scrapers por provedor
|  |- server.js             # API local (Express)
|  |- renderer.jsx          # entrada do frontend
|  |- main.js               # processo principal Electron
|  |- preload.js            # preload do Electron
|- package.json
```

## Pré-requisitos 📋

- Node.js 18+
- npm

## Instalação 🚀

```bash
npm install
```

## Como executar ▶️

Este projeto usa dois processos:

1. API local (backend)
2. Aplicativo Electron (frontend desktop)

Inicie qualquer um que você preferir.

Terminal 1 (API local, só o backend sem a interface do Electron):

```bash
node src/server.js
```

Terminal 2 (Electron, inicia ambos, interface e backend):

```bash
npm start
```

Depois disso, o app abre em janela desktop e consome a API local em http://localhost:3000.

## Como usar 🧭

1. Selecione um provedor.
2. Navegue pelos cards da listagem.
3. Use a busca para filtrar por título.
4. Clique no card para abrir opções de reprodução.
5. Escolha o servidor/opção para abrir o conteúdo em nova janela/aba.

### Atalhos de teclado (listagem) ⌨️

- Setas direcionais: mover seleção entre cards
- Enter ou Espaco: abrir item selecionado

## Endpoints principais da API local 🌐

- `GET /api/provedores`
- `GET /api/filmes/:provider/:page`
- `GET /api/search/:provider/:query`
- `GET /api/video/:provider/:videoId`
- `GET /api/eps/:provider/:episodeUrl`
- `GET /api/image?url=...`

## Build e distribuição 📦

```bash
npm run package
npm run make
```

## Possíveis problemas 🧯

- Porta 3000 ocupada: altere a porta em `src/server.js`.
- Erros de scraping: os provedores podem mudar HTML/rotas sem aviso.
- Falha ao carregar imagem: verifique se a rota `/api/image` esta ativa.

## Aviso ⚠️

O projeto depende de fontes externas de terceiros. Como esses provedores podem mudar, alguns fluxos podem quebrar sem alterações no codigo local.

## Licenca 📄

MIT
