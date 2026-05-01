import './index.css';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Filmes from './components/Filmes/Filmes';
import Series from './components/Series/Series';
import TV from './components/TV/TV';
import Filme from './components/Filmes/id';
import Serie from './components/Series/id';
import Painel from './components/Painel_Lateral/Painel';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Painel/>
        <main>
          <Routes>
            <Route path="/" element={<Filmes />} />
            <Route path="/filme/:id" element={<Filme />} />
            <Route path="/series" element={<Series />} />
            <Route path="/serie/:id" element={<Serie />} />
            <Route path="/tv" element={<TV />} />
          </Routes>
        </main>
      </HashRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
