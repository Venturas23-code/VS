// TMDB API Configuration
const TMDB_API_KEY = 'INSIRA_SUA_API_KEY_AQUI'; // Será substituída dinamicamente
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_AUTH_REQUEST_URL = 'https://www.themoviedb.org/authenticate';

// Token de sessão para acesso à API TMDB
export const authService = {
  // Obter token de requisição (primeira etapa do OAuth)
  async getRequestToken() {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/authentication/token/new?api_key=${TMDB_API_KEY}`
      );
      if (!response.ok) throw new Error('Falha ao gerar token de requisição');
      
      const data = await response.json();
      return data.request_token;
    } catch (error) {
      console.error('Erro ao gerar request token:', error);
      throw error;
    }
  },

  // Gerar URL de autorização do TMDB
  getAuthorizationUrl(requestToken) {
    return `${TMDB_AUTH_REQUEST_URL}/${requestToken}`;
  },

  // Converter token de requisição em token de sessão (terceira etapa)
  async getSessionToken(requestToken) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/authentication/session/new?api_key=${TMDB_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_token: requestToken })
        }
      );
      
      if (!response.ok) throw new Error('Falha ao criar sessão');
      
      const data = await response.json();
      return data.session_id;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      throw error;
    }
  },

  // Obter dados do usuário autenticado
  async getAccountDetails(sessionId) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/account?api_key=${TMDB_API_KEY}&session_id=${sessionId}`
      );
      
      if (!response.ok) throw new Error('Falha ao obter dados da conta');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter dados da conta:', error);
      throw error;
    }
  },

  // Obter WhiteList (rated items) do usuário
  async getUserRatedItems(accountId, sessionId, type = 'movies') {
    try {
      const endpoint = type === 'movies' ? 'rated/movies' : 'rated/tv';
      const response = await fetch(
        `${TMDB_BASE_URL}/account/${accountId}/${endpoint}?api_key=${TMDB_API_KEY}&session_id=${sessionId}&sort_by=created_at.desc`
      );
      
      if (!response.ok) throw new Error(`Falha ao obter ${type} avaliados`);
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Erro ao obter ${type} avaliados:`, error);
      return [];
    }
  },

  // Obter Favoritos do usuário
  async getUserFavorites(accountId, sessionId, type = 'movies') {
    try {
      const endpoint = type === 'movies' ? 'favorite/movies' : 'favorite/tv';
      const response = await fetch(
        `${TMDB_BASE_URL}/account/${accountId}/${endpoint}?api_key=${TMDB_API_KEY}&session_id=${sessionId}&sort_by=created_at.desc`
      );
      
      if (!response.ok) throw new Error(`Falha ao obter favoritos de ${type}`);
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Erro ao obter favoritos de ${type}:`, error);
      return [];
    }
  },

  // Marcar como favorito
  async addToFavorites(accountId, sessionId, mediaId, mediaType, isFavorite = true) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/account/${accountId}/favorite?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: mediaType,
            media_id: mediaId,
            favorite: isFavorite
          })
        }
      );
      
      if (!response.ok) throw new Error('Falha ao marcar como favorito');
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao marcar como favorito:', error);
      throw error;
    }
  },

  // Logout - apenas limpa dados locais (TMDB não tem logout)
  logout() {
    localStorage.removeItem('tmdb_session_id');
    localStorage.removeItem('tmdb_account_id');
    localStorage.removeItem('tmdb_user_data');
  }
};

// Serviço de armazenamento local
export const storageService = {
  setSessionData(sessionId, accountId, userData) {
    localStorage.setItem('tmdb_session_id', sessionId);
    localStorage.setItem('tmdb_account_id', accountId);
    localStorage.setItem('tmdb_user_data', JSON.stringify(userData));
  },

  getSessionData() {
    return {
      sessionId: localStorage.getItem('tmdb_session_id'),
      accountId: localStorage.getItem('tmdb_account_id'),
      userData: JSON.parse(localStorage.getItem('tmdb_user_data') || '{}')
    };
  },

  isAuthenticated() {
    return !!localStorage.getItem('tmdb_session_id');
  },

  saveFavorites(favorites) {
    localStorage.setItem('user_favorites', JSON.stringify(favorites));
  },

  getFavorites() {
    return JSON.parse(localStorage.getItem('user_favorites') || '[]');
  },

  saveWatchlist(watchlist) {
    localStorage.setItem('user_whitelist', JSON.stringify(watchlist));
  },

  getWatchlist() {
    return JSON.parse(localStorage.getItem('user_whitelist') || '[]');
  },

  saveUserStatistics(stats) {
    localStorage.setItem('user_statistics', JSON.stringify(stats));
  },

  getUserStatistics() {
    return JSON.parse(localStorage.getItem('user_statistics') || '{"totalWatched": 0, "totalFavorites": 0, "lastWatchedDate": null}');
  },

  clearAll() {
    localStorage.removeItem('tmdb_session_id');
    localStorage.removeItem('tmdb_account_id');
    localStorage.removeItem('tmdb_user_data');
    localStorage.removeItem('user_favorites');
    localStorage.removeItem('user_whitelist');
    localStorage.removeItem('user_statistics');
  }
};
