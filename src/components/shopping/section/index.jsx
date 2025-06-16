// src/components/shopping/section/index.jsx
import React, { useEffect, useRef, useState } from 'react';
import Card from '../card';
import { getProductsByCategory } from '../../../firebase/getProductsByCategory';

const Section = ({ slug, path }) => {
  const containerRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalize = (product) => {
    const base = product.data || product;
    return {
      id: product.id,
      name: base.name || 'Producto sin nombre',
      price: base.price || 0,
      img: base.img || base.image || '',
      category: product.category || path,
      description: base.description || '',
      type: base.type || 'regular',
      data: base,
    };
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const prods = await getProductsByCategory(slug, path);
        console.log('Productos cargados:', prods);
        setProducts(prods.map(normalize));
      } catch (e) {
        console.error('❌ Error al cargar productos:', e);
        setProducts([]);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };

    fetch();
  }, [slug, path]);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 mt-8 mb-10"
    >
      {loading ? (
        <p className="text-center font-coolvetica text-xs col-span-full">
          Cargando productos...
        </p>
      ) : products.length > 0 ? (
        products.map((p, i) => <Card key={p.id || i} {...p} path={path} />)
      ) : (
        <p className="font-coolvetica text-center text-xs col-span-full">
          No hay productos en esta categoría.
        </p>
      )}
    </div>
  );
};

export default Section;
