import React, { useState, useEffect } from "react";
import { handleConfirmChanges } from "../../../firebase/orders/confirmChanges";
import currencyFormat from "../../../helpers/currencyFormat";
import QuickAddToCart from "../card/quickAddToCart";
import { getImageSrc } from "../../../helpers/getImageSrc";

const CartCard = ({ item, index, isPedidoComponente, currentOrder = null }) => {
  const { name, price, quantity, category, img, toppings, extra } = item;
  const isConfirmed = item.isConfirmed || false;
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      handleAutoConfirm();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleAutoConfirm = async () => {
    if (!currentOrder) return;
    setIsUpdating(true);
    try {
      await handleConfirmChanges(currentOrder.id);
    } catch (error) {
      console.error("❌ Error al confirmar el producto:", error);
    } finally {
      setIsUpdating(false);
      setShowConfirmation(false);
    }
  };

  useEffect(() => {
    if (extra && !isConfirmed && currentOrder?.onEditByUser) {
      setCountdown(10);
      setShowConfirmation(true);
    }
  }, [extra, isConfirmed, currentOrder]);

  const isDisabled =
    isPedidoComponente &&
    (!item.hasOwnProperty("extra") ||
      item.extra === undefined ||
      (extra === true && isConfirmed));

  const calculateTotalPrice = () => {
    const toppingsTotal =
      toppings && Array.isArray(toppings)
        ? toppings.reduce((acc, topping) => {
            if (typeof topping === "object" && topping?.price) {
              return acc + topping.price;
            }
            return acc;
          }, 0)
        : 0;
    return (price || 0) + toppingsTotal;
  };

  const totalPrice = calculateTotalPrice();

  const imageSrc = getImageSrc(item || img);

  console.log(item, "el item");

  return (
    <div className="relative">
      <div
        className={`flex flex-row  bg-gray-50 w-full h-[250px] shadow-lg shadow-gray-200 rounded-3xl md:w-[450px] ${
          isDisabled ? "blur-sm cursor-not-allowed bg-gray-50 " : ""
        }`}
      >
        <div className="w-1/3 bg-gradient-to-b flex items-center from-gray-100 via-gray-100 to-gray-300 rounded-l-3xl overflow-hidden relative">
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 text-gray-400 mx-auto mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-400 font-light text-xs">
                  Sin imagen
                </span>
              </div>
            </div>
          )}

          <img
            src={imageSrc}
            alt={name || "Product"}
            className={`h-[350px] object-cover transition-opacity duration-300 ${
              imageError ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => {
              setImageError(false);
            }}
            onError={(e) => {
              setImageError(true);
            }}
          />
        </div>

        <div className="flex flex-col w-2/3 justify-center px-4  gap-4">
          {/* header
           */}
          <div>
            <h3
              className={`text-2xl font-bold  ${
                showConfirmation ? "truncate leading-none" : "leading-6"
              }`}
            >
              {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
            </h3>
            <p
              className={`text-xs font-light text-gray-400 ${
                showConfirmation ? "truncate leading-none" : "leading-6"
              }`}
            >
              {item.variantName.charAt(0).toUpperCase() +
                item.variantName.slice(1).toLowerCase()}
            </p>
          </div>

          {/* quantity */}
          <div className="flex flex-col items-start">
            <QuickAddToCart
              product={{
                ...item,
                id: item.productId, // ← AGREGAR: mapear productId a id
                variantId: item.variantId, // ← Ya existe, pero asegurarlo
                name: item.name || item.data?.name || "Producto sin nombre",
                price: item.price || item.data?.price || 0,
                img: imageSrc,
                category:
                  item.category ||
                  item.categoria ||
                  item.data?.categoria ||
                  "default",
                type: item.type || "regular",
                data: item.data || item,
              }}
              isOrderItem={!!currentOrder}
              isPedidoComponente={true}
              initialOrderQuantity={quantity}
              onOrderQuantityChange={
                currentOrder ? handleAutoConfirm : undefined
              }
              isUpdating={isUpdating}
              disabled={isDisabled}
              animateFrom="left"
            />
            <p className="text-xs font-light text-gray-400 mt-2">
              {currencyFormat(totalPrice * quantity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCard;
