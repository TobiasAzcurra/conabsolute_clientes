import React from 'react';
import Carrusel from '../components/Carrusel';
import NavMenu from '../components/NavMenu';
import FloatingCart from '../components/shopping/FloatingCart';
import { useSelector } from 'react-redux';
import logo from '../assets/Logo APM-07.png'; // Opcional: puede venir desde Firebase config

const ClientLayout = ({ selectedItem, handleItemClick, children }) => {
  const cart = useSelector((state) => state.cartState.cart);
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col relative mb-[90px]">
      {/* Fondo de blur */}
      <div className="fixed inset-x-0 top-0 z-[55] h-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none backdrop-blur-sm" />

      {/* Logo fijo (puede reemplazarse por el de Firebase) */}
      <img
        src={logo}
        className="h-20 top-[100px] left-1/2 -translate-x-1/2 absolute z-[30]"
        alt="Logo"
      />

      {/* Nav y carrusel */}
      <div className="relative z-[10]">
        <Carrusel />
        <div className="top-[215px] inset-0 absolute">
          <NavMenu
            selectedItem={selectedItem}
            handleItemClick={handleItemClick}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mt-[250px] z-[5]">{children}</div>

      {/* Carrito flotante */}
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
