import { useAuth } from '../context/AuthContext';

/**
 * Hook customizado para gerenciar favoritos em componentes
 * @param {number} itemId - ID do item (filme/série)
 * @param {string} itemType - Tipo do item ('movie' ou 'tv')
 * @returns {Object} - { isFavorite, toggleFavorite, loading }
 */
export function useFavorite(itemId, itemType = 'movie') {
  const { favorites, addToFavorites, isAuthenticated } = useAuth();

  const isFavorite = isAuthenticated && favorites?.some(item => item.id === itemId);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Faça login para adicionar aos favoritos');
      return;
    }

    try {
      await addToFavorites(itemId, itemType, !isFavorite);
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      alert('Erro ao adicionar aos favoritos');
    }
  };

  return {
    isFavorite,
    toggleFavorite,
    isAuthenticated
  };
}
