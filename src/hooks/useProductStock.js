// hooks/useProductStock.js
import { useState, useEffect, useCallback } from "react";
import { getProducts } from "../firebase/products/getProducts"; // ✅ CAMBIO
import { useClient } from "../contexts/ClientContext";

/**
 * Hook para actualizar stock de un producto específico
 * @param {string} productId - ID del producto
 * @param {Object} initialProduct - Producto inicial (opcional)
 */
export const useProductStock = (productId, initialProduct = null) => {
  const { empresaId, sucursalId, rawProducts } = useClient();

  // ✅ Primero intentar obtener del context (caché)
  const cachedProduct = rawProducts.find((p) => p.id === productId);

  const [product, setProduct] = useState(initialProduct || cachedProduct);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const updateStock = useCallback(async () => {
    if (!empresaId || !sucursalId || !productId) return;

    setIsUpdating(true);
    try {
      // ✅ CAMBIO: Usar la función consolidada
      const freshProduct = await getProducts(empresaId, sucursalId, {
        productId,
        includeInactive: false,
      });

      if (freshProduct) {
        // Filtrar variantes con precios inválidos
        const filteredProduct = {
          ...freshProduct,
          variants:
            freshProduct.variants?.filter((variant) => {
              if (!variant.price && variant.price !== 0) return true;
              if (typeof variant.price !== "number") return false;
              const basePrice = freshProduct.price || 0;
              const finalPrice = basePrice + variant.price;
              return finalPrice >= 0;
            }) || [],
        };

        setProduct(filteredProduct);
        setLastUpdate(Date.now());
        console.log("✅ Stock actualizado:", productId);
      }
    } catch (error) {
      console.error("❌ Error actualizando stock:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [empresaId, sucursalId, productId]);

  // Actualizar cuando cambia el caché del context
  useEffect(() => {
    if (cachedProduct) {
      setProduct(cachedProduct);
    }
  }, [cachedProduct]);

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
