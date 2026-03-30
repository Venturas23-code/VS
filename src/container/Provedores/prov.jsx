import React, {useEffect, useRef, useState} from 'react'
import axios from 'axios'

export default function Prov({clickProv}) {
    const [provedores, setProvedores] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationDirection, setAnimationDirection] = useState('');
    const animationTimeoutRef = useRef(null);
    const animationDurationMs = 220;

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

    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    const animateAndRotate = (direction) => {
        if (isAnimating) return;

        setAnimationDirection(direction);
        setIsAnimating(true);

        animationTimeoutRef.current = setTimeout(() => {
            setProvedores((current) => {
                if (current.length <= 1) return current;
                if (direction === 'next') {
                    return [...current.slice(1), current[0]];
                }
                return [current[current.length - 1], ...current.slice(0, -1)];
            });

            setIsAnimating(false);
            setAnimationDirection('');
        }, animationDurationMs);
    };

    const moveNext = () => {
        animateAndRotate('next');
    };

    const movePrev = () => {
        animateAndRotate('prev');
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
                    <h2>{provedor.CNL === false ? provedor.nome : null}</h2>
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
            <div className={`provedores_list ${isAnimating ? `is-animating ${animationDirection}` : ''}`}>
                {renderProvedores()}
            </div>
            <button type='button' className='carousel_nav next' onClick={moveNext} aria-label='Proximo'>
                {'>'}
            </button>
    </div>
  )
}
