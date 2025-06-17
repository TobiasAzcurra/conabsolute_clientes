import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import useClientData from "../hooks/useClientData";
import Carrusel from "../components/Carrusel";
import NavMenu from "../components/NavMenu";
import FloatingCart from "../components/shopping/FloatingCart";
import { useSelector } from "react-redux";
import SearchBar from "../components/SearchBar";
import { useLocation } from "react-router-dom";

const ClientLayout = ({
  children,
  handleItemClick,
  selectedItem,
  introConfig,
}) => {
  const { slug } = useParams();
  const { clientData } = useClientData(slug);

  const location = useLocation();
  const pathname = location.pathname;

  const isProductDetail = /\/menu\/[^/]+\/[^/]+$/.test(pathname);
  const isCart = pathname.endsWith("/carrito");

  const shouldHideHeader = isProductDetail || isCart;
  const shouldShowFloatingCart = !isCart;

  const cart = useSelector((state) => state.cartState.cart);
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

  const handleInputFocus = () => {
    if (previousPhone && !phoneNumber) {
      setShowSuggestion(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestion(false), 300);
  };

  return (
    <>
      {clientData && (
        <Helmet>
          <title>{clientData?.name || "ABSOLUTE"}</title>
          {clientData?.logo && (
            <link
              rel="icon"
              type="image/png"
              href={clientData.logo}
              key={`favicon-${clientData.logo}`}
            />
          )}
        </Helmet>
      )}
      <div className="flex flex-col relative ">
        {!shouldHideHeader && (
          <>
            <div className="fixed inset-x-0 top-0 z-50 h-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none backdrop-blur-sm" />
            <SearchBar
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              showSuggestion={showSuggestion}
              setShowSuggestion={setShowSuggestion}
              previousPhone={previousPhone}
              onSuggestionClick={onSuggestionClick}
            />

            <div className="relative z-[10]">
              <Carrusel images={introConfig.hero || []} />
              <div className="top-[215px] inset-0 absolute">
                <NavMenu
                  selectedItem={selectedItem}
                  handleItemClick={handleItemClick}
                />
              </div>
            </div>
          </>
        )}

        <div className={`${!shouldHideHeader ? "mt-[100px]" : ""} z-[5]`}>
          {children}
        </div>

        {shouldShowFloatingCart && totalQuantity > 0 && (
          <>
            <div className="fixed inset-x-0 bottom-0 z-40 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none backdrop-blur-sm" />
            <FloatingCart totalQuantity={totalQuantity} cart={cart} />
          </>
        )}
      </div>
    </>
  );
};

export default ClientLayout;
