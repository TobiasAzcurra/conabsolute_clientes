import { useState, useEffect, useCallback } from 'react';
import { getProductById } from '../firebase/products/getProductById';

/**
 * Hook personalizado para manejar actualizaciones de stock de productos
 * @param {string} empresaId - ID de la empresa
 * @param {string} sucursalId - ID de la sucursal
 * @param {string} productId - ID del producto
 * @param {Object} initialProduct - Producto inicial (de caché)
 * @returns {Object} - Estado y funciones para manejar el producto
 */
export const useProductStock = (empresaId, sucursalId, productId, initialProduct) => {
  const [product, setProduct] = useState(initialProduct);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const updateStock = useCallback(async () => {
    if (!empresaId || !sucursalId || !productId) return;

    setIsUpdating(true);
    try {
      const freshProduct = await getProductById(empresaId, sucursalId, productId);
      if (freshProduct) {
        setProduct(freshProduct);
        setLastUpdate(Date.now());
        console.log('✅ Stock actualizado para producto:', productId);
      }
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [empresaId, sucursalId, productId]);

  // Actualizar automáticamente al montar el componente
  useEffect(() => {
    updateStock();
  }, [updateStock]);

  // Función para refrescar manualmente
  const refreshStock = useCallback(() => {
    updateStock();
  }, [updateStock]);

  return {
    product,
    isUpdating,
    lastUpdate,
    refreshStock,
  };
};
