import { useParams, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProductsByClientV2 } from './firebase/getProducts';
import Section from './components/shopping/section';
import DetailCard from './components/shopping/detail';
import CartItems from './components/shopping/cart';
import OrderForm from './pages/order';
import Pedido from './pages/pedido/Pedido';
import SuccessPage from './pages/menu/SuccessPage';
import Reclamos from './pages/Reclamos';
import Feedback from './components/mercadopago/Feedback';
import MenuIntro from './pages/menu/MenuIntro';

export default function EmpresaRouter() {
  const { slug } = useParams();
  const [productos, setProductos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProductsByClientV2(slug);
        setProductos(data.porCategoria);
      } catch (e) {
        console.error('❌ Error cargando productos:', e);
        setProductos(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <p className="text-center">Cargando tienda {slug}...</p>;
  if (!productos) return <Navigate to="/" />;

  return (
    <Routes>
      <Route path="/" element={<MenuIntro />} />
      {Object.entries(productos).map(([categoria, lista]) => (
        <Route
          key={categoria}
          path={`menu/${categoria}`}
          element={<Section path={categoria} products={lista} />}
        />
      ))}
      {Object.entries(productos).map(([categoria, lista]) => (
        <Route
          key={`${categoria}-detalle`}
          path={`menu/${categoria}/:id`}
          element={<DetailCard products={lista} type={categoria} />}
        />
      ))}
      <Route path="carrito" element={<CartItems />} />
      <Route path="order" element={<OrderForm />} />
      <Route path="success/:orderId" element={<SuccessPage />} />
      <Route path="pedido/:orderId" element={<Pedido />} />
      <Route path="pedido" element={<Pedido />} />
      <Route path="reclamos" element={<Reclamos />} />
      <Route path="feedback" element={<Feedback />} />
      <Route
        path="*"
        element={
          <p className="text-center mt-8">
            Página no encontrada para <b>{slug}</b>
          </p>
        }
      />
    </Routes>
  );
}
