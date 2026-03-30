const axios = require('axios');
const cheerio = require('cheerio');

class AnimeFireClient {
    constructor() {
        this.baseURL = "https://animefire.io";
        this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        this.maxRetries = 2;
        this.retryDelay = 250;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getHeaders(){
        return {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': `${this.baseURL}/`
        };
    }
    isChallengePage($) {
        const title = $('title').text().toLowerCase();
        if (title.includes("Just a moment")) return true;
        if ($('#cf-wrapper').length > 0 || $('#challenge-form').length > 0) return true;

        const bodyText = $('body').text().toLowerCase();
        return bodyText.includes("cf-error") || bodyText.includes("cloudflare");
    }

    resolveURL(base, ref) {
        if (!ref) return "";
        if (ref.startsWith('http')) return ref;
        if (ref.startsWith('/')) return base + ref;
        return `${base}/${ref}`;
    }
    extractSearchResults($){
        const animes = []

        $(".row.ml-1.mr-1 a").each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const name = $el.text().trim();
            const imgURL = $el.find('img').attr('data-src') || $el.find('img').attr('src');
            if (href && name){
                animes.push({
                    name: name,
                    url: this.resolveURL(this.baseURL, href),
                    imgURL: imgURL,
                    provedor: 'animefire'
                });
            }
        });
        if (animes.length > 0) return animes;

