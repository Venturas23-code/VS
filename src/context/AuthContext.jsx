import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, storageService } from '../services/authService';

// Criar contexto de autenticação
const AuthContext = createContext(null);

// Provider de autenticação
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    sessionId: null,
    accountId: null,
    userData: null,
    favorites: [],
    whitelist: [],
    statistics: {
      totalWatched: 0,
      totalFavorites: 0,
      lastWatchedDate: null
    },
    isLoading: true,
    error: null
  });

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    const sessionData = storageService.getSessionData();
    if (sessionData.sessionId) {
      setAuth(prevState => ({
        ...prevState,
        isAuthenticated: true,
        sessionId: sessionData.sessionId,
        accountId: sessionData.accountId,
        userData: sessionData.userData,
        favorites: storageService.getFavorites(),
        whitelist: storageService.getWatchlist(),
        statistics: storageService.getUserStatistics(),
        isLoading: false
      }));
    } else {
      setAuth(prevState => ({
        ...prevState,
        isLoading: false
      }));
    }
  }, []);

  // Função de login
  const login = async (apiKey) => {
    try {
      setAuth(prevState => ({ ...prevState, isLoading: true, error: null }));

      // Atualizar a chave API no serviço
      window.TMDB_API_KEY = apiKey;

      // Primeira etapa: obter token de requisição
      const requestToken = await authService.getRequestToken();
      const authUrl = authService.getAuthorizationUrl(requestToken);

      // Abrir janela de autorização (será chamada manualmente ou com função customizada)
      return {
        authUrl,
        requestToken,
        complete: async () => {
          // Terceira etapa: converter token em sessão
          const sessionId = await authService.getSessionToken(requestToken);
          const accountData = await authService.getAccountDetails(sessionId);

          // Buscar dados da conta
          const favorites = await authService.getUserFavorites(accountData.id, sessionId);
          const whitelist = await authService.getUserRatedItems(accountData.id, sessionId);

          // Salvar dados localmente
          storageService.setSessionData(sessionId, accountData.id, accountData);
          storageService.saveFavorites(favorites);
          storageService.saveWatchlist(whitelist);

          // Atualizar estado
          setAuth({
            isAuthenticated: true,
            sessionId,
            accountId: accountData.id,
            userData: accountData,
            favorites,
            whitelist,
            statistics: storageService.getUserStatistics(),
            isLoading: false,
            error: null
          });

          return { success: true, userData: accountData };
        }
      };
    } catch (error) {
      setAuth(prevState => ({
        ...prevState,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  };

  // Função de logout
  const logout = () => {
    storageService.clearAll();
    setAuth({
      isAuthenticated: false,
      sessionId: null,
      accountId: null,
      userData: null,
      favorites: [],
      whitelist: [],
      statistics: {
        totalWatched: 0,
        totalFavorites: 0,
        lastWatchedDate: null
      },
      isLoading: false,
      error: null
    });
  };

  // Função para adicionar aos favoritos
  const addToFavorites = async (mediaId, mediaType, isFavorite = true) => {
    if (!auth.sessionId) return;

    try {
      await authService.addToFavorites(
        auth.accountId,
        auth.sessionId,
        mediaId,
        mediaType,
        isFavorite
      );

      // Atualizar lista local
      const favorites = await authService.getUserFavorites(auth.accountId, auth.sessionId);
      storageService.saveFavorites(favorites);

      setAuth(prevState => ({
        ...prevState,
        favorites
      }));
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
    }
  };

  // Função para sincronizar dados
  const syncUserData = async () => {
    if (!auth.sessionId) return;

    try {
      setAuth(prevState => ({ ...prevState, isLoading: true }));

      const favorites = await authService.getUserFavorites(auth.accountId, auth.sessionId);
      const whitelist = await authService.getUserRatedItems(auth.accountId, auth.sessionId);

      storageService.saveFavorites(favorites);
      storageService.saveWatchlist(whitelist);

      setAuth(prevState => ({
        ...prevState,
        favorites,
        whitelist,
        isLoading: false
      }));
    } catch (error) {
      setAuth(prevState => ({
        ...prevState,
        isLoading: false,
        error: error.message
      }));
    }
  };

  // Função para atualizar estatísticas
  const updateStatistics = (newStats) => {
    storageService.saveUserStatistics(newStats);
    setAuth(prevState => ({
      ...prevState,
      statistics: newStats
    }));
  };

  const value = {
    ...auth,
    login,
    logout,
    addToFavorites,
    syncUserData,
    updateStatistics
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
