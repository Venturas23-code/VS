const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class StreamVerdeClient {
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
            const url = 'https://streamverde.net/canais/';
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
            const decodedUrl = decodeURIComponent(channelUrl);

            // pega o slug final da url
            const slug = decodedUrl
                .split('/')
                .filter(Boolean)
                .pop();

            if (!slug) {
                throw new Error('Slug do canal não encontrado');
            }

            const normalizedSlug = slug.replace(/-/g, '');

            const streamUrl =
                `https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/${normalizedSlug}.m3u8`;

            console.log('[STREAM URL]', streamUrl);

            // opcional: validar se existe
            const response = await axios.get(streamUrl, {
                headers: this.getHeaders()
            });

            return {
                url: streamUrl
            };
        } catch (error) {
            console.error('[StreamVerde video]', error.message);
            return null;
        }
    }
}

module.exports = StreamVerdeClient;