import currencyFormat from "../../helpers/currencyFormat";

const OrderSummary = ({ productsTotal, envio, finalTotal }) => {
  return (
    <div className="flex justify-center flex-col mt-12 items-center">
      <p className=" font-bold w-full mb-4">Resumen</p>

      <div className="flex flex-row font-light text-sm justify-between w-full">
        <p className="text-gray-400"> Productos</p>
        <p>{currencyFormat(productsTotal)}</p>
      </div>
      <div className="flex flex-row font-light text-sm justify-between w-full">
        <p className="text-gray-400">Envío</p>
        <p>{currencyFormat(envio)}</p>
      </div>

      <div className="flex flex-row justify-between border-t border-opacity-20 border-black mt-4 pt-4 px-4 w-screen">
        <p className=" font-bold w-full mb-4">Total</p>
        <p className=" font-bold">{currencyFormat(finalTotal)}</p>
      </div>
    </div>
  );
};

export default OrderSummary;
