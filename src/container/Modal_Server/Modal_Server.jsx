import React, { useEffect, useState } from 'react'

export default function Modal_Server(movies) {
    const [videoServer, setVideoServer] = useState([]);
    const [provedor, setProvedor] = useState('');
    const [pobreflixStep, setPobreflixStep] = useState('video');
    const [pobreflixEpisodes, setPobreflixEpisodes] = useState([]);
    const [pobreflixCurrentEpisodes, setPobreflixCurrentEpisodes] = useState([]);
    const [pobreflixSeasons, setPobreflixSeasons] = useState([]);
    const [pobreflixSeriesUrl, setPobreflixSeriesUrl] = useState('');
    const [videoData, setVideoData] = useState([{ url: '', tipo: '' }]);
    const [closemodal, setclosemodal] = useState(true);

    const getPomfyIframeUrl = (payload) => {
        if (!payload) return null;

        if (typeof payload === 'string') return payload;

        if (Array.isArray(payload)) {
            const first = payload[0];
            if (typeof first === 'string') return first;
            return first?.src ?? first?.embed_url ?? first?.iframe ?? first?.url ?? null;
        }

        return payload?.url ?? payload?.embed_url ?? payload?.iframe ?? payload?.src ?? null;
    };

    const normalizeVideoServerList = (payload) => {
        if (!payload) return [];
        return Array.isArray(payload) ? payload : [payload];
    };

    const getSeasonKey = (entry) => {
        if (entry?.temporada) return String(entry.temporada);

        const fromName = `${entry?.nome || ''}`;
        const fromUrl = `${entry?.url || ''}`;
        const combined = `${fromName} ${fromUrl}`;

        const xFormat = combined.match(/(\d{1,2})\s*[xX]\s*\d{1,3}/);
        if (xFormat?.[1]) return String(parseInt(xFormat[1], 10));

        const tempFormat = combined.match(/(?:temporada|season|t)\s*(\d{1,2})/i);
        if (tempFormat?.[1]) return String(parseInt(tempFormat[1], 10));

        return '1';
    };

    const buildSeasonOptions = (episodes) => {
        // Backend now sends temporadasDisponiveis only once; consume it first.
        const seasonsFromPayload = episodes.find((episode) => Array.isArray(episode?.temporadasDisponiveis))?.temporadasDisponiveis || [];

        const seasonCandidates = [];
        if (seasonsFromPayload.length) {
            seasonsFromPayload.forEach((season) => {
                const normalized = String(season).trim();
                if (normalized) seasonCandidates.push(normalized);
            });
        } else {
            episodes.forEach((episode) => {
                seasonCandidates.push(getSeasonKey(episode));
            });
        }

        const uniqueSeasons = [...new Set(seasonCandidates)]
            .sort((a, b) => Number(a) - Number(b));

        return uniqueSeasons.map((season) => ({
            nome: `Temporada ${season}`,
            season,
            kind: 'season'
        }));
    };

    useEffect(() => {
        const movieCards = document.querySelectorAll('.MovieCard');
        console.log(movies)
        const handlers = [];
        movieCards.forEach(card => {
            const handleCardClick = () => {
                const name = card.getAttribute('data-name');
                const url = card.getAttribute('data-url');
                const provedor = card.getAttribute('data-prov');
                const section = card.getAttribute('data-section');
                if (!url) return;
                if (provedor === "pobreflix") {
                    const endpoint = section === 'series' ? 'eps' : 'video';
                    fetch(`http://localhost:3000/api/${endpoint}/pobreflix/${encodeURIComponent(url)}`)
                        .then(response => response.json())
                        .then(data => {
                            add_videoData(name, 'video', section);
                            const payload = endpoint === 'eps' ? data.epsResults : data.videoResults;
                            const episodesPayload = endpoint === 'eps' ? (Array.isArray(payload) ? payload : []) : [];

                            if (endpoint === 'eps') {
                                const seasonOptions = buildSeasonOptions(episodesPayload);
                                setPobreflixEpisodes(episodesPayload);
                                setPobreflixSeasons(seasonOptions);
                                setPobreflixSeriesUrl(url);

                                if (seasonOptions.length > 1) {
                                    setVideoServer(seasonOptions);
                                    setPobreflixCurrentEpisodes([]);
                                    setPobreflixStep('season');
                                } else {
                                    setVideoServer(episodesPayload);
                                    setPobreflixCurrentEpisodes(episodesPayload);
                                    setPobreflixStep('eps');
                                }
                            } else {
                                setVideoServer(payload);
                                setPobreflixEpisodes([]);
                                setPobreflixCurrentEpisodes([]);
                                setPobreflixSeasons([]);
                                setPobreflixSeriesUrl('');
                                setPobreflixStep('video');
                            }

                            console.log(payload);
                        });
                    setProvedor('pobreflix');
                    const modal = document.querySelector('.modal');
                    modal.classList.add('active');
                } else if (provedor === 'animefire') {
                    fetch(`http://localhost:3000/api/eps/animefire/${encodeURIComponent(url)}`)
                        .then(response => response.json())
                        .then(data => {
                            setVideoServer(data.epsResults);
                            console.log(data.epsResults);
                        });
                    setProvedor('animefire');
                    const modal = document.querySelector('.modal');
                    modal.classList.add('active');
                } else if (provedor === 'reidoscanais') {
                    const url = card.getAttribute('data-url');
                    open(url, '_blank');
                    setProvedor('reidoscanais');
                } else if (provedor === 'streamverde') {
                    fetch(`http://localhost:3000/api/video/streamverde/${encodeURIComponent(url)}`)
                    .then(response => response.json())
                    .then(data => {
                        const streamData = Array.isArray(data.videoResults)
                            ? data.videoResults[0]
                            : data.videoResults;
                        const streamUrl = streamData?.decodedUrl || streamData?.streamUrl || streamData?.embedUrl || streamData?.url || url;
                        if (!streamUrl) return;
                        window.open(streamUrl, '_blank', 'noopener,noreferrer');
                        console.log(data.videoResults);
                    });
                } else if (provedor === 'pomfy') {
                    const id = card.getAttribute('data-url');
                    const section = card.getAttribute('data-section');
                    const isSeries = section === 'series';
                    console.log(`Pomfy na aba: ${isSeries ? 'series' : 'filmes'}`);

                    if (section === 'series') {
                        add_videoData(name, 'video', section);
                        const url = `https://pomfy.online/assistir/${id}?tipo=serie`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                        setProvedor('pomfy');
                    }else {
                        add_videoData(name, 'video', section);

                        const url = `https://pomfy.online/assistir/${id}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                        setProvedor('pomfy');
                    }
                }
            };
            card.addEventListener('click', handleCardClick);
            handlers.push({ card, handleCardClick });
        });

        return () => {
            handlers.forEach(({ card, handleCardClick }) => {
                card.removeEventListener('click', handleCardClick);
            });
        };
    }, [movies]);
    const add_videoData = (name, tipo, section = 'filmes') => {
        const tmdbType = section === 'series' ? 'tv' : 'movie';
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NTVjYTdhNTM4MjA0NTBmMjM5Y2E1YmYxMDQ1ODJjNCIsIm5iZiI6MTc1MjY4Njg3NS41OTcsInN1YiI6IjY4NzdlMTFiYzZlZjc3ZGJkMTQzZDNjOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H7orvOjrk5A9XbrMrRc_mmwZ0ylPReyGoQPQCDdH4pE'
            }
        };
        fetch(`https://api.themoviedb.org/3/search/${tmdbType}?query=${encodeURIComponent(name)}&include_adult=false&language=pt-BR&page=1`, options)
            .then(res => res.json())
            .then(res => setVideoData([{ url: res.results[0], tipo }]))
            .catch(err => console.error(err));
            setclosemodal(false);
    }

    const modal_card = () => {
        
        return videoData.map(data => (
            <div className='modal_card' key={data.url?.id}>
                <div className='backdrop'>
                    <img className='Backdrop_modal' src={'https://image.tmdb.org/t/p/original' + (closemodal ? '' : data.url?.backdrop_path)} alt={data.url?.title || data.url?.name} />
                </div>

                <img className='Img_modal' src={'https://image.tmdb.org/t/p/w500' + (closemodal ? '' : data.url?.poster_path)} alt={data.url?.title || data.url?.name} />

                <div className='Text_modal'>
                    <h2 className='Title_modal'>{closemodal ? '' : (data.url?.title || data.url?.name)}</h2>
                    <h3 className='OriginalTitle_modal'>{ closemodal ? '' : (data.url?.original_title || data.url?.original_name)}</h3>
                </div>

                <div className='overview'>
                    <p className='overview_modal'>{closemodal ? '' : data.url?.overview}</p>
                </div>
            </div>
        ))
    }
    const renderEP = () => {
        const videoList = normalizeVideoServerList(videoServer);
        return videoList.map((video, index) => (
            <div
                className='option'
                key={video.url || video.url_episodio || video.decodedUrl || video.season || index}
                data-url={video.url || video.url_episodio || video.decodedUrl}
                data-season={video.season || ''}
            >
                {video.server || video.nome || 'Abrir'}
            </div>
        ))
    }
    useEffect(() => {
        const option = document.querySelectorAll('.option');
        const handlers = [];

        option.forEach(opt => {
            const handleOptionClick = async () => {
                const url = opt.getAttribute('data-url');
                const season = opt.getAttribute('data-season');

                if (provedor === 'pobreflix') {
                    if (pobreflixStep === 'season') {
                        if (!season) return;

                        const baseSeriesUrl = pobreflixSeriesUrl || pobreflixEpisodes?.[0]?.url;
                        if (!baseSeriesUrl) {
                            const selectedEpisodes = pobreflixEpisodes.filter((episode) => getSeasonKey(episode) === season);
                            setVideoServer(selectedEpisodes);
                            setPobreflixCurrentEpisodes(selectedEpisodes);
                            setPobreflixStep('eps');
                            return;
                        }

                        fetch(`http://localhost:3000/api/eps/pobreflix/${encodeURIComponent(baseSeriesUrl)}/${encodeURIComponent(season)}`)
                            .then(response => response.json())
                            .then(data => {
                                const selectedEpisodes = Array.isArray(data?.epsResults) ? data.epsResults : [];
                                setVideoServer(selectedEpisodes);
                                setPobreflixCurrentEpisodes(selectedEpisodes);
                                setPobreflixStep('eps');
                            });
                        return;
                    }

                    if (!url) return;

                    if (pobreflixStep === 'eps') {
                        fetch(`http://localhost:3000/api/video/pobreflix/${encodeURIComponent(url)}`)
                            .then(response => response.json())
                            .then(data => {
                                setVideoServer(data.videoResults);
                                setPobreflixStep('video');
                            });
                        return;
                    }

                    window.open(url, '_blank');
                    return;
                }

                if (!url) return;

                if (provedor === 'animefire') {
                    const Ex_Player = `http://localhost:3000/api/video/animefire/${encodeURIComponent(url)}`;
                    const response = await fetch(Ex_Player);
                    const data = await response.json();
                    const arquivoAtual = data.videoResults;
                    console.log(arquivoAtual);

                    if (arquivoAtual && arquivoAtual.tipo === 'video') {
                        const videoURL = `http://localhost:3000/api/video/animefire/${encodeURIComponent(arquivoAtual.url)}`;
                        const videoResponse = await fetch(videoURL);
                        const videoRes = await videoResponse.json();
                        console.log(videoRes);
                        const videoSrc = videoRes.videoResults.data[videoRes.videoResults.data.length - 1].src;
                        open(videoSrc, '_blank');
                    } else if (arquivoAtual && arquivoAtual.tipo === 'iframe') {
                        open(arquivoAtual.url, '_blank');
                    }
                } 
                
                if (provedor === 'pomfy') {
                    
                    const iframeUrl = getPomfyIframeUrl(videoServer);
                    if (!iframeUrl) return;
                    window.open(iframeUrl, '_blank', 'noopener,noreferrer');
                    console.log('Abrindo iframe:', iframeUrl);
                }

                if (provedor === 'streamverde') {
                    const streamData = Array.isArray(videoServer) ? videoServer[0] : videoServer;
                    const streamUrl = streamData?.decodedUrl || streamData?.url || url;
                    if (!streamUrl) return;
                    window.open(streamUrl, '_blank', 'noopener,noreferrer');
                }
            };

            opt.addEventListener('click', handleOptionClick);
            handlers.push({ opt, handleOptionClick });
        });

        return () => {
            handlers.forEach(({ opt, handleOptionClick }) => {
                opt.removeEventListener('click', handleOptionClick);
            });
        };
    }, [videoServer, provedor, pobreflixStep])
    useEffect(() => {
        console.log(videoData);
    }, [videoData])

    const handleBackToEpisodes = () => {
        if (!pobreflixCurrentEpisodes.length) return;
        setVideoServer(pobreflixCurrentEpisodes);
        setPobreflixStep('eps');
    };

    const handleBackToSeasons = () => {
        if (!pobreflixSeasons.length) return;
        setVideoServer(pobreflixSeasons);
        setPobreflixCurrentEpisodes([]);
        setPobreflixStep('season');
    };

    useEffect(() => {
        const closeModal = document.getElementById('Close_modal');
        if (!closeModal) return;

        const handleClose = () => {
            const modal = document.querySelector('.modal');
            modal.classList.remove('active');
            setVideoServer([]);
            setPobreflixEpisodes([]);
            setPobreflixCurrentEpisodes([]);
            setPobreflixSeasons([]);
            setPobreflixSeriesUrl('');
            setPobreflixStep('video');
            setclosemodal(true);
        };

        closeModal.addEventListener('click', handleClose);

        return () => {
            closeModal.removeEventListener('click', handleClose);
        };

    }, []);
    return (
        <div className='modal'>
            <div className='background_modal'>
                <h1 className='Close_modal' id='Close_modal'>Close</h1>
                {modal_card()}
                <div className={`options_modal ${provedor}`}>
                    {provedor === 'pobreflix' && pobreflixStep === 'video' && pobreflixCurrentEpisodes.length > 0 && (
                        <button type='button' className='option' onClick={handleBackToEpisodes}>
                            Voltar para episodios
                        </button>
                    )}
                    {provedor === 'pobreflix' && pobreflixStep === 'eps' && pobreflixSeasons.length > 1 && (
                        <button type='button' className='option' onClick={handleBackToSeasons}>
                            Voltar para temporadas
                        </button>
                    )}
                    {renderEP()}
                </div>
            </div>
        </div>
    )
}
