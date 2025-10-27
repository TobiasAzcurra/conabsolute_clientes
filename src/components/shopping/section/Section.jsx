// Section.jsx - REFACTORIZADO
import React from "react";
import { useParams } from "react-router-dom";
import { useClient } from "../../../contexts/ClientContext";
import { useProducts } from "../../../hooks/useProducts"; // ✅ NUEVO
import Card from "../card/Card";
import LoadingPoints from "../../LoadingPoints";

const Section = () => {
  const { category } = useParams();
  const { activeFilters, activeSortOption } = useClient();

  // ✅ CAMBIO: Usar el hook useProducts
  const products = useProducts({
    categoryId: category,
    filterBy: activeFilters,
    sortBy: activeSortOption,
  });

  // ✅ Simplificado: el hook ya maneja todo
  if (products === null) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mt-8 mb-10">
        <LoadingPoints />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 px-4 mb-10">
      {products.length > 0 ? (
        products.map((p) => <Card key={p.id} data={p} path={category} />)
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
