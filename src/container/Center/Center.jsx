import React,{useState, useEffect} from 'react'
import MoviesCards from '../moviesCards/MoviesCards.jsx'
import Modal_Server from '../Modal_Server/Modal_Server.jsx'
import Prov from '../Provedores/prov.jsx'
import Search from '../elements/input_search/Search.jsx'
import './Center.css'

const Center = () => {
    const [videoServer, setVideoServer] = useState([]);
    const [provedor, setProvedor] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleProviderChange = (nextProvider) => {
      setVideoServer([]);
      setProvedor(nextProvider);
    };
    const handleSearchTermChange = (term) => {
      setSearchTerm(term);
      console.log('Termo de busca atualizado:', term);
    }

    useEffect(() => {
      if (!provedor) return;

      console.log('Provedor selecionado:', provedor);
    }, [provedor]);

  return (
    <div className='Carregado_Provedor' id='Carregado_Provedor'>
        <Prov clickProv={handleProviderChange} />
        <Modal_Server movies={videoServer} />
        <Search setSearchTerm={handleSearchTermChange}/>
        <MoviesCards key={provedor || 'no-provider'} exportmovies={setVideoServer} provedor={provedor} searchTerm={searchTerm}/>
    </div>
  )
}

export default Center