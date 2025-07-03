import currencyFormat from "../../helpers/currencyFormat";
import Toggle from "../Toggle";
import Tooltip from "../Tooltip";

const OrderSummary = ({
  productsTotal,
  envio,
  expressFee,
  expressBaseFee,
  finalTotal,
  descuento,
  handleExpressToggle,
  isEnabled,
}) => {
  return (
    <div className="flex justify-center flex-col mt-8 items-center">
      <p className="text-2xl font-bold w-full text-center mb-4">Resumen</p>
      {/* <div className="w-full flex flex-row justify-between items-center mb-4 mt-4">
        <div className="flex flex-row items-center gap-2">
          <Tooltip
            text={`Si priorizas la <b>velocidad</b>, esta opción es para vos: tu pedido pasa al frente y, en caso de delivery, sale solo con tu cadete.`}
            duration={5000}
            className="flex items-center"
          />
          <p className="font-coolvetica flex flex-row items-center gap-1">
            Lo más rápido posible
            <span className="font-bold">
              ( +{currencyFormat(expressBaseFee)} )
            </span>
          </p>
        </div>
        <Toggle isOn={isEnabled} onToggle={handleExpressToggle} />
      </div> */}
      <div className="flex flex-row justify-between w-full">
        <p>Productos</p>
        <p>{currencyFormat(productsTotal)}</p>
      </div>
      <div className="flex flex-row justify-between w-full">
        <p>Envío</p>
        <p>{currencyFormat(envio)}</p>
      </div>
      <div className="flex flex-row justify-between w-full">
        <p>Velocidad extra</p>
        <p>{currencyFormat(expressFee)}</p>
      </div>
      <div className="flex flex-row justify-between w-full">
        <p>Descuento cupón</p>
        <p>-{currencyFormat(descuento)}</p>
      </div>
      <div className="flex flex-row justify-between border-t border-opacity-20 border-black mt-4 pt-4 px-4 w-screen">
        <p className="text-2xl font-bold">Total</p>
        <p className="text-2xl font-bold">{currencyFormat(finalTotal)}</p>
      </div>
    </div>
  );
};

export default OrderSummary;
