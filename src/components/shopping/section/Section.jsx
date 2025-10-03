import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useClient } from "../../../contexts/ClientContext";
import Card from "../card/Card";
import LoadingPoints from "../../LoadingPoints";

const Section = () => {
  const { category } = useParams();
  const { productsByCategory, productTags, activeFilters, activeSortOption } =
    useClient();

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...(productsByCategory[category] || [])];

    // 1. Aplicar filtros
    if (activeFilters.length > 0) {
      result = result.filter((product) => {
        if (!product.tags || !Array.isArray(product.tags)) return false;
        return activeFilters.some((filter) => product.tags.includes(filter));
      });
    }

    // Función helper para obtener la posición mínima de un producto
    const getMinTagPosition = (product) => {
      if (!product.tags || product.tags.length === 0) {
        return Infinity;
      }

      const positions = product.tags
        .map((tagId) => {
          const tag = productTags.find((t) => t.id === tagId);
          return tag?.position ?? Infinity;
        })
        .filter((pos) => pos !== Infinity);

      return positions.length > 0 ? Math.min(...positions) : Infinity;
    };

    // 2. Aplicar ordenamiento
    if (activeSortOption === "price-asc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (activeSortOption === "date-desc") {
      result.sort((a, b) => {
        const dateA =
          a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const dateB =
          b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return dateB - dateA;
      });
    } else if (activeSortOption === "tag-position") {
      result.sort((a, b) => {
        const posA = getMinTagPosition(a);
        const posB = getMinTagPosition(b);
        return posA - posB;
      });
    }

    // 3. Ordenamiento por defecto: por position de tags
    if (!activeSortOption) {
      result.sort((a, b) => {
        const posA = getMinTagPosition(a);
        const posB = getMinTagPosition(b);
        return posA - posB;
      });
    }

    return result;
  }, [
    productsByCategory,
    category,
    productTags,
    activeFilters,
    activeSortOption,
  ]);

  if (!productsByCategory) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mt-8 mb-10">
        <LoadingPoints />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 px-4 mb-10">
      {filteredAndSortedProducts.length > 0 ? (
        filteredAndSortedProducts.map((p) => (
          <Card key={p.id} data={p} path={category} />
        ))
      ) : (
        <p className="font-primary text-center text-xs font-light text-gray-400 px-8 pt-4 col-span-full">
          {activeFilters.length > 0 || activeSortOption
            ? "No hay productos que coincidan con los filtros seleccionados."
            : "No hay productos en esta categoría."}
        </p>
      )}
    </div>
  );
};

export default Section;
