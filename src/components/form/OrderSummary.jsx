import currencyFormat from "../../helpers/currencyFormat";
import { formatDistanceInfo } from "../../utils/distanceCalculator";

const OrderSummary = ({
  productsTotal,
  envio,
  expressFee = 0,
  descuento = 0,
  finalTotal,
  deliveryMethod,
  distance = null, // ✅ NUEVO
  isCalculatingDistance = false, // ✅ NUEVO
}) => {
  return (
    <div className="flex justify-center flex-col mt-12 items-center">
      <p className="font-bold w-full mb-4">Resumen</p>

      {/* Productos */}
      <div className="flex flex-row font-light text-sm justify-between w-full">
        <p className="text-gray-400">Productos</p>
        <p>{currencyFormat(productsTotal)}</p>
      </div>

      {/* Envío - Solo mostrar si es delivery */}
      {deliveryMethod === "delivery" && (
        <div className="flex flex-col w-full">
          <div className="flex flex-row font-light text-sm justify-between items-center">
            <div className="flex items-center gap-1">
              <p className="text-gray-400">Envío</p>
              {/* Mostrar distancia si está disponible */}
              {distance !== null && !isCalculatingDistance && (
                <span className="text-gray-400">
                  ({formatDistanceInfo(distance, envio)})
                </span>
              )}
            </div>

            {/* ✅ NUEVO: Mostrar mensaje o precio */}
            {distance === null && !isCalculatingDistance ? (
              <p className="text text-yellow-500 font-light">
                *Falta seleccionar dirección
              </p>
            ) : (
              <p>{currencyFormat(envio + expressFee)}</p>
            )}
          </div>
        </div>
      )}

      {/* Descuento */}
      {descuento > 0 && (
        <div className="flex flex-row font-light text-sm justify-between w-full">
          <p className="text-green-600">Descuento</p>
          <p className="text-green-600">-{currencyFormat(descuento)}</p>
        </div>
      )}

      {/* Total */}
      <div className="flex flex-row justify-between border-t border-opacity-20 border-black mt-4 pt-4 px-4 w-screen">
        <p className="font-bold w-full mb-4">Total</p>
        <p className="font-bold">{currencyFormat(finalTotal)}</p>
      </div>
    </div>
  );
};

export default OrderSummary;
