const axios = require('axios');
const cheerio = require('cheerio');

class StreamVerdeClient {
    constructor() {
        this.baseURL = 'https://streamverde.net/';
        this.headers = this.getHeaders();
        this.maxRetries = 2;
        this.retryDelay = 8000; // 8 segundos
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    decodeBase64Value(value) {
        if (!value || typeof value !== 'string') return null;

        try {
            const cleanValue = value.trim().replace(/\s+/g, '');
            const normalized = cleanValue
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const padding = normalized.length % 4;
            const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;

            return Buffer.from(padded, 'base64').toString('utf8').trim() || null;
        } catch (_) {
            return null;
        }
    }

    extractDecodedUrlFromScripts($) {
        let decodedUrl = null;

        $('script').each((_, element) => {
            if (decodedUrl) return;

            const scriptContent = $(element).html() || '';
            const match = scriptContent.match(/encodedUrl\s*[:=]\s*['\"]([^'\"]+)['\"]/i);
            if (!match || !match[1]) return;

            decodedUrl = this.decodeBase64Value(match[1]);
        });

        return decodedUrl;
    }

    getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://streamverde.net/'
        };
    }

    async canais() {
        try {
            const url = `${this.baseURL}canais/`;
            const response = await axios.get(url, {
                headers: this.getHeaders()
            });

            const $ = cheerio.load(response.data);
            const canais = [];
            const vistos = new Set();

            $('.post-inner').each((_, element) => {
                const link = $(element)
                    .find('.post-media a')
                    .attr('href');

                if (!link) return;
                if (!link.includes('/canais/')) return;

                if (vistos.has(link)) return;
                vistos.add(link);

                const nome = $(element)
                    .find('.videos-content .title a')
                    .text()
                    .trim();

                const capa = $(element)
                    .find('.post-media img')
                    .attr('src');

                const views = $(element)
                    .find('.videos-meta .view')
                    .text()
                    .trim();

                const tempo = $(element)
                    .find('.videos-meta .time')
                    .text()
                    .trim();

                canais.push({
                    nome: nome || 'Canal',
                    url: link,
                    capa: capa || null,
                    views: views || null,
                    tempo: tempo || null,
                    provedor: 'streamverde'
                });
            });

            return canais;
        } catch (error) {
            console.error('Erro StreamVerde:', error.message);
            return [];
        }
    }

    async pesquisa(query) {
        const canais = await this.canais();

        const termo = query.toLowerCase();

        return canais.filter(canal =>
            canal.nome.toLowerCase().includes(termo)
        );
    }

    async video(channelUrl) {
        try {
            for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
                const response = await axios.get(channelUrl, {
                    headers: this.getHeaders()
                });
                const $ = cheerio.load(response.data);
                const streamUrl =
                    $('div.video-js.vjs-live video.vjs-tech').attr('src') ||
                    $('video source').attr('src') ||
                    $('video').attr('src') ||
                    null;

                const embedUrl =
                    $('iframe').attr('src') ||
                    null;

                const poster =
                    $('video').attr('poster') ||
                    null;

                const decodedUrl = this.extractDecodedUrlFromScripts($);

                if (streamUrl || embedUrl || decodedUrl || attempt === this.maxRetries) {
                    return {
                        streamUrl,
                        embedUrl,
                        decodedUrl,
                        poster,
                        url: streamUrl || embedUrl || decodedUrl,
                        provedor: 'streamverde'
                    };
                }

                await this.delay(this.retryDelay);
            }

            return null;
        } catch (error) {
            console.error('[StreamVerde video]', error.message);
            return null;
        }
    }
}

module.exports = StreamVerdeClient;