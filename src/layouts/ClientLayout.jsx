// layouts/ClientLayout.js - MIGRADO
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useClient } from "../contexts/ClientContext";
import { useCart } from "../contexts/CartContext"; // ← NUEVO: Reemplaza Redux
import Carrusel from "../components/Carrusel";
import NavMenu from "../components/NavMenu";
import FloatingCart from "../components/shopping/FloatingCart";
import SearchBar from "../components/SearchBar";
import { useLocation } from "react-router-dom";

const ClientLayout = ({ children }) => {
  const { clientData, clientAssets } = useClient();

  // ← CAMBIO: Reemplazar Redux con Context
  // OLD: const cart = useSelector((state) => state.cartState.cart);
  const { cart } = useCart(); // ← NUEVO

  const location = useLocation();
  const pathname = location.pathname;

  const isProductDetail = /\/menu\/[^/]+\/[^/]+$/.test(pathname);
  const isCart = pathname.endsWith("/carrito");
  const isSuccessPage = pathname.includes("/success");
  const isPedidoPage = pathname.includes("/pedido");

  const shouldHideHeader =
    isProductDetail || isCart || isSuccessPage || isPedidoPage;
  const shouldShowFloatingCart = !isCart && !isSuccessPage && !isPedidoPage;

  // ← FUNCIONA IGUAL: cart viene del Context ahora
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [previousPhone, setPreviousPhone] = useState("");

  useEffect(() => {
    const storedPhone = localStorage.getItem("customerPhone");
    if (storedPhone) {
      setPreviousPhone(storedPhone);
    }
  }, []);

  const onSuggestionClick = () => {
    setPhoneNumber(previousPhone);
    setShowSuggestion(false);
  };

  return (
    <>
      <Helmet>
        <title>{clientData?.name || "CONABSOLUTE"}</title>
        {clientAssets?.logo && (
          <link
            rel="icon"
            type="image/png"
            href={clientAssets.logo}
            key={`favicon-${clientAssets.logo}`}
          />
        )}
      </Helmet>
      <div className="flex flex-col relative ">
        {!shouldHideHeader && (
          <>
            <div className="relative z-[10]">
              <Carrusel images={clientAssets?.hero || []} />
              <div className="top-[215px] inset-0 absolute">
                <NavMenu />
              </div>
            </div>
          </>
        )}

        <div
          className={`${!shouldHideHeader ? "mt-[100px]" : ""} ${
            shouldShowFloatingCart && totalQuantity > 0 ? "pb-[155px]" : ""
          } z-[5]`}
        >
          {children}
        </div>

        {shouldShowFloatingCart && totalQuantity > 0 && (
          <>
            <div className="fixed inset-x-0 bottom-0 z-40 h-[155px] border-t-1 border-gray-400  bg-gray-200 bg-opacity-60 pointer-events-none backdrop-blur-md" />
            <SearchBar
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              showSuggestion={showSuggestion}
              setShowSuggestion={setShowSuggestion}
              previousPhone={previousPhone}
              onSuggestionClick={onSuggestionClick}
            />
            {/* ← FUNCIONA IGUAL: FloatingCart recibe cart del Context */}
            <FloatingCart totalQuantity={totalQuantity} cart={cart} />
          </>
        )}
      </div>
    </>
  );
};

export default ClientLayout;
