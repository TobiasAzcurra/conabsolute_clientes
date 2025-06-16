import React, { useEffect, useState } from 'react';
import Carrusel from '../components/Carrusel';
import NavMenu from '../components/NavMenu';
import FloatingCart from '../components/shopping/FloatingCart';
import { useSelector } from 'react-redux';
import logo from '../assets/Logo APM-07.png';
import SearchBar from '../components/SearchBar';

const ClientLayout = ({
  children,
  handleItemClick,
  selectedItem,
  introConfig,
}) => {
  const cart = useSelector((state) => state.cartState.cart);
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [previousPhone, setPreviousPhone] = useState('');

  useEffect(() => {
    const storedPhone = localStorage.getItem('customerPhone');
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
    <div className="flex flex-col relative mb-[90px]">
      <SearchBar
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        showSuggestion={showSuggestion}
        setShowSuggestion={setShowSuggestion}
        previousPhone={previousPhone}
        onSuggestionClick={onSuggestionClick}
      />

      <img
        src={logo}
        className="h-20 top-[100px] left-1/2 -translate-x-1/2 absolute z-[30]"
        alt="Logo"
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

      <div className="mt-[100px] z-[5]">{children}</div>

      {totalQuantity > 0 && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none backdrop-blur-sm" />
          <FloatingCart totalQuantity={totalQuantity} cart={cart} />
        </>
      )}
    </div>
  );
};

export default ClientLayout;
