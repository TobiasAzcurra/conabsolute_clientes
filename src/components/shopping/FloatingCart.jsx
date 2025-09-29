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
    <div className="fixed bottom-[60px] rounded-3xl left-4  right-4 w-fit  h-20 bg-gray-200   pl-4 flex flex-row items-center justify-center md:justify-center gap-4 font-coolvetica z-50">
      <div className="flex flex-col items-center">
        <p className="text-xs font-light text-gray-400">
          {totalQuantity} {totalQuantity === 1 ? "producto" : "productos"}
        </p>
        <p className="text-4xl font-bold mt-[-5px]">
          {currencyFormat(totalPrice)}
        </p>
      </div>

      <Link
        to={`/${slugEmpresa}/${slugSucursal}/carrito`}
        className="bg-blue-700 mr-4 items-center flex justify-center px-4 py-2 rounded-full "
      >
        <p className="bg-blue-700 text-sm text-gray-50 font-medium text-center">
          Ver pedido
        </p>
      </Link>
    </div>
  );
};

export default FloatingCart;
