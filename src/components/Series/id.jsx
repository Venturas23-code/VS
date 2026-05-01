import React, { use, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './id.css';
import TMDB from '../../itens/TMDB.json';
import pomfyLogo from '../../assets/filmes/pomfylogofullcolor.png';
import superflixLogo from '../../assets/filmes/superflix_logo.png';

export default function Serie() {
    const { id } = useParams();
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const imageOriginalBaseUrl = 'https://image.tmdb.org/t/p/original';
    const [serie, setSerie] = useState(null);

    const [expandedSeason, setExpandedSeason] = useState(1);
    const [seasonEpisodes, setSeasonEpisodes] = useState({});

    const [images, setImages] = useState(null);
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);

    const [recommendations, setRecommendations] = useState({ results: [] });
    const [page, setPage] = useState(1);
    const [carrosselBordas, setCarrosselBordas] = useState({ esquerda: false, direita: true });
    const [ultimoEpisodioClicado, setUltimoEpisodioClicado] = useState(null);
    const carrosselRef = React.useRef(null);
    
    const openPopupWindow = (popupTitle, contentHtml) => {
        const popup = window.open(
            '',
            '_blank',
            `left=0,top=0,width=${window.screen.availWidth},height=${window.screen.availHeight}`
        );

        if (!popup) {
            return null;
        }

        popup.document.open();
        popup.document.write(`<!doctype html><html><head><title></title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;}body{display:flex;flex-direction:column;}iframe{border:0;flex:1;width:100%;height:100%;display:block;}</style></head><body>${contentHtml}</body></html>`);
        popup.document.close();
        popup.document.title = popupTitle;
        popup.moveTo(0, 0);
        popup.resizeTo(window.screen.availWidth, window.screen.availHeight);
        popup.focus();

        return popup;
    };

    const handleOpenPomfy = () => {
        const pomfyUrl = `https://api.pomfy.stream/serie/${id}`;
        const popup = window.open(
            '',
            '_blank',
            `left=0,top=0,width=${window.screen.availWidth},height=${window.screen.availHeight}`
        );

        if (!popup) {
            return;
        }

        popup.document.title = `${serie?.name || 'Serie'} | Pomfy | VS`;
        popup.location.href = pomfyUrl;
        popup.moveTo(0, 0);
        popup.resizeTo(window.screen.availWidth, window.screen.availHeight);
        popup.focus();

    };
    const handleOpenSuperFlixAPI = (temporada, episodio) => {
        const episodioId = `${id}-S${temporada}E${episodio}`;
        setUltimoEpisodioClicado(episodioId);
        localStorage.setItem(`ultimoEpisodio-${id}`, episodioId);
        
        const superFlixUrl = `https://superflixapi.online/serie/${id}/${temporada}/${episodio}`;
        openPopupWindow(
            `${serie?.name || 'Serie'} | SuperFlix | VS`,
            `<iframe src="${superFlixUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen frameborder="0" scrolling="no"></iframe>`
        );
    };
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + TMDB.key
        }
    };

    const fetchSeasonEpisodes = (seasonNumber) => {
        if (seasonEpisodes[seasonNumber]) {
            return;
        }
        fetch(TMDB.series[10].url.replace('{id_serie}', id).replace('{season_number}', seasonNumber), options)
            .then(res => res.json())
            .then(res => {
                setSeasonEpisodes(prev => ({
                    ...prev,
                    [seasonNumber]: res
                }));
            })
            .catch(err => console.error(err));
    };

    const handleSeasonClick = (seasonNumber) => {
        setExpandedSeason(expandedSeason === seasonNumber ? null : seasonNumber);
        fetchSeasonEpisodes(seasonNumber);
    };

    const atualizarBordasCarrossel = () => {
        if (!carrosselRef.current) return;
        const trilho = carrosselRef.current;
        const margem = 10;
        const esquerda = trilho.scrollLeft > margem;
        const direita = trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - margem;
        setCarrosselBordas({ esquerda, direita });
    };

    const scrollCarrossel = (direcao) => {
        if (!carrosselRef.current) return;
        const trilho = carrosselRef.current;
        const passo = Math.max(280, Math.floor(trilho.clientWidth * 0.9));
        trilho.scrollBy({
            left: direcao === 'direita' ? passo : -passo,
            behavior: 'smooth'
        });
        requestAnimationFrame(atualizarBordasCarrossel);
    };

    useEffect(() => {
        fetch(TMDB.series[8].url.replace('{tv_id}', id), options)
            .then(res => res.json())
            .then(res => {
                setSerie(res);
                // Fetch first season episodes by default
                fetch(TMDB.series[10].url.replace('{id_serie}', id).replace('{season_number}', '1'), options)
                    .then(res => res.json())
                    .then(res => {
                        setSeasonEpisodes(prev => ({
                            ...prev,
                            1: res
                        }));
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }, [id]);
    useEffect(() => {
        fetch(TMDB.series[11].url.replace('{id_serie}', id), options)
            .then(res => res.json())
            .then(res => {
                setImages(res);
            })
            .catch(err => console.error(err));
    }, [id]);

    // build backdrops array from images or fallback to serie.backdrop_path
    useEffect(() => {
        if (images && images.backdrops && images.backdrops.length > 0) {
            const paths = images.backdrops.map(b => b.file_path).filter(Boolean);
            if (paths.length > 0) setBackdrops(paths);
        } else if (serie && serie.backdrop_path) {
            setBackdrops([serie.backdrop_path]);
        }
    }, [images, serie]);

    // slideshow cycling
    useEffect(() => {
        if (!backdrops || backdrops.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBackdropIndex(i => (i + 1) % backdrops.length);
        }, 5000); // change every 5s

        return () => clearInterval(interval);
    }, [backdrops]);
    useEffect(() => {
        fetch(TMDB.series[12].url.replace('{id_serie}', id).replace('{page}', page), options)
            .then(res => res.json())
            .then(res => setRecommendations(res))
            .catch(err => console.error(err));
    }, [id, page]);

    useEffect(() => {
        if (!serie) {
            document.title = 'VS | Carregando serie...';
            return;
        }

        document.title = `VS | ${serie.name}`;
    }, [serie]);

    useEffect(() => {
        const trilho = carrosselRef.current;
        if (!trilho) return;
        trilho.addEventListener('scroll', atualizarBordasCarrossel);
        atualizarBordasCarrossel();
        return () => trilho.removeEventListener('scroll', atualizarBordasCarrossel);
    }, []);

    useEffect(() => {
        const ultimoEpisodio = localStorage.getItem(`ultimoEpisodio-${id}`);
        if (ultimoEpisodio) {
            setUltimoEpisodioClicado(ultimoEpisodio);
        }
    }, [id]);

    if (!serie) {
        return <p className='FilmeLoading'>Carregando serie...</p>;
    }
    const getUltimoSeasonDoEpisodio = () => {
        if (!ultimoEpisodioClicado) return null;
        const match = ultimoEpisodioClicado.match(/S(\d+)E/);
        return match ? parseInt(match[1], 10) : null;
    };

    const episodioCard = (episodes) => {
        return episodes.episodes.map(episode => {
            const episodioId = `${id}-S${episode.season_number}E${episode.episode_number}`;
            const isUltimoClicado = ultimoEpisodioClicado === episodioId;
            return (
                <div key={episode.id} className={`EpisodioCard ${isUltimoClicado ? 'assistido' : ''}`} onClick={() => handleOpenSuperFlixAPI(episode.season_number, episode.episode_number,)}>
                    <img src={episode.still_path ? imageBaseUrl + episode.still_path : 'https://placehold.co/500x281?text=Sem+Imagem'} alt={episode.name} />
                    {isUltimoClicado && (
                        <div className='EpisodioIndicador'>
                            <span className='EpisodioIcon'>▶</span>
                        </div>
                    )}
                    <div className='Episode_descripition'>
                        <h3>{episode.episode_number} - {episode.name}</h3>
                        <h5>{episode.overview || 'Sinopse indisponivel.'}</h5>
                    </div>
                </div>
            )
        })
    }
    const recommendationsCard = () => {
        return recommendations.results.map(rec => (
            <Link to={`/serie/${rec.id}`} key={rec.id} className='RecommendationCard'>
                <img src={rec.poster_path ? imageBaseUrl + rec.poster_path : 'https://placehold.co/500x750?text=Sem+Imagem'} alt={rec.name} />
            </Link>
        ))
    }
    return (
        <section className='FilmePage'>
            <div className='FilmeAura' />

            <Link className='FilmeBack' to='/Series'>
                ← Voltar
            </Link>
            <div className='backdrop_card'>
                {backdrops && backdrops.length > 0 ? (
                    backdrops.map((path, idx) => (
                        <img
                            key={idx}
                            className='backdrop-slide'
                            src={path ? `${imageOriginalBaseUrl}${path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                            alt={serie.name}
                            loading='lazy'
                            decoding='async'
                            style={{ opacity: idx === currentBackdropIndex ? 1 : 0 }}
                        />
                    ))
                ) : (
                    <img
                        src={serie.backdrop_path ? `${imageOriginalBaseUrl}${serie.backdrop_path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                        alt={serie.name}
                        loading='lazy'
                        decoding='async'
                    />
                )}
            </div>
            <article className='FilmeCard'>
                <div className='FilmePosterWrap'>
                    <img
                        src={serie.poster_path ? `${imageBaseUrl}${serie.poster_path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                        alt={serie.name}
                        className='poster_card'
                        loading='lazy'
                        decoding='async'
                    />
                    <span className='FilmePosterGlow' aria-hidden='true' />
                </div>

                <div className='FilmeContent'>

                    <h1>{serie.name}</h1>
                    <h3>{serie.tagline}</h3>

                    <div className='FilmeMeta'>
                        <span>{serie.first_air_date ? serie.first_air_date.slice(0, 4) : 'Sem data'}</span>
                        <span>Nota {serie.vote_average?.toFixed(1) ?? 'N/A'}</span>
                        <span>{serie.number_of_episodes ? `${serie.number_of_episodes} episódios` : 'Episódios indisponíveis'}</span>
                    </div>

                    <p className='FilmeOverview'>{serie.overview || 'Sinopse indisponivel.'}</p>
                </div>

                <div className='SeasonsSection'>
                    {serie && serie.number_of_seasons > 0 && Array.from({ length: serie.number_of_seasons }, (_, i) => i + 1).map(seasonNumber => {
                        const ultimoSeasonEpisodio = getUltimoSeasonDoEpisodio();
                        const temUltimoEpisodio = ultimoSeasonEpisodio === seasonNumber;
                        return (
                        <div key={seasonNumber} className='SeasonAccordion'>
                            <button 
                                className={`SeasonLabel ${expandedSeason === seasonNumber ? 'expanded' : ''} ${temUltimoEpisodio ? 'temUltimoEpisodio' : ''}`}
                                onClick={() => handleSeasonClick(seasonNumber)}
                            >
                                <span className='season-title'>Temporada {seasonNumber}</span>
                                {temUltimoEpisodio && <span className='SeasonIndicador'>●</span>}
                                <span className='season-chevron'>›</span>
                            </button>
                            {expandedSeason === seasonNumber && (
                                <div className='EpisodiosSection'>
                                    {seasonEpisodes[seasonNumber]?.episodes?.length > 0 ? (
                                        episodioCard(seasonEpisodes[seasonNumber])
                                    ) : (
                                        <p className='no-episodes'>Nenhum episódio disponível</p>
                                    )}
                                </div>
                            )}
                        </div>
                        )
                    })}
                </div>
                <div className='RecommendationsSection'>
                    <div className='RecommendationsTopo'>
                        <h2>Recomendações</h2>
                        <div className='CarrosselControles'>
                            <button
                                type='button'
                                className='CarrosselBotao'
                                onClick={() => scrollCarrossel('esquerda')}
                                aria-label='Rolar recomendações para esquerda'
                            >
                                ‹
                            </button>
                            <button
                                type='button'
                                className='CarrosselBotao'
                                onClick={() => scrollCarrossel('direita')}
                                aria-label='Rolar recomendações para direita'
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div
                        className={`RecommendationsCarrossel ${carrosselBordas.esquerda ? '' : 'sem-esquerda'} ${carrosselBordas.direita ? '' : 'sem-direita'}`.trim()}
                        ref={carrosselRef}
                        onScroll={atualizarBordasCarrossel}
                    >
                        {recommendationsCard()}
                    </div>
                </div>
            </article>
        </section>
    )
}