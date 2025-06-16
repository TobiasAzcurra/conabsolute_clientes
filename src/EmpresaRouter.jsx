import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  useParams,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { getCategoriesByClient } from './firebase/getCategories';
import { getClientIntro } from './firebase/getClientConfig';
import Section from './components/shopping/section';
import DetailCard from './components/shopping/detail';
import ClientLayout from './layouts/ClientLayout';
import CartItems from './components/shopping/cart';

const EmpresaRouter = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [introConfig, setIntroConfig] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategoriesByClient(slug);
        setCategorias(cats.map((cat) => cat.id));
      } catch (err) {
        console.error('❌ Error cargando categorías:', err);
        setCategorias([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategories();
      getClientIntro(slug).then(setIntroConfig);
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

  const handleItemClick = (categoryId) => {
    navigate(`/${slug}/menu/${categoryId}`);
  };

  return (
    <ClientLayout handleItemClick={handleItemClick} introConfig={introConfig}>
      <Routes>
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
            element={<Section slug={slug} path={categoria} />}
          />
        ))}

        {categorias.map((categoria) => (
          <Route
            key={`detail-${categoria}`}
            path={`menu/${categoria}/:id`}
            element={<DetailCard type={categoria} />}
          />
        ))}

        {/* <Route path="pedido" element={<PedidoScreen />} /> */}
        <Route path='carrito' element={<CartItems />} />

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
