const express = require('express');
const cors = require('cors');
const prov = require('./provedores.json');
const { default: axios } = require('axios');

const app = express();
const port = 3000;

app.use(cors());

const AnimeFireClient = require('./server/AnimeFire');
const PobreflixClient = require('./server/Pobreflix');
const PomfyClient = require('./server/Pomfy');
const SteamVerdeClient = require("./server/StreamVerde");


const scarperAnimeFire = new AnimeFireClient();
const scarperPobreflix = new PobreflixClient();
const scarperPomfy = new PomfyClient();
const scarperSteamVerde = new SteamVerdeClient();

const externalRequestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json,text/plain,*/*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://api.reidoscanais.ooo/'
};

const sendProviderError = (res, error, providerName) => {
    const upstreamStatus = error?.response?.status;
    const upstreamMessage = error?.response?.statusText || error?.message || 'Unknown upstream error';

    if (upstreamStatus) {
        return res.status(upstreamStatus).json({
            error: `${providerName} returned ${upstreamStatus}`,
            details: upstreamMessage
        });
    }

    return res.status(500).json({ error: 'An error occurred', details: upstreamMessage });
};

const extractChannelsArray = (payload) => {
    const visited = new Set();

    const findArray = (value) => {
        if (Array.isArray(value)) return value;
        if (!value || typeof value !== 'object') return null;
        if (visited.has(value)) return null;
        visited.add(value);

        if (Array.isArray(value.channels)) return value.channels;
        if (Array.isArray(value.data)) return value.data;
        if (Array.isArray(value.items)) return value.items;
        if (Array.isArray(value.results)) return value.results;

        for (const nested of Object.values(value)) {
            const found = findArray(nested);
            if (Array.isArray(found)) return found;
        }

        return null;
    };

    return findArray(payload) || [];
};

const toReiDosCanaisItem = (channel) => ({
    nome: channel?.name ?? channel?.id ?? null,
    ano: null,
    tempo: null,
    capa: channel?.logo_url ?? null,
    capa_audio: null,
    capa_quali: null,
    url: channel?.embed_url ?? null,
    provedor: 'reidoscanais'
});

// Search route
app.get('/api/search/:provider/:query', async (req, res) => {
    try {
        const searchQuery = req.params.query;
        const provider = req.params.provider;

        if (provider === 'animefire') {
            const results = await scarperAnimeFire.searchAnime(searchQuery);
            res.json({ results });scarperPobreflix
        } else if (provider === 'pobreflix') {
            const results = await pesquisa(searchQuery);
            res.json({ results });
        } else if (provider === 'reidoscanais') {
            const response = await axios.get(`https://api.reidoscanais.ooo/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: externalRequestHeaders
            });
            const channels = extractChannelsArray(response.data);
            const results = channels.map(toReiDosCanaisItem);
            res.json({ results });
        } else if (provider == "streamverde") {
            const results = await scarperSteamVerde.pesquisa(searchQuery);
            res.json({ results });
        } else if (provider === 'pomfy') {
            const options = {
                method: 'GET',
                url: 'https://api.themoviedb.org/3/search/movie',
                params: { query: `${searchQuery}`, include_adult: 'false', language: 'pt-BR', page: '1' },
                headers: {
                    accept: 'application/json',
                    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NTVjYTdhNTM4MjA0NTBmMjM5Y2E1YmYxMDQ1ODJjNCIsIm5iZiI6MTc1MjY4Njg3NS41OTcsInN1YiI6IjY4NzdlMTFiYzZlZjc3ZGJkMTQzZDNjOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H7orvOjrk5A9XbrMrRc_mmwZ0ylPReyGoQPQCDdH4pE'
                }
            };

            axios
                .request(options)
                .then(resp => {
                    console.log('Resultados da busca Pomfy:', resp.data?.results);
                    res.json({ results: resp.data })
                })
                .catch(err => {
                    console.error('Error fetching Pomfy search data:', err);
                    res.status(500).json({ error: 'Failed to fetch data from Pomfy' });
                });
        }
    } catch (error) {
        console.error('Error in /api/search:', error?.message || error);
        sendProviderError(res, error, 'Provider');
    }
});

// Video route
app.get('/api/video/:provider/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const provider = req.params.provider;

        if (provider === 'animefire') {
            const videoResults = await scarperAnimeFire.getEpisodeStreamURL(videoId);
            res.json({ videoResults });
            return;
        } else if (provider === 'pobreflix') {
            const videoResults = await scarperPobreflix.video(videoId);
            res.json({ videoResults });
            return;
        }
        if (provider === 'pomfy') {
            const videoResults = await scarperPomfy.filme(videoId);
            res.json({ videoResults });
            return;
        }
        if (provider === 'streamverde') {
            const videoResults = await scarperSteamVerde.video(videoId);
            return res.json({ videoResults });
        }
        res.json({ videoResults });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.get('/api/filmes/:provider/:page', async (req, res) => {
    try {
        const page = req.params.page || 1;
        const provider = req.params.provider;

        if (provider === 'animefire') {
            const filmesResults = await scarperAnimeFire.TopAnimes(page);
            res.json({ filmesResults });
            return;
        } else if (provider === 'pobreflix') {
            const filmesResults = await scarperPobreflix.filmes(page);
            res.json({ filmesResults });
        } else if (provider === 'reidoscanais') {
            const response = await axios.get('https://api.reidoscanais.ooo/channels', {
                headers: externalRequestHeaders
            });
            const channels = extractChannelsArray(response.data);
            const filmesResults = channels.map(toReiDosCanaisItem);
            res.json({ filmesResults });
        } else if (provider == "streamverde") {
            const filmesResults = await scarperSteamVerde.canais();
            res.json({ filmesResults });
        } else if (provider === 'pomfy') {
            const options = {
                method: 'GET',
                url: 'https://api.themoviedb.org/3/discover/movie',
                params: {
                    include_adult: 'false',
                    include_video: 'false',
                    language: 'pt-BR',
                    page: `${page}`,
                    sort_by: 'popularity.desc'
                },
                headers: {
                    accept: 'application/json',
                    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NTVjYTdhNTM4MjA0NTBmMjM5Y2E1YmYxMDQ1ODJjNCIsIm5iZiI6MTc1MjY4Njg3NS41OTcsInN1YiI6IjY4NzdlMTFiYzZlZjc3ZGJkMTQzZDNjOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H7orvOjrk5A9XbrMrRc_mmwZ0ylPReyGoQPQCDdH4pE'
                }
            };

            axios
                .request(options)
                .then(resp => res.json({ filmesResults: resp.data }))
                .catch(err => {
                    console.error('Error fetching Pomfy data:', err);
                    res.status(500).json({ error: 'Failed to fetch data from Pomfy' });
                });
        }
    } catch (error) {
        console.error('Error in /api/filmes:', error?.message || error);
        sendProviderError(res, error, 'Provider');
    }
});
app.get('/api/eps/:provider/:episodeUrl', async (req, res) => {
    try {
        const episodeUrl = req.params.episodeUrl; // URL do episódio
        const provider = req.params.provider;
        if (provider === 'animefire') {
            const epsResults = await scarperAnimeFire.getEpisodes(episodeUrl);
            res.json({ epsResults });
            return;
        } else if (provider === 'pobreflix') {
            const epsResults = await scarperPobreflix.video(episodeUrl);
            res.json({ epsResults });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});
app.get('/api/provedores', async (req, res) => {
    res.json(prov);
});

app.get('/api/image', async (req, res) => {
    try {
        const imageUrl = req.query.url;

        if (!imageUrl || typeof imageUrl !== 'string') {
            return res.status(400).json({ error: 'Missing image url' });
        }

        const parsedUrl = new URL(imageUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).json({ error: 'Invalid image protocol' });
        }

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                ...externalRequestHeaders,
                Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`
            },
            timeout: 15000
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(response.data));
    } catch (error) {
        const upstreamStatus = error?.response?.status;
        console.error('Error in /api/image:', error?.message || error);
        return res.status(upstreamStatus || 502).json({ error: 'Failed to load image' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
