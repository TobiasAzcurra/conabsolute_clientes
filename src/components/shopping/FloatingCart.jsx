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
    <div className="fixed bottom-4 rounded-3xl left-4 right-4 bg-gray-300/50 backdrop-blur-md    p-4   flex flex-row items-center justify-between gap-4  font-primary  z-50">
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
        className="bg-primary items-center flex justify-center px-4 h-10 rounded-full "
      >
        <p className=" text-sm text-gray-50 font-light text-center">
          Ver pedido
        </p>
      </Link>
    </div>
  );
};

export default FloatingCart;
