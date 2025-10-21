// CartCard.jsx - Con display de modifier selections e imagen cuadrada
import React, { useState, useEffect } from "react";
import { handleConfirmChanges } from "../../../firebase/orders/confirmChanges";
import currencyFormat from "../../../helpers/currencyFormat";
import {
  calculateItemPrice,
  calculateItemTotal,
} from "../../../helpers/priceCalculator";
import QuickAddToCart from "../card/quickAddToCart";
import { getImageSrc } from "../../../helpers/getImageSrc";

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const CartCard = ({ item, index, isPedidoComponente, currentOrder = null }) => {
  const { name, quantity, category, img, extra } = item;
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

  // Usar helpers centralizados para calcular precios
  const unitPrice = calculateItemPrice(item);
  const totalPrice = calculateItemTotal(item, quantity);

  const imageSrc = getImageSrc(item || img);

  // Función para obtener las opciones seleccionadas con sus nombres y precios
  const getSelectedModifiers = () => {
    if (!item.modifierSelections || !item.variants?.[0]?.modifierGroups) {
      return [];
    }

    const variant = item.variants[0];
    const selectedGroups = [];

    variant.modifierGroups.forEach((group) => {
      const selectedOptionIds = item.modifierSelections[group.id] || [];

      if (selectedOptionIds.length > 0) {
        const selectedOptions = selectedOptionIds
          .map((optionId) => {
            const option = group.options.find((opt) => opt.id === optionId);
            return option || null;
          })
          .filter(Boolean);

        if (selectedOptions.length > 0) {
          selectedGroups.push({
            groupLabel: group.label,
            options: selectedOptions,
          });
        }
      }
    });

    return selectedGroups;
  };

  const selectedModifiers = getSelectedModifiers();

  return (
    <div className="relative">
      <div
        className={`flex flex-row bg-gray-50 w-full h-fit shadow-lg  shadow-gray-200 rounded-3xl md:w-[450px] ${
          isDisabled ? "blur-sm cursor-not-allowed bg-gray-50" : ""
        }`}
      >
        {/* img */}
        <div className="pl-4 pt-4">
          <div className="w-24 h-24 bg-gradient-to-b flex items-center justify-center from-gray-100 via-gray-100 to-gray-300 rounded-2xl  overflow-hidden relative flex-shrink-0">
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
              className={`w-full h-full object-cover transition-opacity duration-300 ${
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
        </div>
        {/* txt */}
        <div className="flex flex-col flex-1 justify-center p-4 gap-4">
          {/* header */}
          <div>
            <h3
              className={`text-2xl font-bold ${
                showConfirmation ? "truncate leading-none" : "leading-6"
              }`}
            >
              {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
            </h3>
            {item.variantName === "Estándar" ? null : (
              <p
                className={`text-xs font-light text-gray-400 ${
                  showConfirmation ? "truncate leading-none" : "leading-6"
                }`}
              >
                {item.variantName.charAt(0).toUpperCase() +
                  item.variantName.slice(1).toLowerCase()}
              </p>
            )}

            {/* Mostrar modifier selections */}
            {selectedModifiers.length > 0 && (
              <div className="mt-2 space-y-1">
                {selectedModifiers.map((group, groupIdx) => (
                  <div key={groupIdx} className="text-xs">
                    <span className="font-light text-gray-500">
                      {group.groupLabel}:{" "}
                    </span>
                    <span className="font-light text-gray-600">
                      {group.options.map((option, optIdx) => (
                        <span key={option.id}>
                          {capitalizeWords(option.name)}
                          {option.price > 0 && (
                            <span className="text-gray-400">
                              {" "}
                              (+${option.price})
                            </span>
                          )}
                          {optIdx < group.options.length - 1 && ", "}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* quantity */}
          <div className="flex flex-col items-start">
            <QuickAddToCart
              product={{
                ...item,
                id: item.productId,
                variantId: item.variantId,
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
              {currencyFormat(totalPrice)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCard;
