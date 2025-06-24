// src/components/shopping/section/index.jsx
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useClient } from '../../../contexts/ClientContext';
import Card from '../card';
import LoadingPoints from '../../LoadingPoints';

const Section = () => {
  const { category } = useParams();
  const { productsByCategory } = useClient();

  console.log('🔎 Accediendo a categoría:', category);
  console.log(
    '📦 Contenido en productsByCategory[category]:',
    productsByCategory?.[category]
  );

  const products = useMemo(() => {
    if (!productsByCategory || !productsByCategory[category]) return [];
    return productsByCategory[category].map((product) => ({
      id: product.id,
      name: product.name || 'Producto sin nombre',
      price: product.price || 0,
      img: product.img || product.image || '',
      category: product.category || category,
      description: product.description || '',
      type: product.type || 'regular',
      data: product,
    }));
  }, [productsByCategory, category]);

  if (!productsByCategory) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mt-8 mb-10">
        <LoadingPoints />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mt-8 mb-10">
      {products.length > 0 ? (
        products.map((p, i) => <Card key={p.id || i} {...p} path={category} />)
      ) : (
        <p className="font-coolvetica text-center text-xs col-span-full">
          No hay productos en esta categoría.
        </p>
      )}
    </div>
  );
};

export default Section;
