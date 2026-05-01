import React, { useEffect, useRef, useState } from 'react';
import TMDB from '../../itens/TMDB.json';
import frases from '../../itens/mensagens.json';
import './TV.css';

const categoriasTV = (TMDB.Generos || []).flatMap((grupo) => Array.isArray(grupo.tv) ? grupo.tv : []);

const TV = () => {
    const [eventosEsportivos, setEventosEsportivos] = useState([]);
    const [eventoAtualIndex, setEventoAtualIndex] = useState(0);
    const [carrosseis, setCarrosseis] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [erroEventos, setErroEventos] = useState('');
    const [bordasVisiveis, setBordasVisiveis] = useState({ esportes: { esquerda: false, direita: false } });
    const [isPaused, setIsPaused] = useState(false);
    const trilhoRefs = useRef({});
    const bordasRafRef = useRef({});
    const [fraseAleatoria] = useState(() => {
        const lista = Array.isArray(frases.TV) ? frases.TV : [];
        if (!lista.length) {
            return '';
        }

        return lista[Math.floor(Math.random() * lista.length)];
    });

    useEffect(() => {
        document.title = 'VS | TV';
    }, []);

    useEffect(() => {
        const getTv = async () => {
            const respostaEventos = await fetch(TMDB.TV[0].url)
                .then(async (response) => {
                    const dadosEventos = await response.json();

                    if (!response.ok) {
                        throw new Error(dadosEventos?.message || 'Nao foi possivel carregar os eventos esportivos.');
                    }

                    const eventos = Array.isArray(dadosEventos?.data)
                        ? dadosEventos.data
                        : Array.isArray(dadosEventos?.results)
                            ? dadosEventos.results
                            : [];

                    return eventos.filter((evento) => evento?.poster || evento?.image || evento?.logo_url);
                })
                .catch((error) => {
                    setErroEventos(error instanceof Error ? error.message : 'Nao foi possivel carregar os eventos esportivos.');
                    return [];
                });

            const respostaCategorias = await Promise.allSettled(
                categoriasTV.map(async (categoria) => {
                    const endpoint = TMDB.TV[1].url.replace('{category}', categoria.id);
                    const response = await fetch(endpoint);
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data?.message || `Nao foi possivel carregar ${categoria.name}.`);
                    }

                    const canais = Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];

                    return {
                        id: categoria.id,
                        name: categoria.name,
                        canais
                    };
                })
            );

            const categoriasValidas = respostaCategorias
                .filter((resultado) => resultado.status === 'fulfilled')
                .map((resultado) => resultado.value)
                .filter((categoria) => Array.isArray(categoria.canais) && categoria.canais.length > 0);

            respostaCategorias
                .filter((resultado) => resultado.status === 'rejected')
                .forEach((resultado) => {
                    console.error(resultado.reason);
                });

            setEventosEsportivos(respostaEventos);
            setEventoAtualIndex(0);
            setCarrosseis(categoriasValidas);
            setCarregando(false);
        };

        getTv();
    }, []);

    useEffect(() => {
        if (carregando) {
            return;
        }

        const atualizarBordas = () => {
            const novosEstados = {};

            const trilhoEventos = trilhoRefs.current.esportes;

            if (trilhoEventos) {
                const margem = 1;
                novosEstados.esportes = {
                    esquerda: trilhoEventos.scrollLeft > margem,
                    direita: trilhoEventos.scrollLeft + trilhoEventos.clientWidth < trilhoEventos.scrollWidth - margem
                };
            }

            carrosseis.forEach((secao) => {
                const trilho = trilhoRefs.current[secao.id];

                if (!trilho) {
                    novosEstados[secao.id] = { esquerda: false, direita: false };
                    return;
                }

                const margem = 1;
                novosEstados[secao.id] = {
                    esquerda: trilho.scrollLeft > margem,
                    direita: trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - margem
                };
            });

            setBordasVisiveis(novosEstados);
        };

        const raf = requestAnimationFrame(atualizarBordas);
        window.addEventListener('resize', atualizarBordas);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', atualizarBordas);
        };
    }, [carrosseis, carregando]);

    useEffect(() => {
        if (!eventosEsportivos.length) {
            return undefined;
        }

        const intervalo = window.setInterval(() => {
            setEventoAtualIndex((indiceAtual) => {
                if (isPaused) return indiceAtual;
                return (indiceAtual + 1) % eventosEsportivos.length;
            });
        }, 4500);

        return () => window.clearInterval(intervalo);
    }, [eventosEsportivos, isPaused]);

    const atualizarBordasAtuais = (categoriaId) => {
        const trilho = trilhoRefs.current[categoriaId];

        if (!trilho) {
            return;
        }

        const margem = 1;
        const esquerda = trilho.scrollLeft > margem;
        const direita = trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - margem;

        setBordasVisiveis((anterior) => {
            const atual = anterior[categoriaId];

            if (atual && atual.esquerda === esquerda && atual.direita === direita) {
                return anterior;
            }

            return {
                ...anterior,
                [categoriaId]: { esquerda, direita }
            };
        });
    };

    const atualizarBordasEventos = () => {
        const trilho = trilhoRefs.current.esportes;

        if (!trilho) {
            return;
        }

        const margem = 1;
        const esquerda = trilho.scrollLeft > margem;
        const direita = trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - margem;

        setBordasVisiveis((anterior) => {
            const atual = anterior.esportes;

            if (atual && atual.esquerda === esquerda && atual.direita === direita) {
                return anterior;
            }

            return {
                ...anterior,
                esportes: { esquerda, direita }
            };
        });
    };

    const agendarAtualizacaoBordas = (chave) => {
        const frameAnterior = bordasRafRef.current[chave];

        if (frameAnterior) {
            cancelAnimationFrame(frameAnterior);
        }

        bordasRafRef.current[chave] = requestAnimationFrame(() => {
            delete bordasRafRef.current[chave];

            if (chave === 'esportes') {
                atualizarBordasEventos();
                return;
            }

            atualizarBordasAtuais(chave);
        });
    };

    const scrollCarrossel = (categoriaId, direcao) => {
        const trilho = trilhoRefs.current[categoriaId];

        if (!trilho) {
            return;
        }

        const distancia = Math.max(240, Math.floor(trilho.clientWidth * 0.9));

        trilho.scrollBy({
            left: direcao === 'esquerda' ? -distancia : distancia,
            behavior: 'smooth'
        });
    };

    const abrirEvento = (evento) => {
        const embedUrl = Array.isArray(evento?.embeds) ? evento.embeds[0]?.embed_url : '';

        if (!embedUrl) {
            return;
        }

        const titulo = `${evento?.title || 'Evento esportivo'} | Rei dos Canais | VS`;
        const popup = window.open(
            '',
            '_blank',
            `left=0,top=0,width=${window.screen.availWidth},height=${window.screen.availHeight}`
        );

        if (!popup) {
            return;
        }

        popup.document.open();
        popup.document.write(`<!doctype html><html><head><title>${titulo}</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;}iframe{border:0;display:block;width:100%;height:100%;}</style></head><body><iframe src="${embedUrl}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`);
        popup.document.close();
        popup.document.title = titulo;
        popup.moveTo(0, 0);
        popup.resizeTo(window.screen.availWidth, window.screen.availHeight);
        popup.focus();
    };

    const eventoAtual = eventosEsportivos.length > 0
        ? eventosEsportivos[eventoAtualIndex % eventosEsportivos.length]
        : null;

    const abrirCanal = (item, nome) => {
        if (!item?.embed_url) {
            return;
        }

        const popup = window.open(
            '',
            '_blank',
            `left=0,top=0,width=${window.screen.availWidth},height=${window.screen.availHeight}`
        );

        if (!popup) {
            return;
        }

        const titulo = `${nome} | Rei dos Canais | VS`;

        popup.document.open();
        popup.document.write(`<!doctype html><html><head><title>${titulo}</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;}iframe{border:0;display:block;width:100%;height:100%;}</style></head><body><iframe src="${item.embed_url}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`);
        popup.document.close();
        popup.document.title = titulo;
        popup.moveTo(0, 0);
        popup.resizeTo(window.screen.availWidth, window.screen.availHeight);
        popup.focus();
    };

    const formatarInicioEvento = (valor) => {
        if (!valor || typeof valor !== 'string') {
            return 'Horário indisponível';
        }

        const [data, hora] = valor.split(' ');

        if (!data || !hora) {
            return valor;
        }

        const [ano, mes, dia] = data.split('-');

        if (!ano || !mes || !dia) {
            return hora.slice(0, 5);
        }

        return `${dia}/${mes} às ${hora.slice(0, 5)}`;
    };

    const inicioEventoAtual = formatarInicioEvento(eventoAtual?.start_time);

    const renderTv = (canais) => {
        if (!Array.isArray(canais) || canais.length === 0) {
            return <p className='TVStatus'>Nenhum canal disponivel nesta categoria.</p>;
        }

        return canais.map((item) => {
            const nome = item?.name || item?.title || 'Canal sem nome';
            const categoria = item?.category || item?.genre || 'Sem categoria';

            return (
                <article key={item?.id ?? nome} className='ChannelCard' onClick={() => abrirCanal(item, nome)}>
                    <div className='ChannelFallback'>
                        {item?.logo_url ? <img src={item.logo_url} alt={nome} loading='lazy' decoding='async' /> : null}
                        <div className='ChannelInfo'>
                            <h3>{nome}</h3>
                            <p>{categoria}</p>
                        </div>
                    </div>
                </article>
            );
        });
    };

    return (
        <section className='TVPage'>
            <header className='TVHeader'>
                <h1>TV</h1>
                <p>{fraseAleatoria}</p>
            </header>

            <div className='CarrosselLista'>
                <section className='CarrosselSecao CarrosselDestaque'>
                    <div className='CarrosselTopo'>
                        <h2>Eventos Esportivos</h2>
                        {eventosEsportivos.length > 1 && (
                            <span className='SportCounter'>
                                {String(eventoAtualIndex + 1).padStart(2, '0')}/{String(eventosEsportivos.length).padStart(2, '0')}
                            </span>
                        )}
                    </div>
                    {carregando && <p className='TVStatus'>Carregando eventos esportivos...</p>}
                    {!carregando && erroEventos && <p className='TVStatus'>{erroEventos}</p>}
                    {!carregando && !erroEventos && !eventoAtual && <p className='TVStatus'>Nenhum evento esportivo disponivel.</p>}
                    {!carregando && !erroEventos && eventoAtual && (
                        <article
                            className='SportHero'
                            onClick={() => abrirEvento(eventoAtual)}
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                        >
                            <div className='SportHeroMedia'>
                                {eventoAtual?.poster ? <img src={eventoAtual.poster} alt={eventoAtual.title || 'Evento esportivo'} loading='lazy' decoding='async' /> : <div className='SportPlaceholder SportHeroPlaceholder'>Sem imagem</div>}
                                <span className='SportBadge SportHeroBadge'>
                                    {eventoAtual?.status === 'live' ? 'Ao vivo' : eventoAtual?.status === 'upcoming' ? 'Em breve' : 'Disponivel'}
                                </span>
                            </div>
                            <div className='SportHeroOverlay'>
                                <div className='SportHeroText'>
                                    <p className='SportHeroKicker'>Destaque esportivo</p>
                                    <h3>{eventoAtual?.title || 'Evento esportivo'}</h3>
                                    <p>{eventoAtual?.description || eventoAtual?.category || 'Eventos ao vivo'}</p>
                                    <p className='SportHeroTime'>Início: {inicioEventoAtual}</p>
                                </div>
                            </div>
                        </article>
                    )}
                </section>

                {carregando && <p className='TVStatus'>Carregando canais...</p>}
                {!carregando && erro && <p className='TVStatus'>{erro}</p>}
                {!carregando && !erro && carrosseis.length === 0 && <p className='TVStatus'>Nenhuma categoria com canais disponivel.</p>}
                {!carregando && !erro && carrosseis.map((secao) => (
                    <section key={secao.id} className='CarrosselSecao'>
                        <div className='CarrosselTopo'>
                            <h2>{secao.name}</h2>
                            <div className='CarrosselControles'>
                                <button
                                    type='button'
                                    className='CarrosselBotao'
                                    onClick={() => scrollCarrossel(secao.id, 'esquerda')}
                                    aria-label={`Rolar canais de ${secao.name} para a esquerda`}
                                >
                                    ‹
                                </button>
                                <button
                                    type='button'
                                    className='CarrosselBotao'
                                    onClick={() => scrollCarrossel(secao.id, 'direita')}
                                    aria-label={`Rolar canais de ${secao.name} para a direita`}
                                >
                                    ›
                                </button>
                            </div>
                        </div>

                        <div className={`CarrosselTrilho ${bordasVisiveis[secao.id]?.esquerda ? '' : 'sem-esquerda'} ${bordasVisiveis[secao.id]?.direita ? '' : 'sem-direita'}`.trim()}>
                            <div
                                ref={(el) => {
                                    trilhoRefs.current[secao.id] = el;

                                    if (el) {
                                        agendarAtualizacaoBordas(secao.id);
                                    }
                                }}
                                className='TVTrilho'
                                onScroll={() => agendarAtualizacaoBordas(secao.id)}
                            >
                                {renderTv(secao.canais)}
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </section>
    );
};

export default TV;