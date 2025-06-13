import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { getProductsByClientV2 } from './firebase/getProducts';
import Section from './components/shopping/section';
import DetailCard from './components/shopping/detail';
import ClientLayout from './layouts/ClientLayout'; // nuevo layout

const EmpresaRouter = () => {
  const { slug } = useParams();
  const [productos, setProductos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getProductsByClientV2(slug);
        console.log('Productos cargados:', data);
        setProductos(data?.porCategoria || {});
      } catch (error) {
        console.error('Error cargando productos para empresa:', error);
        setProductos({});
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProducts();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-purple-500 border-t-transparent mb-6" />
        <p className="text-lg font-semibold text-gray-700">
          Cargando tienda...
        </p>
      </div>
    );
  }

  const categorias = Object.keys(productos);

  return (
    <ClientLayout>
      <Routes>
        {/* Redirección automática al primer menú */}
        {categorias.length > 0 && (
          <Route
            index
            element={<Navigate to={`menu/${categorias[0]}`} replace />}
          />
        )}

        {categorias.map((categoria) => (
          <Route
            key={categoria}
            path={`menu/${categoria}`}
            element={
              <Section path={categoria} products={productos[categoria]} />
            }
          />
        ))}

        {categorias.map((categoria) => (
          <Route
            key={`detail-${categoria}`}
            path={`menu/${categoria}/:id`}
            element={
              <DetailCard products={productos[categoria]} type={categoria} />
            }
          />
        ))}

        {/* Ruta fallback por si no hay match */}
        <Route
          path="*"
          element={
            <div className="font-coolvetica text-center mt-10">
              <p className="font-bold text-xs">No se encontró la categoría.</p>
              <p className="text-xs">
                Verifica la URL o selecciona otra opción.
              </p>
            </div>
          }
        />
      </Routes>
    </ClientLayout>
  );
};

export default EmpresaRouter;
