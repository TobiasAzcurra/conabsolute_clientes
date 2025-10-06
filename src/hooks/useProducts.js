// hooks/useProducts.js
import { useMemo } from "react";
import { useClient } from "../contexts/ClientContext";
import {
  sortProductsByCategory,
  sortProductsByName,
  sortProductsByPrice,
  sortProductsByDate,
  sortProductsByTagPosition,
} from "../utils/productSorters";

/**
 * Hook para obtener productos filtrados y ordenados
 * @param {Object} options - Opciones de filtrado y ordenamiento
 * @param {string} options.categoryId - Filtrar por categoría
 * @param {string[]} options.filterBy - Array de tag IDs para filtrar
 * @param {string} options.sortBy - Tipo de ordenamiento: 'category' | 'name' | 'price' | 'date' | 'tag-position'
 * @param {number} options.limit - Limitar cantidad de productos
 */
export const useProducts = (options = {}) => {
  const { rawProducts, categories, productTags } = useClient();
  const {
    categoryId = null,
    filterBy = [],
    sortBy = null,
    limit = null,
  } = options;

  return useMemo(() => {
    if (!rawProducts || rawProducts.length === 0) return [];

    let result = [...rawProducts];

    // 1. Filtrar por categoría
    if (categoryId) {
      result = result.filter((p) => p.categoryId === categoryId);
    }

    // 2. Filtrar por tags
    if (filterBy.length > 0) {
      result = result.filter((p) => {
        if (!p.tags || !Array.isArray(p.tags)) return false;
        return filterBy.some((filter) => p.tags.includes(filter));
      });
    }

    // 3. Ordenar según sortBy
    switch (sortBy) {
      case "category":
        result = sortProductsByCategory(result, categories);
        break;
      case "name":
        result = sortProductsByName(result);
        break;
      case "price":
      case "price-asc":
        result = sortProductsByPrice(result);
        break;
      case "date":
      case "date-desc":
        result = sortProductsByDate(result);
        break;
      case "tag-position":
        result = sortProductsByTagPosition(result, productTags);
        break;
      default:
        // Sin sortBy explícito, ordenar por tag position por defecto
        result = sortProductsByTagPosition(result, productTags);
        break;
    }

    // 4. Limitar cantidad
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [
    rawProducts,
    categories,
    productTags,
    categoryId,
    filterBy,
    sortBy,
    limit,
  ]);
};
