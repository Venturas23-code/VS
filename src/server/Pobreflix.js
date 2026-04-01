const axios = require('axios');
const cheerio = require('cheerio');

class PobreflixClient {
    getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.pobreflixtv.work/'
        };
    }

    async detectContentType(url) {
        try {
            const response = await axios(url, {
                headers: this.getHeaders(),
                timeout: 15000
            });
            const $ = cheerio.load(response.data);

            const hasEpisodes = $('ul#listagem li a').length > 0;
            return hasEpisodes ? 'series' : 'filmes';
        } catch (error) {
            console.error('Error detecting content type:', error?.message || error);
            return 'filmes';
        }
    }

        // Função de scraping para pesquisa
    async pesquisa(pesquisa) {
        try {
            const response = await axios(`https://www.pobreflixtv.work/pesquisar/?p=${encodeURIComponent(pesquisa)}`, {
                headers: this.getHeaders()
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const posts = [];
            $('div#collview').each(function () {
                const url = $(this).find('a').attr('href') + "?area=online";
                const title = $(this).find('div.caption').text().trim();
                const capa_audio = $(this).find('.capa-info.capa-audio').text().trim();
                const capa_quali = $(this).find('.capa-info.capa-quali').text().trim();
                const [nome, ano, tempo] = title.split("\n").map(item => item.trim());
                const capa = $(this).find('.vb_image_container').attr('data-background-src').replace("w185", "w500");
                posts.push({
                    nome,
                    ano,
                    tempo,
                    capa,
                    capa_audio,
                    capa_quali,
                    url: url,
                    provedor: 'pobreflix',
                    contentType: 'filmes'
                });
            });

            const typedPosts = await Promise.all(
                posts.map(async (post) => ({
                    ...post,
                    contentType: await this.detectContentType(post.url)
                }))
            );

            return typedPosts;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
    async video(url) {
        try{
            const response = await axios(url, {
                headers: this.getHeaders()
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const post = [];

            const tokenMatch = html.match(/token=([a-zA-Z0-9]+)/);
            const token = tokenMatch ? tokenMatch[1] : null;

            if (!token) {
                console.warn('Token não encontrado na página');
            } else {
                console.log('Token encontrado:', token);
            }
            $('.players div.item').each(function () {
                const onclick = $(this).attr('onclick').replace("C_Video('", "").replace("');", "");
                const [id, server] = onclick.split("','");
                const embedUrl = `https://www.pobreflixtv.work/e/getembed.php?sv=${server}&id=${id}&token=${token || ''}`;
                post.push({
                    id: id,
                    server: server,
                    url: embedUrl,
                    provedor: 'pobreflix'
                });  
            })
            return post;
        } catch(error) {
            console.error('Error:', error);
            throw error;
        }
    }
    async filmes(page) {
        try {
            const response = await axios(`https://www.pobreflixtv.work/assistir/filmes-online-online-2/?page=${page}`, {
                headers: this.getHeaders()
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const posts = [];
            $('div#collview').each(function () {
                const url = $(this).find('a').attr('href') + "?area=online";
                const title = $(this).find('div.caption').text().trim();
                const capa_audio = $(this).find('.capa-info.capa-audio').text().trim();
                const capa_quali = $(this).find('.capa-info.capa-quali').text().trim();
                const [nome, ano, tempo] = title.split("\n").map(item => item.trim());
                const capa = $(this).find('.vb_image_container').attr('data-background-src').replace("w185", "w500");
                posts.push({
                    nome,
                    ano,
                    tempo,
                    capa,
                    capa_audio,
                    capa_quali,
                    url: url,
                    provedor: 'pobreflix'
                });
            });
            return posts;
        } catch(error) {
            console.error('Error:', error);
            throw error;
        }
    }
    async series(page) {
        try {
            const response = await axios(`https://www.pobreflixtv.work/assistir/series-online-online-3/?page=${page}`, {
                headers: this.getHeaders(),
                timeout: 15000
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const posts = [];
            $('div#collview').each(function () {
                const url = $(this).find('a').attr('href') + "?area=online";
                const title = $(this).find('div.caption').text().trim();
                const capa_audio = $(this).find('.capa-info.capa-audio').text().trim();
                const capa_quali = $(this).find('.capa-info.capa-quali').text().trim();
                const [nome, ano, tempo] = title.split("\n").map(item => item.trim());
                const capa = $(this).find('.vb_image_container').attr('data-background-src').replace("w185", "w500");
                posts.push({
                    nome,
                    ano,
                    tempo,
                    capa,
                    capa_audio,
                    capa_quali,
                    url: url,
                    provedor: 'pobreflix'
                });
            });
            return posts;
        } catch(error) {
            console.error('Error:', error);
            throw error;
        }
    }
    async eps(url, temporada) {
        try {
            const parsedUrl = new URL(url);
            if (temporada) {
                parsedUrl.searchParams.set('temporada', String(temporada));
            }

            const response = await axios(parsedUrl.toString(), {
                headers: this.getHeaders(),
                timeout: 15000
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const posts = [];
            const seenUrls = new Set();

            const seasonsSet = new Set();

            // Primary source: onclick="load(n)" in season list
            const onclickMatches = html.match(/load\((\d{1,2})\)/gi) || [];
            onclickMatches.forEach((entry) => {
                const match = entry.match(/load\((\d{1,2})\)/i);
                if (match?.[1]) {
                    seasonsSet.add(String(parseInt(match[1], 10)));
                }
            });

            // Fallback source: rendered labels like "Temporada 1"
            $('ul.lista li').each(function () {
                const onclick = $(this).attr('onclick') || '';
                const label = $(this).find('div').first().text().trim() || $(this).text().trim();

                const fromOnclick = onclick.match(/load\((\d{1,2})\)/i)?.[1];
                const fromLabel = label.match(/temporada\s*(\d{1,2})/i)?.[1];
                const seasonRaw = fromOnclick || fromLabel;

                if (!seasonRaw) {
                    return;
                }

                seasonsSet.add(String(parseInt(seasonRaw, 10)));
            });

            const availableSeasons = [...seasonsSet].sort((a, b) => Number(a) - Number(b));

            if (temporada && !availableSeasons.includes(String(temporada))) {
                availableSeasons.push(String(temporada));
            }

            availableSeasons.sort((a, b) => Number(a) - Number(b));

            $('ul#listagem li a').each(function () {
                const nome = $(this).text().trim();
                const href = $(this).attr('href');

                if (!href) {
                    return;
                }

                const episodeUrl = `${href}?area=online`;
                if (seenUrls.has(episodeUrl)) {
                    return;
                }
                seenUrls.add(episodeUrl);

                const seasonFromName = nome.match(/(\d{1,2})\s*[xX]\s*\d{1,3}|(?:temporada|season|t)\s*(\d{1,2})/i);
                const seasonNumber = String(temporada || seasonFromName?.[1] || seasonFromName?.[2] || 1);

                posts.push({
                    nome,
                    url: episodeUrl,
                    temporada: seasonNumber,
                    ...(posts.length === 0 ? { temporadasDisponiveis: availableSeasons } : {}),
                    provedor: 'pobreflix'
                });
            });
            return posts;
        } catch(error) {
            console.error('Error:', error);
            throw error;
        }
    }
}

module.exports = PobreflixClient;