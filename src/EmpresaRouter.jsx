import React from "react";
import { Route, Routes } from "react-router-dom";
import { useClient } from "./contexts/ClientContext";
import MenuIntro from "./pages/menu/MenuIntro";
import ClientLayout from "./layouts/ClientLayout";
import Section from "./components/shopping/section/Section.jsx";
import DetailCard from "./components/shopping/detail/DetailCard.jsx";
import CartItems from "./components/shopping/cart/CartItems.jsx";
import NotFound from "./components/NotFound.jsx";
import SuccessPage from "./pages/menu/SuccessPage.jsx";
import Pedido from "./pages/pedido/Pedido.jsx";
import { useMediaQuery } from "react-responsive";
import Absolute from "./assets/isologoAbsolte.png";

const PcBlock = () => (
  <div className="bg-black  font-primary  flex items-center justify-center flex-col h-screen w-screen">
    <img className="h-56" src={Absolute} alt="" />
    <div className="flex flex-col">
      <div className="flex flex-row gap-1">
        <p className="text-gray-50 opacity-50 font-light text-xs">
          Interfaz web
        </p>
        <p className="text-gray-50 font-light text-xs">proximamente,</p>
      </div>
      <p className="text-gray-50 opacity-50 font-light text-xs">
        ingresa por tu celular.
      </p>
    </div>
  </div>
);

const EmpresaRouter = () => {
  const { isLoaded } = useClient();
  const isDesktop = useMediaQuery({ minWidth: 1024 }); // Ajusta el breakpoint a lo que consideres "PC"

  if (isDesktop) {
    return <PcBlock />;
  }

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