        $("card_ani").each((i,el) => {
            const $el = $(el);
            const titleElem = $el.find(".ani_name a");
            const title = titleElem.text().trim();
            const link = titleElem.attr('href');
            const imgURL = $el.find(".div_img img").attr('src');

            if (link && title) {
                animes.push({
                    name: title,
                    url: this.resolveURL(this.baseURL, link),
                    imageURL: this.resolveURL(this.baseURL, imgURL),
                    provedor: 'animefire'
                });
            }
        });
        return animes;
    }

    async searchAnime(query){
        const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, '-');
        const searchURL = `${this.baseURL}/pesquisar/${normalizedQuery}`;

        let lastError = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++){
            try {
                const response = await axios.get(searchURL, {
                    headers:this.getHeaders(),
                    validateStatus: (status) => status === 200
                });

                const $ = cheerio.load(response.data);

                if (this.isChallengePage($)) {
                    throw new Error("Desafio do Cloudflare detectado (tente VPN ou aguarde)");
                }

                return this.extractSearchResults($);
            } catch (err) {
                lastError = err;

                if (err.response && err.response.status === 403) {
                    lastError = new Error("Acesso restrito: VPN pode ser necessária ou IP bloqueado.");
                }
                if (attempt < this.maxRetries) {
                    console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${this.retryDelay}ms...`);
                    await this.sleep(this.retryDelay);
                    continue;
                }
            }
        }
        throw lastError || new Error("Falha ao recuperar resultados do AnimeFire");
    }
    async getEpisodes(animeUrl) {
        try {
            const response = await axios.get(animeUrl, {
                headers: this.getHeaders(),
                validateStatus: (status) => status === 200
            });

            const $ = cheerio.load(response.data);
            const episodios = [];

            // 1. Pegamos o "slug" (nome limpo) do anime a partir da URL
            // Exemplo: de "https://animefire.io/animes/naruto", extraímos "naruto"
            const urlParts = animeUrl.split('/').filter(p => p.length > 0);
            const animeSlug = urlParts[urlParts.length - 1];

            // 2. Procuramos todos os links da página
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                let texto = $(el).text().trim();

                if (!href) return;

                // ESTRATÉGIA DE BUSCA:
                // Pode ser que o link tenha '/video/' OU
                // Pode ser que o link contenha o nome do anime e termine com um número (ex: /animes/naruto/1)
                const isVideoPattern = href.includes('/video/');
                const isEpisodePattern = href.includes(`/${animeSlug}/`) && href !== animeUrl && /\d+$/.test(href);
                const isClassPattern = $(el).hasClass('lEp'); // Classe CSS comum para episódios

                if (isVideoPattern || isEpisodePattern || isClassPattern) {
                    
                    // Se o texto estiver vazio, tentamos pegar de algum elemento interno (como um <span>)
                    if (texto === '') {
                        texto = $(el).text().trim() || `Episódio ${href.split('/').pop()}`;
                    }

                    const urlCompleta = this.resolveURL(this.baseURL, href);

                    // Verifica se o episódio já não foi adicionado (evita links duplicados na página)
                    const jaExiste = episodios.some(ep => ep.url === urlCompleta);
                    if (!jaExiste) {
                        episodios.push({
                            server: texto,
                            url: urlCompleta,
                            provedor: 'animefire'
                        });
                    }
                }
            });

            // Ocasionalmente os sites de animes invertem a ordem (mostram o mais recente primeiro).
            // Retornamos os episódios na ordem que foram encontrados.
            return episodios; 

        } catch (error) {
            throw new Error(`Falha ao buscar episódios: ${error.message}`);
        }
    }
    async getEpisodeStreamURL(episodeUrl) {
        try {
            const response = await axios.get(episodeUrl, {
                headers: this.getHeaders()
            });

            if (typeof response.data === 'object' && response.data.data) {
                console.log("A URL já retornou o Objeto com os vídeos diretamente!");
                return response.data; // Devolve o JSON intacto
            }
            const $ = cheerio.load(response.data);
            
            // ESTRATÉGIA 1: Buscar a API interna de vídeo do Animefire.
            // O site costuma ter um script ou um atributo 'data-video-url' apontando para um JSON.
            // Exemplo: Eles usam um elemento <video data-video-src="https://animefire.io/api/video/12345">
            let videoApiUrl = $('video').attr('src');

            if (!videoApiUrl) {
                // ESTRATÉGIA 2: Procurar dentro das tags <script> por algo parecido com a URL da API
                const scripts = $('script').text();
                const match = scripts.match(/https:\/\/animefire\.io\/api\/video\/[a-zA-Z0-9_-]+/);
                if (match) {
                    videoApiUrl = match[0];
                }
            }

            // Se achou a URL da API interna, fazemos uma requisição para ela pegar o MP4
            if (videoApiUrl) {
                const apiResponse = await axios.get(videoApiUrl, { headers: this.getHeaders() });
                // A resposta costuma ser um JSON com a lista de qualidades: { "data": [ { "src": "link.mp4", "label": "720p" } ] }
                return apiResponse.data; 
            }

            // ESTRATÉGIA 3: Fallback caso eles mudem para iFrames
            const iframeSrc = $('iframe').attr('src');
            const videoSrc = $('video').attr('data-video-src');
            if (iframeSrc) {
                return { tipo: 'iframe', url: iframeSrc, provedor: 'animefire' };
            } else if (videoSrc){
                return { tipo: 'video', url: videoSrc, provedor: 'animefire' };
            }

            throw new Error("Não foi possível encontrar o player de vídeo na página.");

        } catch (error) {
            throw new Error(`Falha ao extrair vídeo: ${error.message}`);
        }
    }
    async TopAnimes(page) {
        try {
            const response = await axios.get(`${this.baseURL}/top-animes/${page}`, {
                headers: this.getHeaders(),
                validateStatus: (status) => status === 200
            });
            const $ = cheerio.load(response.data);
            const animes = [];
            $('div.minWDanime.divCardUltimosEps').each((i, el) => {
                const $el = $(el);
                const titleElem = $el.attr('title');
                const title = titleElem ? titleElem.trim() : `Anime ${i + 1}`;
                const link = $el.find('a').attr('href');
                const imgURL = $el.find('img').attr('data-src');
                animes.push({ title, link, imgURL, provedor: 'animefire' });
            });
            return animes;
        } catch (error) {
            throw new Error(`Falha ao buscar animes: ${error.message}`);
        }
    }
}

module.exports = AnimeFireClient;