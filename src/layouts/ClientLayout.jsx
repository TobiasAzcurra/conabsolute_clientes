
// layouts/ClientLayout.js
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useClient } from "../contexts/ClientContext";
import { useCart } from "../contexts/CartContext";
import Carrusel from "../components/Carrusel";
import NavMenu from "../components/NavMenu";
import FloatingCart from "../components/shopping/FloatingCart";
import SearchBar from "../components/SearchBar";
import AIChatClient from "../components/AIChatClient";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Importar framer-motion

const ClientLayout = ({ children }) => {
  const { clientData, clientAssets, clientConfig, aiBotConfig } = useClient();
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

  const isBotEnabled = aiBotConfig?.enabled === true;

  // ✅ NUEVO: Obtener avatar del bot
  const botAvatar = aiBotConfig?.botAvatarUrl || clientAssets?.logo;

  const handleContactClick = () => {
    const phone = clientConfig?.logistics?.phone || "";
    const msg = "Hola! Tengo una consulta.";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // 🎥 Variantes para animación de entrada "Apple-like"
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0] // Ease-out cubic suave
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

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

      <motion.div 
        className="flex flex-col relative bg-gray-100 min-h-screen"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* HEADER + CARRUSEL */}
        {!shouldHideHeader && (
          <motion.div variants={itemVariants} className="relative z-[10]">
              <Carrusel images={clientAssets?.hero || []} />
              <div className="top-[280px] inset-0 absolute">
                <NavMenu />
              </div>
          </motion.div>
        )}

        {/* SEARCH + BOTÓN CONTACTANOS + FLOATING CART */}
        {!shouldHideSearch && shouldShowFloatingCart && (
          <>
            <div
              className={`fixed  inset-x-0 bottom-0 z-10 
                ${totalQuantity > 0 ? "h-[125px]" : "h-[75px]"} 
                bg-gray-300 bg-opacity-50 pointer-events-none backdrop-blur-md `}
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
        <motion.div
          variants={itemVariants}
          className={`${
            !shouldHideHeader ? "mt-[162px]" : ""
          } ${paddingBottom} z-[5]`}
        >
          {children}
        </motion.div>

        {/* ==================== MODAL DE CHAT AI ==================== */}
        {isContactModalOpen && isBotEnabled ? (
          <>
            <div onClick={closeContactModal} />

            <div
              className="fixed left-4 right-4 backdrop-blur-md  bg-gray-300/50 rounded-3xl z-[9999] overflow-hidden "
              style={{
                bottom: totalQuantity > 0 ? "132px" : "75px",
                top: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
                <button
                  onClick={closeContactModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-white  rounded-full flex items-center justify-center  z-10 text-xl font-light "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-4 text-gray-900"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <AIChatClient />
              </div>
            </div>
          </>
        ) : // : // ✅ MODIFICADO: Botón con avatar del bot
        // isBotEnabled && shouldShowFloatingCart ? (
        //   <button
        //     onClick={openContactModal}
        //     className={`${
        //       totalQuantity > 0 ? "bottom-[133px]" : "bottom-[83px]"
        //     } backdrop-blur-md bg-gray-300/50 fixed z-50 right-4 left-4 px-4 h-10 text-gray-50 rounded-full text-xs mx-auto w-fit flex items-center gap-2 cursor-pointer hover:bg-gray-400/50 transition-colors`}
        //   >
        //     {/* ✅ Avatar del bot */}
        //     <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex items-center justify-center">
        //       {botAvatar ? (
        //         <img
        //           src={botAvatar}
        //           alt="Bot"
        //           className="w-full h-full object-cover"
        //         />
        //       ) : (
        //         <span className="text-xs">🤖</span>
        //       )}
        //     </div>
        //     <span>Contactanos</span>
        //   </button>
        // )

        shouldShowFloatingCart ? (
          <button
            onClick={handleContactClick}
            className={`${
              totalQuantity > 0 ? "bottom-[133px]" : "bottom-[83px]"
            } backdrop-blur-md bg-gray-300/50 fixed z-50 right-4 left-4 px-4 h-10 text-gray-50 rounded-full text-xs mx-auto w-fit flex items-center gap-2 cursor-pointer hover:bg-gray-400/50 transition-colors`}
          >
            <span>Contactanos</span>
          </button>

        ) : null}
      </motion.div>
    </>
  );
};

export default ClientLayout;
