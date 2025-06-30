import React from "react";
import { Link } from "react-router-dom";
import { useClient } from "../../contexts/ClientContext";
import currencyFormat from "../../helpers/currencyFormat";

const FloatingCart = ({ totalQuantity, cart }) => {
  const { slugEmpresa, slugSucursal } = useClient();

  const totalPrice = cart.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  return (
    <div className="fixed border border-black border-opacity-30 bottom-4 rounded-2xl left-4 right-4 h-20 bg-white bg-opacity-80 backdrop-blur-sm pl-4 flex flex-row items-center justify-between md:justify-center gap-4 font-coolvetica z-50">
      <div className="flex flex-col items-center">
        <p className="text-xs font-medium">
          {totalQuantity} {totalQuantity === 1 ? "producto" : "productos"}
        </p>
        <p className="text-4xl font-bold mt-[-5px]">
          {currencyFormat(totalPrice)}
        </p>
      </div>

      <Link
        to={`/${slugEmpresa}/${slugSucursal}/carrito`}
        className="bg-blue-apm mr-2 w-full items-center flex justify-center md:w-[500px] h-[62px] px-6 rounded-2xl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="h-6 mr-2 text-gray-100"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>

        <p className="text-gray-100 text-xl font-bold text-center">
          Ver pedido
        </p>
      </Link>
    </div>
  );
};

export default FloatingCart;
