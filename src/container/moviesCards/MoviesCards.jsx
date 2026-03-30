import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 29; // ajuste conforme a API

export default function moviesCards({ exportmovies , provedor, searchTerm }) {
    const [movies, setMovies] = useState([]);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [activeAbsoluteIndex, setActiveAbsoluteIndex] = useState(0);

    const normalizeMovieData = (item, provider) => {
        if (provider === 'pomfy') {
            return {
                nome: item?.title ?? item?.original_title ?? null,
                ano: item?.release_date ? item.release_date.split('-')[0] : null,
                tempo: null,
                capa: item?.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                capa_audio: null,
                capa_quali: null,
                url: item?.id ?? null,
                provedor: 'pomfy'
            };
        }
        return {
            ...item,
            provedor: provider
        };
    };

    const getSafeImageSrc = (rawUrl) => {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;
        if (rawUrl.startsWith('/api/image')) return rawUrl;

        try {
            const normalized = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
            if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
                return `http://localhost:3000/api/image?url=${encodeURIComponent(normalized)}`;
            }
            return normalized;
        } catch {
            return rawUrl;
        }
    };

    const fetchPage = async (page) => {
        if (!provedor) return [];
        const response = await fetch(`http://localhost:3000/api/filmes/${provedor}/${page}`);
        console.log(`Resposta da API para ${provedor} página ${page}:`, response);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Falha ao buscar filmes (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        console.log(`Dados da API para ${provedor} página ${page}:`, data);
        let results = data?.filmesResults?.results ?? data?.filmesResults ?? [];
        if (!Array.isArray(results)) {
            results = [];
        }
        return results.map(item => normalizeMovieData(item, provedor));
        
    };
    const searchFilms = async (query) => {
        if (!provedor) return [];
        const response = await fetch(`http://localhost:3000/api/search/${provedor}/${query}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Falha ao pesquisar (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        console.log('Resultados da busca:', data?.results);
        let results = data?.results ?? [];
        if (!Array.isArray(results)) {
            results = [];
        }
        return results.map(item => normalizeMovieData(item, provedor));
    }

    useEffect(() => {
        const loadInitial = async () => {
            if (!provedor) {
                setMovies([]);
                return;
            }

            setIsLoading(true);
            try {
                const firstPage = await fetchPage(1);
                setMovies(firstPage);
                setStartPage(1);
                setEndPage(1);
            } catch (error) {
                console.error(error);
                setMovies([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [provedor]);

    useEffect(() => {
        const loadSearch = async () => {
            if (!provedor) {
                setMovies([]);
                return;
            }

            const query = (searchTerm || '').trim();
            setIsLoading(true);

            try {
                if (!query) {
                    const firstPage = await fetchPage(1);
                    setMovies(firstPage);
                    setStartPage(1);
                    setEndPage(1);
                    setActiveAbsoluteIndex(0);
                    return;
                }

                const results = await searchFilms(query);
                setMovies(results);
                setStartPage(1);
                setEndPage(1);
                setActiveAbsoluteIndex(0);
            } catch (error) {
                console.error(error);
                setMovies([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSearch();
    }, [searchTerm, provedor]);

    useEffect(() => {
        exportmovies(movies);
    }, [movies, exportmovies]);

    const goToPage = async (page) => {
        if (isLoading || page < 1) return;

        setIsLoading(true);
        try {
            const items = await fetchPage(page);
            setMovies(items);
            setStartPage(page);
            setEndPage(page);
            setActiveAbsoluteIndex((page - 1) * ITEMS_PER_PAGE);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadNextPage = () => goToPage(endPage + 1);
    const loadPreviousPage = () => goToPage(startPage - 1);

    const getActivePosition = (currentValue, baseAbsoluteIndex, hasPrevCard) => {
        if (currentValue === -1) return hasPrevCard ? 0 : 0;
        if (currentValue === -2) return hasPrevCard ? movies.length + 1 : movies.length;

        const firstMoviePosition = hasPrevCard ? 1 : 0;
        const lastMoviePosition = hasPrevCard ? movies.length : movies.length - 1;
        const moviePosition = currentValue - baseAbsoluteIndex + firstMoviePosition;

        if (moviePosition < firstMoviePosition) return firstMoviePosition;
        if (moviePosition > lastMoviePosition) return lastMoviePosition;
        return moviePosition;
    };

    const renderMovies = () => {
        const baseAbsoluteIndex = (startPage - 1) * ITEMS_PER_PAGE;
        const hasPrevCard = startPage > 1;

        return (
            <>
                {hasPrevCard && (
                    <button
                        type='button'
                        className={`MovieCard MovieCardAction ${activeAbsoluteIndex === -1 ? 'active' : ''}`}
                        onClick={loadPreviousPage}
                        disabled={isLoading || startPage <= 1}
                        data-nav='prev'
                    >
                        <span className='MovieCardActionTitle'>Pagina anterior</span>
                        <span className='MovieCardActionMeta'>
                            {isLoading ? 'Carregando...' : `Ir para pagina ${Math.max(1, startPage - 1)}`}
                        </span>
                    </button>
                )}

                {movies.map((movie, index) => (
                    <div
                        data-url={movie.url || movie.link}
                        className={`MovieCard ${baseAbsoluteIndex + index === activeAbsoluteIndex ? 'active' : ''} ${movie.provedor}`}
                        key={movie.url || `${movie.nome}-${index}`}
                        data-index={index}
                        data-absolute-index={baseAbsoluteIndex + index}
                        data-prov={movie.provedor}
                        data-name={movie.title || movie.nome}
                    >
                        <img
                            src={getSafeImageSrc(movie.capa || movie.imgURL)}
                            alt={movie.nome}
                            loading='lazy'
                            referrerPolicy='no-referrer'
                            onError={(event) => {
                                event.currentTarget.src = '';
                            }}
                        />
                        <h2>{movie.provedor === 'reidoscanais' ? movie.nome : ""}</h2>
                        <h3 className={`capa_audio ${movie.provedor === 'pobreflix' ? 'active' : 'null'}`}>
                            {movie.provedor === 'pobreflix' ? movie.capa_audio : ''}
                        </h3>
                        <h3 className={`capa_quali ${movie.provedor === 'pobreflix' ? 'active' : 'null'}`}>
                            {movie.provedor === 'pobreflix' ? movie.capa_quali : ''}
                        </h3>
                    </div>
                ))}

                <button
                    type='button'
                    className={`MovieCard MovieCardAction ${activeAbsoluteIndex === -2 ? 'active' : ''}`}
                    onClick={loadNextPage}
                    disabled={isLoading}
                    data-nav='next'
                >
                    <span className='MovieCardActionTitle'>Proxima pagina</span>
                    <span className='MovieCardActionMeta'>
                        {isLoading ? 'Carregando...' : `Ir para pagina ${endPage + 1}`}
                    </span>
                </button>
                
            </>
        );
    };

    useEffect(() => {
        if (!movies.length) return;

        const firstVisibleAbsolute = (startPage - 1) * ITEMS_PER_PAGE;
        const lastVisibleAbsolute = firstVisibleAbsolute + movies.length - 1;

        setActiveAbsoluteIndex((prev) => {
            if (prev < firstVisibleAbsolute) return firstVisibleAbsolute;
            if (prev > lastVisibleAbsolute) return lastVisibleAbsolute;
            return prev;
        });
    }, [movies.length, startPage]);

    useEffect(() => {
        let activeCard = null;

        if (activeAbsoluteIndex === -1) {
            activeCard = document.querySelector('.MovieCardAction[data-nav="prev"]');
        } else if (activeAbsoluteIndex === -2) {
            activeCard = document.querySelector('.MovieCardAction[data-nav="next"]');
        } else {
            activeCard = document.querySelector(`.MovieCard[data-absolute-index="${activeAbsoluteIndex}"]`);
        }

        activeCard?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }, [activeAbsoluteIndex, movies.length, startPage]);

    useEffect(() => {
        const getColumnCount = () => {
            const container = document.querySelector('#root');
            if (!container) return 2;
            const width = container.offsetWidth;
            if (width < 600) return 1;
            if (width < 1000) return 2;
            if (width < 1400) return 3;
            if (width < 1800) return 4;
            return 5;
        };

        const handleKeyPress = (e) => {
            const activeElement = document.activeElement;
            const isTypingField = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.isContentEditable
            );

            if (isTypingField) return;

            const movieCards = document.querySelectorAll('.MovieCard');
            if (!movieCards.length) return;

            const navigationKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '];
            if (navigationKeys.includes(e.key)) e.preventDefault();

            const firstVisibleAbsolute = (startPage - 1) * ITEMS_PER_PAGE;
            const hasPrevCard = startPage > 1;
            const totalPositions = movies.length + (hasPrevCard ? 2 : 1);

            if (!totalPositions) return;

            if (e.key === 'Enter' || e.key === ' ') {
                if (activeAbsoluteIndex === -1) {
                    if (!hasPrevCard) return;
                    loadPreviousPage();
                    return;
                }

                if (activeAbsoluteIndex === -2) {
                    loadNextPage();
                    return;
                }

                const activeCard = document.querySelector(`.MovieCard[data-absolute-index="${activeAbsoluteIndex}"]`);
                activeCard?.click();
                return;
            }

            if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                return;
            }

            setActiveAbsoluteIndex((prev) => {
                let nextPosition = getActivePosition(prev, firstVisibleAbsolute, hasPrevCard);

                if (e.key === 'ArrowRight') {
                    nextPosition += 1;
                } else if (e.key === 'ArrowLeft') {
                    nextPosition -= 1;
                } else if (e.key === 'ArrowUp') {
                    nextPosition -= getColumnCount();
                } else if (e.key === 'ArrowDown') {
                    nextPosition += getColumnCount();
                }

                if (nextPosition < 0) nextPosition = 0;
                if (nextPosition > totalPositions - 1) nextPosition = totalPositions - 1;

                if (hasPrevCard && nextPosition <= 0) return -1;
                if (nextPosition >= totalPositions - 1) return -2;

                const movieIndexOffset = hasPrevCard ? nextPosition - 1 : nextPosition;
                return firstVisibleAbsolute + movieIndexOffset;
            });
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [movies, startPage, endPage, isLoading, activeAbsoluteIndex]);

    return (
        <div className='MoviesCards' id='MoviesCards'>
            
            {renderMovies()}
        </div>
    );
}