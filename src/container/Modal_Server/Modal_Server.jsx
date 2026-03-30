import React, { useEffect, useState } from 'react'

export default function Modal_Server(movies) {
    const [videoServer, setVideoServer] = useState([]);
    const [provedor, setProvedor] = useState('');
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

    useEffect(() => {
        const movieCards = document.querySelectorAll('.MovieCard');
        console.log(movies)
        const handlers = [];
        movieCards.forEach(card => {
            const handleCardClick = () => {
                const name = card.getAttribute('data-name');
                const url = card.getAttribute('data-url');
                const provedor = card.getAttribute('data-prov');
                if (!url) return;
                if (provedor === "pobreflix") {
                    fetch(`http://localhost:3000/api/video/pobreflix/${encodeURIComponent(url)}`)
                        .then(response => response.json())
                        .then(data => {
                            add_videoData(name, 'video');
                            setVideoServer(data.videoResults);
                            console.log(data.videoResults);
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
                } else if (provedor === 'pomfy') {
                    const id = card.getAttribute('data-url');
                    fetch(`http://localhost:3000/api/video/pomfy/${encodeURIComponent(id)}`)
                        .then(response => response.json())
                        .then(data => {
                            setVideoServer(data.videoResults);
                            const iframeUrl = getPomfyIframeUrl(data.videoResults);
                            if (iframeUrl) {
                                window.open(iframeUrl, '_blank', 'noopener,noreferrer');
                            }
                            console.log(data.videoResults);
                        });
                    setProvedor('pomfy');
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
    const add_videoData = (name, tipo) => {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NTVjYTdhNTM4MjA0NTBmMjM5Y2E1YmYxMDQ1ODJjNCIsIm5iZiI6MTc1MjY4Njg3NS41OTcsInN1YiI6IjY4NzdlMTFiYzZlZjc3ZGJkMTQzZDNjOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.H7orvOjrk5A9XbrMrRc_mmwZ0ylPReyGoQPQCDdH4pE'
            }
        };
        fetch('https://api.themoviedb.org/3/search/movie?query=' + name + '&include_adult=false&language=pt-BR&page=1', options)
            .then(res => res.json())
            .then(res => setVideoData([{ url: res.results[0], tipo }]))
            .catch(err => console.error(err));
            setclosemodal(false);
    }

    const modal_card = () => {
        
        return videoData.map(data => (
            <div className='modal_card' key={data.url?.id}>
                <div className='backdrop'>
                    <img className='Backdrop_modal' src={'https://image.tmdb.org/t/p/original' + (closemodal ? '' : data.url?.backdrop_path)} alt={data.url?.title} />
                </div>

                <img className='Img_modal' src={'https://image.tmdb.org/t/p/w500' + (closemodal ? '' : data.url?.poster_path)} alt={data.url?.title} />

                <div className='Text_modal'>
                    <h2 className='Title_modal'>{closemodal ? '' : data.url?.title}</h2>
                    <h3 className='OriginalTitle_modal'>{ closemodal ? '' : data.url?.original_title}</h3>
                </div>

                <div className='overview'>
                    <p className='overview_modal'>{closemodal ? '' : data.url?.overview}</p>
                </div>
            </div>
        ))
    }
    const renderEP = () => {
        return videoServer.map(video => (
            <div className='option' data-url={video.url || video.url_episodio}>
                {video.server || video.numero_titulo || 'Abrir'}
            </div>
        ))
    }
    useEffect(() => {
        const option = document.querySelectorAll('.option');
        const handlers = [];

        option.forEach(opt => {
            const handleOptionClick = async () => {
                const url = opt.getAttribute('data-url');
                if (!url) return;

                if (provedor === 'pobreflix') {
                    window.open(url, '_blank');
                    return;
                }

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
            };

            opt.addEventListener('click', handleOptionClick);
            handlers.push({ opt, handleOptionClick });
        });

        return () => {
            handlers.forEach(({ opt, handleOptionClick }) => {
                opt.removeEventListener('click', handleOptionClick);
            });
        };
    }, [videoServer, provedor])
    useEffect(() => {
        console.log(videoData);
    }, [videoData])
    useEffect(() => {
        const closeModal = document.getElementById('Close_modal');
        if (!closeModal) return;

        const handleClose = () => {
            const modal = document.querySelector('.modal');
            modal.classList.remove('active');
            setVideoServer([]);
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
                <div className='options_modal'>
                    {renderEP()}
                </div>
            </div>
        </div>
    )
}
