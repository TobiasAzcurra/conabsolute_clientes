import React from "react";
import { Route, Routes } from "react-router-dom";
import { useClient } from "./contexts/ClientContext";
import MenuIntro from "./pages/menu/MenuIntro";
import ClientLayout from "./layouts/ClientLayout";
import Section from "./components/shopping/section";
import DetailCard from "./components/shopping/detail";
import CartItems from "./components/shopping/cart";
import NotFound from "./components/NotFound.jsx";
import SuccessPage from "./pages/menu/SuccessPage.jsx";
import Pedido from "./pages/pedido/Pedido.jsx";

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
        <Route path="success/:orderId" element={<SuccessPage />} />
        <Route path="pedido/:orderId" element={<Pedido />} />
        <Route path="pedido" element={<Pedido />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ClientLayout>
  );
};

export default EmpresaRouter;
