import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './Series.css';
import TMDB from '../../itens/TMDB.json'
import frases from '../../itens/mensagens.json';
import { SearchIcon } from '../Icons';

const Series = () => {
    const [carrosseis, setCarrosseis] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [bordasVisiveis, setBordasVisiveis] = useState({});
    const [buscaAberta, setBuscaAberta] = useState(false);
    const [termoPesquisa, setTermoPesquisa] = useState('');
    const [resultadosPesquisa, setResultadosPesquisa] = useState([]);
    const [pesquisando, setPesquisando] = useState(false);
    const [carregandoMaisPesquisa, setCarregandoMaisPesquisa] = useState(false);
    const [erroPesquisa, setErroPesquisa] = useState('');
    const [paginaPesquisa, setPaginaPesquisa] = useState(1);
    const [totalPaginasPesquisa, setTotalPaginasPesquisa] = useState(1);
    const [fraseAleatoria] = useState(() => {
        const lista = Array.isArray(frases.series) ? frases.series : [];
        if (!lista.length) {
            return '';
        }

        return lista[Math.floor(Math.random() * lista.length)];
    });
    const carrosselRefs = useRef({});
    const requisicoesEmAndamento = useRef(new Set());
    const pesquisaRequisicaoAtual = useRef(0);
    const navigate = useNavigate();
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const temasSeries = TMDB.series.filter((tema) =>
        tema.name !== 'Descobrir' &&
        !tema.url.includes('{account_id}') &&
        !tema.url.includes('{session_id}') &&
        !tema.url.includes('{tv_id}') &&
        !tema.url.includes('{pesquisa}')
    );
    const Pesquisa = TMDB.series.find((tema) => tema.url.includes('{pesquisa}'));
    const urlDescobrir = TMDB.series.find((tema) => tema.name === 'Descobrir')?.url || '';
    const generosSeries = (TMDB.Generos || []).flatMap((grupo) => Array.isArray(grupo.series) ? grupo.series : []);
    const temasGeneros = generosSeries.map((generoItem) => ({
        name: generoItem.name,
        url: urlDescobrir.replace('{genero}', String(generoItem.id))
    }));
    const temasParaExibir = [...temasSeries, ...temasGeneros];
    const termoPesquisaNormalizado = termoPesquisa.trim();
    const pesquisaAtiva = termoPesquisaNormalizado.length >= 2;
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + TMDB.key
        }
    };

    const normalizarPagina = (valor, fallback) => {
        const pagina = Number(valor);
        return Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : fallback;
    };

    const normalizarTotalPaginas = (valor, fallback) => {
        const total = Number(valor);
        if (!Number.isFinite(total) || total <= 0) {
            return fallback;
        }

        // TMDB permite no maximo 500 paginas para navegacao.
        return Math.min(500, Math.floor(total));
    };

    const carregarPaginaTema = (urlTema, pagina) => {
        const urlComPagina = urlTema.includes('{pagina}')
            ? urlTema.replaceAll('{pagina}', String(pagina))
            : urlTema;

        const endpoint = new URL(urlComPagina);

        if (!urlTema.includes('{pagina}')) {
            endpoint.searchParams.set('page', String(pagina));
        }

        return fetch(endpoint.toString(), options)
            .then(async (res) => {
                const payload = await res.json();

                if (!res.ok) {
                    throw new Error(payload?.status_message || `TMDB retornou erro HTTP ${res.status}`);
                }

                if (payload?.success === false) {
                    throw new Error(payload?.status_message || 'TMDB retornou falha na requisicao');
                }

                const paginaAtual = normalizarPagina(payload?.page, pagina);
                const totalPaginas = normalizarTotalPaginas(payload?.total_pages, paginaAtual);
                console.log(`Carregou ${payload?.results?.length || 0} séries para pagina ${paginaAtual} de ${totalPaginas} (URL: ${endpoint.toString()})`);
                return {
                    results: Array.isArray(payload?.results) ? payload.results : [],
                    page: paginaAtual,
                    totalPages: Math.max(paginaAtual, totalPaginas)
                };
            });
    };

    const obterBordasCortadas = (trilho) => {
        if (!trilho) {
            return { esquerda: false, direita: false };
        }

        const margem = 1;
        const esquerda = trilho.scrollLeft > margem;
        const direita = trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - margem;

        return { esquerda, direita };
    };

    const atualizarBordas = (tema) => {
        const trilho = carrosselRefs.current[tema];

        if (!trilho) {
            return;
        }

        const { esquerda, direita } = obterBordasCortadas(trilho);

        setBordasVisiveis((anterior) => {
            const atual = anterior[tema];

            if (atual && atual.esquerda === esquerda && atual.direita === direita) {
                return anterior;
            }

            return {
                ...anterior,
                [tema]: { esquerda, direita }
            };
        });
    };

    useEffect(() => {
        document.title = 'VS | Séries';
    }, []);

    useEffect(() => {
            Promise.allSettled(
            temasParaExibir.map((tema) =>
                carregarPaginaTema(tema.url, 1)
                    .then((res) => ({
                        tema: tema.name,
                        url: tema.url,
                        series: res.results,
                        pagina: res.page,
                        totalPaginas: res.totalPages,
                        carregandoMais: false
                    }))
            )
        )
            .then((resultado) => {
                const secoesValidas = resultado
                    .filter((item) => item.status === 'fulfilled')
                    .map((item) => item.value);

                resultado
                    .filter((item) => item.status === 'rejected')
                    .forEach((item) => console.error(item.reason));

                setCarrosseis(secoesValidas);
            })
            .finally(() => setCarregando(false));
    }, []);

    useEffect(() => {
        if (carregando) {
            return;
        }

        const atualizarTodos = () => {
            carrosseis.forEach((secao) => {
                atualizarBordas(secao.tema);
            });
        };

        const raf = requestAnimationFrame(atualizarTodos);
        window.addEventListener('resize', atualizarTodos);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', atualizarTodos);
        };
    }, [carrosseis, carregando]);

    useEffect(() => {
        if (!pesquisaAtiva) {
            setResultadosPesquisa([]);
            setErroPesquisa('');
            setPesquisando(false);
            setPaginaPesquisa(1);
            setTotalPaginasPesquisa(1);
            return;
        }

        const termo = termoPesquisaNormalizado;
        const temporizador = setTimeout(() => {
            const requisicaoId = pesquisaRequisicaoAtual.current + 1;
            pesquisaRequisicaoAtual.current = requisicaoId;

            setPesquisando(true);
            setErroPesquisa('');

            carregarPesquisaPagina(termo, 1)
                .then((res) => {
                    if (requisicaoId !== pesquisaRequisicaoAtual.current) {
                        return;
                    }

                    setResultadosPesquisa(res.results);
                    setPaginaPesquisa(res.page);
                    setTotalPaginasPesquisa(res.totalPages);
                })
                .catch((err) => {
                    if (requisicaoId !== pesquisaRequisicaoAtual.current) {
                        return;
                    }

                    console.error(err);
                    setResultadosPesquisa([]);
                    setErroPesquisa('Nao foi possivel pesquisar no momento.');
                })
                .finally(() => {
                    if (requisicaoId === pesquisaRequisicaoAtual.current) {
                        setPesquisando(false);
                    }
                });
        }, 380);

        return () => {
            clearTimeout(temporizador);
        };
    }, [termoPesquisaNormalizado, pesquisaAtiva]);

    const carregarMaisFilmes = (temaNome) => {
        if (requisicoesEmAndamento.current.has(temaNome)) {
            return;
        }

        const secaoAtual = carrosseis.find((secao) => secao.tema === temaNome);

        if (!secaoAtual) {
            return;
        }

        const atingiuFim = secaoAtual.pagina >= secaoAtual.totalPaginas;
        if (secaoAtual.carregandoMais || atingiuFim) {
            return;
        }

        const requisicao = {
            tema: secaoAtual.tema,
            url: secaoAtual.url,
            proximaPagina: secaoAtual.pagina + 1
        };

        requisicoesEmAndamento.current.add(temaNome);

        setCarrosseis((anterior) => anterior.map((secao) => {
            if (secao.tema !== temaNome) {
                return secao;
            }

            return {
                ...secao,
                carregandoMais: true
            };
        }));

        carregarPaginaTema(requisicao.url, requisicao.proximaPagina)
            .then((res) => {
                setCarrosseis((anterior) => anterior.map((secao) => {
                    if (secao.tema !== requisicao.tema) {
                        return secao;
                    }

                    const idsExistentes = new Set(secao.series.map((serie) => serie.id));
                    const novasSeries = res.results.filter((serie) => !idsExistentes.has(serie.id));

                    return {
                        ...secao,
                        series: [...secao.series, ...novasSeries],
                        pagina: res.page,
                        totalPaginas: Math.max(secao.totalPaginas, res.totalPages),
                        carregandoMais: false
                    };
                }));

                requestAnimationFrame(() => {
                    verificarFimCarrossel(requisicao.tema);
                });
            })
            .catch((err) => {
                console.error(err);
                setCarrosseis((anterior) => anterior.map((secao) => {
                    if (secao.tema !== temaNome) {
                        return secao;
                    }

                    return {
                        ...secao,
                        carregandoMais: false
                    };
                }));
            })
            .finally(() => {
                requisicoesEmAndamento.current.delete(temaNome);
            });
    };

    const verificarFimCarrossel = (temaNome) => {
        const trilho = carrosselRefs.current[temaNome];

        if (!trilho) {
            return;
        }

        const distanciaAteOFim = trilho.scrollWidth - (trilho.scrollLeft + trilho.clientWidth);
        const limiteAntecipado = Math.max(700, Math.floor(trilho.clientWidth * 1.1));

        if (distanciaAteOFim <= limiteAntecipado) {
            carregarMaisFilmes(temaNome);
        }
    };

    const scrollCarrossel = (tema, direcao) => {
        const trilho = carrosselRefs.current[tema];

        if (!trilho) {
            return;
        }

        const passo = Math.max(280, Math.floor(trilho.clientWidth * 0.9));
        trilho.scrollBy({
            left: direcao === 'direita' ? passo : -passo,
            behavior: 'smooth'
        });

        requestAnimationFrame(() => {
            verificarFimCarrossel(tema);
        });
    };

    const carregarPesquisaPagina = (termo, pagina) => {
        if (!Pesquisa?.url) {
            return Promise.resolve({
                results: [],
                page: 1,
                totalPages: 1
            });
        }

        const urlPesquisa = Pesquisa.url
            .replaceAll('{pesquisa}', encodeURIComponent(termo))
            .replaceAll('{pagina}', String(pagina));

        return carregarPaginaTema(urlPesquisa, pagina);
    };

    const carregarMaisResultadosPesquisa = () => {
        if (!pesquisaAtiva || pesquisando || carregandoMaisPesquisa || paginaPesquisa >= totalPaginasPesquisa) {
            return;
        }

        setCarregandoMaisPesquisa(true);
        carregarPesquisaPagina(termoPesquisaNormalizado, paginaPesquisa + 1)
            .then((res) => {
                setResultadosPesquisa((anterior) => {
                    const idsExistentes = new Set(anterior.map((serie) => serie.id));
                    const novasSeries = res.results.filter((serie) => !idsExistentes.has(serie.id));
                    return [...anterior, ...novasSeries];
                });
                setPaginaPesquisa(res.page);
                setTotalPaginasPesquisa(res.totalPages);
            })
            .catch((err) => {
                console.error(err);
                setErroPesquisa('Nao foi possivel carregar mais resultados.');
            })
            .finally(() => {
                setCarregandoMaisPesquisa(false);
            });
    };

    const OpenSearch = () => {
        setBuscaAberta((anterior) => !anterior);
    };

    const renderSeries = (series) => {
        return series.map((serie) => (
            <button key={serie.id} className='Card' onClick={() => navigate(`/serie/${serie.id}`)} type='button'>
                <img
                    src={serie.poster_path ? `${imageBaseUrl}${serie.poster_path}` : `https://placehold.co/500x750?text=${encodeURIComponent(serie.name)}`}
                    alt={serie.name}
                    loading='lazy'
                    decoding='async'
                />
            </button>
        ));
    };
    const renderBarSearch = () => {
        return (
            <div className={`SearchBar ${buscaAberta ? 'SearchBarOpen' : ''}`.trim()}>
                <input
                    type='text'
                    placeholder='Pesquisar séries...'
                    className='Input_Search'
                    aria-label='Pesquisar séries'
                    value={termoPesquisa}
                    onChange={(event) => setTermoPesquisa(event.target.value)}
                />
            </div>
        );
    };

    return (
        <section className='SeriesPage'>
            <header className='SeriesHeader'>
                <div className='Mensagens'>
                    <h1>Séries</h1>
                    <p>{fraseAleatoria}</p>
                </div>
                <div className='SearchDiv'>
                    <button
                        type='button'
                        className='SearchToggle'
                        onClick={OpenSearch}
                        aria-label='Abrir pesquisa'
                        aria-expanded={buscaAberta}
                    >
                        <SearchIcon className='SearchIcon' />
                    </button>
                    {renderBarSearch()}
                </div>
            </header>

            <div className='CarrosselLista'>
                {!pesquisaAtiva && carregando && <p className='LoadingText'>Carregando catalogo...</p>}

                {pesquisaAtiva && (
                    <section className='CarrosselSecao'>
                        <div className='CarrosselTopo'>
                            <h2>Resultados para "{termoPesquisaNormalizado}"</h2>
                        </div>

                        <div className='CarrosselTrilho sem-esquerda sem-direita'>
                            <div className='Filmes Pesquisa'>
                                {pesquisando && <p className='SearchStatus'>Pesquisando...</p>}
                                {!pesquisando && erroPesquisa && <p className='SearchStatus'>{erroPesquisa}</p>}
                                {!pesquisando && !erroPesquisa && resultadosPesquisa.length === 0 && (
                                    <p className='SearchStatus'>Nenhuma série encontrada para essa busca.</p>
                                )}
                                {!pesquisando && !erroPesquisa && resultadosPesquisa.length > 0 && renderSeries(resultadosPesquisa)}
                            </div>
                        </div>
                    </section>
                )}

                {!pesquisaAtiva && !carregando && carrosseis.map((secao) => (
                    <section key={secao.tema} className='CarrosselSecao'>
                        <div className='CarrosselTopo'>
                            <h2>{secao.tema}</h2>
                            <div className='CarrosselControles'>
                                <button
                                    type='button'
                                    className='CarrosselBotao'
                                    onClick={() => scrollCarrossel(secao.tema, 'esquerda')}
                                    aria-label={`Rolar para a esquerda em ${secao.tema}`}
                                >
                                    ‹
                                </button>
                                <button
                                    type='button'
                                    className='CarrosselBotao'
                                    onClick={() => scrollCarrossel(secao.tema, 'direita')}
                                    aria-label={`Rolar para a direita em ${secao.tema}`}
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                        <div
                            className={`CarrosselTrilho ${bordasVisiveis[secao.tema]?.esquerda ? '' : 'sem-esquerda'} ${bordasVisiveis[secao.tema]?.direita ? '' : 'sem-direita'}`.trim()}
                        >
                            <div
                                className='Filmes'
                                onScroll={() => {
                                    atualizarBordas(secao.tema);
                                    verificarFimCarrossel(secao.tema);
                                }}
                                ref={(el) => {
                                    carrosselRefs.current[secao.tema] = el;

                                    if (el) {
                                        requestAnimationFrame(() => {
                                            atualizarBordas(secao.tema);
                                            verificarFimCarrossel(secao.tema);
                                        });
                                    }
                                }}
                            >
                                {secao.series.length > 0 ? renderSeries(secao.series) : <p className='LoadingText'>Sem séries disponiveis neste tema.</p>}
                                {secao.carregandoMais && (
                                    <div className='Card CardCarregando'>
                                        <p>Carregando mais...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </section>
    )
}

export default Series
