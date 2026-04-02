import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import axios from 'axios';
// Olha a importação correta da V4 aqui:
import { animate, utils } from 'animejs';

export default function Prov({ clickProv }) {
    const [provedores, setProvedores] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    const listRef = useRef(null);

    const getSafeLogoSrc = (rawUrl) => {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;

        const normalized = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
        if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
            return `http://localhost:3000/api/image?url=${encodeURIComponent(normalized)}`;
        }

        return normalized;
    };

    const url_provedores = 'http://localhost:3000/api/provedores';
    useEffect(() => {
        axios.get(url_provedores)
            .then(response => {
                setProvedores(response.data);
            })
            .catch(error => {
                console.error('Error fetching provedores:', error);
            });
    }, []);

    const getMoveDistance = () => {
        const listEl = listRef.current;
        if (!listEl || !listEl.children[0]) return 0;
        const item = listEl.children[0];
        const style = window.getComputedStyle(item);
        const marginRight = parseFloat(style.marginRight) || 0;
        const gap = parseFloat(window.getComputedStyle(listEl).gap) || 0;
        return item.offsetWidth + Math.max(marginRight, gap);
    };

    const moveNext = () => {
        if (isAnimating || provedores.length <= 1) return;
        setIsAnimating(true);

        const listEl = listRef.current;
        const moveDistance = getMoveDistance();

        // 1. Usando o 'animate' nativo da V4
        animate(listEl, {
            translateX: -moveDistance,
            duration: 400,
            ease: 'inOutSine', // Na V4 é 'ease' e não 'easing'
            onComplete: () => {
                flushSync(() => {
                    setProvedores((current) => [...current.slice(1), current[0]]);
                });

                // 2. Usando o 'utils.set' da V4 para aplicar a mudança instantânea!
                utils.set(listEl, { translateX: 0 });
                setIsAnimating(false);
            }
        });
    };

    const movePrev = () => {
        if (isAnimating || provedores.length <= 1) return;
        setIsAnimating(true);

        const listEl = listRef.current;
        const moveDistance = getMoveDistance();

        flushSync(() => {
            setProvedores((current) => [current[current.length - 1], ...current.slice(0, -1)]);
        });

        // Jogando para trás instantaneamente com o 'utils.set'
        utils.set(listEl, { translateX: -moveDistance });

        // Animando de volta ao centro
        animate(listEl, {
            translateX: 0,
            duration: 400,
            ease: 'inOutSine',
            onComplete: () => setIsAnimating(false)
        });
    };

    const handleProviderSelect = (provedor) => {
        setSelectedProvider(provedor.nome);
        clickProv(provedor.comando);
    };

    const renderProvedores = () => {
        return provedores.map(provedor => (
            <div
                className={`prov_options ${selectedProvider === provedor.nome ? 'active' : ''}`}
                data-prov={provedor.nome}
                key={provedor.nome}
                onClick={() => handleProviderSelect(provedor)}
            >
                <div className='content_prov'>
                    <div className='content provedor'>
                        <img
                            className='prov_logo'
                            src={getSafeLogoSrc(provedor.logo)}
                            alt={provedor.nome}
                            loading='lazy'
                            referrerPolicy='no-referrer'
                            onError={(event) => {
                                event.currentTarget.src = '';
                            }}
                        />
                        <div className='prov_text'>
                            <h2>{provedor.CNL === false ? provedor.nome : null}</h2>
                            <p>{provedor.warning}</p>
                        </div>
                    </div>
                    <div className='back_prov'></div>
                </div>
            </div>
        ));
    }

    return (
        <div className='provedores_carousel'>
            <button type='button' className='carousel_nav prev' onClick={movePrev} aria-label='Anterior'>
                {'<'}
            </button>

            {/* NOVA DIV AQUI: Ela vai ser a "janela" que esconde os itens */}
            <div className='provedores_viewport'>
                <div className='provedores_list' ref={listRef}>
                    {renderProvedores()}
                </div>
            </div>

            <button type='button' className='carousel_nav next' onClick={moveNext} aria-label='Proximo'>
                {'>'}
            </button>
        </div>
    )
}