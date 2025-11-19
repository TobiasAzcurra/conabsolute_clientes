// layouts/ClientLayout.js
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
  const { clientData, clientAssets, clientConfig } = useClient();
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

  // Estado del modal de contacto
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const storedPhone = localStorage.getItem("customerPhone");
    if (storedPhone) setPreviousPhone(storedPhone);
  }, []);

  const onSuggestionClick = () => {
    setPhoneNumber(previousPhone);
    setShowSuggestion(false);
  };

  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

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

      <div className="flex flex-col relative bg-gray-100 min-h-screen">
        {/* HEADER + CARRUSEL */}
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

        {/* SEARCH + BOTÓN CONTACTANOS + FLOATING CART */}
        {!shouldHideSearch && shouldShowFloatingCart && (
          <>
            <div
              className={`fixed inset-x-0 bottom-0 z-10 
                ${totalQuantity > 0 ? "h-[125px]" : "h-[75px]"} 
                bg-gray-300 bg-opacity-50 pointer-events-none backdrop-blur-md`}
            />

            <SearchBar
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              showSuggestion={showSuggestion}
              setShowSuggestion={setShowSuggestion}
              previousPhone={previousPhone}
              onSuggestionClick={onSuggestionClick}
            />

            {shouldShowFloatingCart && totalQuantity > 0 && (
              <FloatingCart totalQuantity={totalQuantity} cart={cart} />
            )}
          </>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div
          className={`${
            !shouldHideHeader ? "mt-[162px]" : ""
          } ${paddingBottom} z-[5]`}
        >
          {children}
        </div>

        {/* ==================== MODAL QUE CRECE DESDE EL BOTÓN HACIA ARRIBA ==================== */}
        {isContactModalOpen ? (
          <>
            {/* Overlay oscuro (todo menos el área de abajo) */}
            <div onClick={closeContactModal} />

            {/* Modal que empieza justo encima del botón Contactanos */}
            <div
              className="fixed left-4 right-4  backdrop-blur-md bg-gray-300/50 rounded-3xl z-[9999] overflow-y-auto"
              style={{
                // La posición exacta del botón Contactanos
                bottom: totalQuantity > 0 ? "132px" : "75px", // mismo cálculo que el botón
                top: "16px",
              }}
              // Animación que hace que "crezca" desde el botón hacia arriba
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animación inline con style jsx */}
              <style jsx>{`
                @keyframes growUp {
                  from {
                    transform: scaleY(0);
                    transform-origin: bottom;
                  }
                  to {
                    transform: scaleY(1);
                    transform-origin: bottom;
                  }
                }
                .animate-grow-up {
                  animation: growUp 0.45s cubic-bezier(0.22, 1, 0.36, 1)
                    forwards;
                }
              `}</style>

              <div className="animate-grow-up h-full relative">
                {/* Botón cerrar (arriba a la derecha) */}
                <button
                  onClick={closeContactModal}
                  className="absolute top-4 right-4 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl z-10 text-xl font-light hover:bg-gray-100"
                >
                  ×
                </button>

                {/* Contenido del modal (por ahora placeholder) */}
                <div className="pt-20 px-4">
                  <p className="text-lg text-gray-50">
                    Te respondemos al instante
                  </p>
                  {/* Aquí va a ir el botón grande de WhatsApp, teléfono, etc. */}
                </div>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={openContactModal}
            className={` ${
              totalQuantity > 0 ? "bottom-[133px]" : "bottom-[83px]"
            } backdrop-blur-md bg-gray-300/50 fixed z-50 right-4 left-4 px-2.5 py-1.5 text-gray-50 rounded-full text-xs mx-auto w-fit items-center cursor-pointer `}
          >
            Contactanos
          </button>
        )}
      </div>
    </>
  );
};

export default ClientLayout;
