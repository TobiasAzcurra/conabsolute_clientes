import React from 'react';
import { useClient } from './contexts/ClientContext';
import MenuIntro from './pages/menu/MenuIntro';
import ClientLayout from './layouts/ClientLayout';
import Section from './components/shopping/section';
import DetailCard from './components/shopping/detail';
import CartItems from './components/shopping/cart';
import NotFound from './components/NotFound.jsx';

const EmpresaRouter = () => {
  const { isLoaded } = useClient();
  if (!isLoaded) {
    return <MenuIntro />;
  }

  return (
    <ClientLayout>
      <Routes>
        <Route path="menu/:category" element={<Section />} />
        <Route path="menu/:category/:id" element={<DetailCard />} />
        <Route path="carrito" element={<CartItems />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ClientLayout>
  );
};

export default EmpresaRouter;
