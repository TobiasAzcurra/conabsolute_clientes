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
    <div className="fixed bottom-12 rounded-3xl left-0  right-0   h-20    pl-4 flex flex-row items-center justify-between gap-4  font-primary  z-50">
      <div className="flex flex-col items-center">
        <p className="text-xs font-light text-gray-500">
          {totalQuantity} {totalQuantity === 1 ? "producto" : "productos"}
        </p>
        <p className="text-3xl font-bold mt-[-5px]">
          {currencyFormat(totalPrice)}
        </p>
      </div>

      <Link
        to={`/${slugEmpresa}/${slugSucursal}/carrito`}
        className="bg-primary mr-4 gap-2 items-center flex justify-center px-4 h-10 rounded-full "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 text-gray-50"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>

        <p className=" text-xs text-gray-50 font-light text-center">
          Tu pedido
        </p>
      </Link>
    </div>
  );
};

export default FloatingCart;
