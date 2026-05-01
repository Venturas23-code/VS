import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './id.css';
import TMDB from '../../itens/TMDB.json';
import pomfyLogo from '../../assets/filmes/pomfylogofullcolor.png';
import superflixLogo from '../../assets/filmes/superflix_logo.png';

export default function Filme() {
    const { id } = useParams();
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const imageOriginalBaseUrl = 'https://image.tmdb.org/t/p/original';
    const [filme, setFilme] = useState(null);

    const [images, setImages] = useState(null);
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);

    const [recommendations, setRecommendations] = useState({ results: [] });
    const [page, setPage] = useState(1);
    const [carrosselBordas, setCarrosselBordas] = useState({ esquerda: false, direita: true });
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
        const pomfyUrl = `https://api.pomfy.stream/filme/${id}`;
        const popup = window.open(
            '',
            '_blank',
            `left=0,top=0,width=${window.screen.availWidth},height=${window.screen.availHeight}`
        );

        if (!popup) {
            return;
        }

        popup.document.title = `${filme?.title || 'Filme'} | Pomfy | VS`;
        popup.location.href = pomfyUrl;
        popup.moveTo(0, 0);
        popup.resizeTo(window.screen.availWidth, window.screen.availHeight);
        popup.focus();

    };
    const handleOpenSuperFlixAPI = () => {
        const superFlixUrl = `https://superflixapi.rest/filme/${encodeURIComponent(id)}`;
        openPopupWindow(
            `${filme?.title || 'Filme'} | SuperFlix | VS`,
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

    useEffect(() => {
        fetch(TMDB.movie[8].url.replace('{movie_id}', id), options)
            .then(res => res.json())
            .then(res => setFilme(res))
            .catch(err => console.error(err));
    }, [id]);

    useEffect(() => {
        fetch(TMDB.movie[10].url.replace('{movie_id}', id), options)
            .then(res => res.json())
            .then(res => {
                setImages(res);
            })
            .catch(err => console.error(err));
    }, [id]);
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
    // build backdrops array from images or fallback to filme.backdrop_path
    useEffect(() => {
        if (images && images.backdrops && images.backdrops.length > 0) {
            const paths = images.backdrops.map(b => b.file_path).filter(Boolean);
            if (paths.length > 0) setBackdrops(paths);
        } else if (filme && filme.backdrop_path) {
            setBackdrops([filme.backdrop_path]);
        }
    }, [images, filme]);

    // slideshow cycling
    useEffect(() => {
        if (!backdrops || backdrops.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBackdropIndex(i => (i + 1) % backdrops.length);
        }, 5000); // change every 5s

        return () => clearInterval(interval);
    }, [backdrops]);
    useEffect(() => {
        if (!filme) {
            document.title = 'VS | Carregando filme...';
            return;
        }

        document.title = `VS | ${filme.title}`;
    }, [filme]);

    useEffect(() => {
        fetch(TMDB.movie[11].url.replace('{movie_id}', id).replace('{page}', page), options)
            .then(res => res.json())
            .then(res => setRecommendations(res))
            .catch(err => console.error(err));
    }, [id, page]);

    useEffect(() => {
        const trilho = carrosselRef.current;
        if (!trilho) return;
        trilho.addEventListener('scroll', atualizarBordasCarrossel);
        atualizarBordasCarrossel();
        return () => trilho.removeEventListener('scroll', atualizarBordasCarrossel);
    }, []);

    if (!filme) {
        return <p className='FilmeLoading'>Carregando filme...</p>;
    }

    const recommendationsCard = () => {
        return recommendations.results.map(rec => (
            <Link to={`/filme/${rec.id}`} key={rec.id} className='RecommendationCard'>
                <img src={rec.poster_path ? imageBaseUrl + rec.poster_path : 'https://placehold.co/500x750?text=Sem+Imagem'} alt={rec.name} />
            </Link>
        ))
    }

    return (
        <section className='FilmePage'>
            <div className='FilmeAura' />

            <Link className='FilmeBack' to='/'>
                ← Voltar
            </Link>
            <div className='backdrop_card'>
                {backdrops && backdrops.length > 0 ? (
                    backdrops.map((path, idx) => (
                        <img
                            key={idx}
                            className='backdrop-slide'
                            src={path ? `${imageOriginalBaseUrl}${path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                            alt={filme.name}
                            loading='lazy'
                            decoding='async'
                            style={{ opacity: idx === currentBackdropIndex ? 1 : 0 }}
                        />
                    ))
                ) : (
                    <img
                        src={filme.backdrop_path ? `${imageOriginalBaseUrl}${filme.backdrop_path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                        alt={filme.name}
                        loading='lazy'
                        decoding='async'
                    />
                )}
            </div>
            <article className='FilmeCard'>
                <div className='FilmePosterWrap'>
                    <img
                        src={filme.poster_path ? `${imageBaseUrl}${filme.poster_path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                        alt={filme.title}
                        className='poster_card'
                        loading='lazy'
                        decoding='async'
                    />
                    <span className='FilmePosterGlow' aria-hidden='true' />
                </div>

                <div className='FilmeContent'>

                    <h1>{filme.title}</h1>
                    <h3>{filme.tagline}</h3>

                    <div className='FilmeMeta'>
                        <span>{filme.release_date ? filme.release_date.slice(0, 4) : 'Sem data'}</span>
                        <span>Nota {filme.vote_average?.toFixed(1) ?? 'N/A'}</span>
                        <span>{filme.runtime ? `${filme.runtime} min` : 'Duracao indisponivel'}</span>
                    </div>

                    <p className='FilmeOverview'>{filme.overview || 'Sinopse indisponivel.'}</p>
                    <div className='API'>
                        <button className='API_Button' onClick={handleOpenSuperFlixAPI}>
                            <img src={superflixLogo} alt='SuperFlix' className='logo_button' loading='lazy' decoding='async' />
                        </button>
                        <button className='API_Button' onClick={handleOpenPomfy}>
                            <img src={pomfyLogo} alt='Pomfy' className='logo_button' loading='lazy' decoding='async' />
                        </button>
                    </div>
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