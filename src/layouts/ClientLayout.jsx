// layouts/ClientLayout.js - MIGRADO + WhatsApp
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useClient } from "../contexts/ClientContext";
import { useCart } from "../contexts/CartContext";
import Carrusel from "../components/Carrusel";
import NavMenu from "../components/NavMenu";
import FloatingCart from "../components/shopping/FloatingCart";
import SearchBar from "../components/SearchBar";
import { useLocation } from "react-router-dom";

const ClientLayout = ({ children }) => {
  const { clientData, clientAssets, clientConfig } = useClient(); // ← Agregado clientConfig

  const { cart } = useCart();

  const location = useLocation();
  const pathname = location.pathname;

  const isProductDetail = /\/menu\/[^/]+\/[^/]+$/.test(pathname);
  const isCart = pathname.endsWith("/carrito");
  const isSuccessPage = pathname.includes("/success");
  const isPedidoPage = pathname.includes("/pedido");

  const shouldHideHeader =
    isProductDetail || isCart || isSuccessPage || isPedidoPage;

  const shouldShowFloatingCart = !isCart && !isSuccessPage && !isPedidoPage;

  const shouldHideSearch = isCart && isSuccessPage && isPedidoPage;

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

  // ← NUEVO: Función para abrir WhatsApp
  const handleContactClick = () => {
    const phone = clientConfig?.logistics?.phone || "";
    const msg = "Hola! Tengo una consulta.";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const paddingBottom =
    isSuccessPage || isPedidoPage || isCart
      ? ""
      : shouldShowFloatingCart && totalQuantity > 0
      ? "pb-[125px]"
      : "pb-[75px]";

  return (
    <>
      <Helmet>
        <title>{clientData?.name || "Absolute"}</title>
        {clientAssets?.logo && (
          <link
            rel="icon"
            type="image/png"
            href={clientAssets.logo}
            key={`favicon-${clientAssets.logo}`}
          />
        )}
      </Helmet>
      <div className="flex flex-col relative bg-gray-100 ">
        {!shouldHideHeader && (
          <>
            <div className="relative z-[10]">
              <Carrusel images={clientAssets?.hero || []} />
              <div className="top-[280px] inset-0 absolute">
                <NavMenu />
              </div>
            </div>
          </>
        )}

        {!shouldHideSearch && shouldShowFloatingCart && (
          <>
            <div
              className={`fixed inset-x-0 bottom-0 z-10 
            ${totalQuantity > 0 ? "h-[125px]" : "h-[75px]"} 
            
            bg-gray-300 bg-opacity-50 
            pointer-events-none 
            backdrop-blur-md`}
            />

            {/* ← CAMBIO: Convertido a botón con onClick */}
            <button
              onClick={handleContactClick}
              className={`bg-gray-300 bg-opacity-50 fixed z-50 ${
                totalQuantity > 0 ? "bottom-[133px]" : "bottom-[83px]"
              } backdrop-blur-md right-4 left-4 px-2.5 py-1.5 text-gray-50 rounded-full text-xs mx-auto w-fit items-center cursor-pointer `}
            >
              Contactanos
            </button>

            <SearchBar
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              showSuggestion={showSuggestion}
              setShowSuggestion={setShowSuggestion}
              previousPhone={previousPhone}
              onSuggestionClick={onSuggestionClick}
            />

            {shouldShowFloatingCart && totalQuantity > 0 && (
              <>
                <FloatingCart totalQuantity={totalQuantity} cart={cart} />
              </>
            )}
          </>
        )}

        <div
          className={`${
            !shouldHideHeader ? "mt-[162px]" : ""
          } ${paddingBottom} z-[5]`}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default ClientLayout;
