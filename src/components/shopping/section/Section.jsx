import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useClient } from "../../../contexts/ClientContext";
import Card from "../card/Card";
import LoadingPoints from "../../LoadingPoints";

const Section = () => {
  const { category } = useParams();
  const { productsByCategory } = useClient();

  const products = useMemo(() => {
    // Ya vienen ordenados del Context, no re-ordenar
    if (!productsByCategory || !productsByCategory[category]) return [];
    return productsByCategory[category];
  }, [productsByCategory, category]);

  if (!productsByCategory) {
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
        <p className="font-coolvetica text-center text-xs font-light text-gray-400">
          No hay productos en esta categoría.
        </p>
      )}
    </div>
  );
};

export default Section;
