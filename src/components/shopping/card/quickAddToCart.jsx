// components/shopping/card/quickAddToCart.jsx - Con límite de stock
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, createCartItem } from "../../../contexts/CartContext";
import { ReadMateriales, ReadData } from "../../../firebase/orders/uploadOrder";
import { addProductToOrder } from "../../../firebase/orders/addProductToOrder";
import { calcularCostoHamburguesa } from "../../../helpers/currencyFormat";

const QuickAddToCart = ({
  product,
  animateFromCenter,
  displayAsFullButton = false,
  isOrderItem = false,
  onOrderQuantityChange = null,
  initialOrderQuantity = null,
  isPedidoComponente = false,
  currentOrder = null,
  calculatedPrice = null,
  disabled = false,
  animateFrom = "right",
}) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  const cartItem = !isOrderItem
    ? cart.find((item) => {
        if (product.id && product.variantId) {
          return (
            item.productId === product.id &&
            item.variantId === product.variantId
          );
        }
        return item.name === product.name && item.category === product.category;
      })
    : null;

  const initialQuantity = isOrderItem
    ? initialOrderQuantity || product.quantity
    : cartItem?.quantity || 0;

  // NUEVO: Calcular stock máximo
  const maxStock = product.infiniteStock
    ? Infinity
    : product.availableStock || 0;

  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const quantityRef = useRef(quantity);
  const pendingUpdateRef = useRef(null);

  useEffect(() => {
    const newQty = isOrderItem
      ? initialOrderQuantity || product.quantity
      : cartItem?.quantity || 0;
    setQuantity(newQty);
    quantityRef.current = newQty;
  }, [cartItem, initialOrderQuantity, isOrderItem, product.quantity]);

  useEffect(() => () => clearTimeout(pendingUpdateRef.current), []);

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const newQuantity = prev + delta;

      // NUEVO: Validar límite de stock
      if (newQuantity > maxStock) {
        setShowStockWarning(true);
        setTimeout(() => setShowStockWarning(false), 2000);
        quantityRef.current = maxStock;
        return maxStock;
      }

      quantityRef.current = newQuantity;
      return newQuantity;
    });
  };

  const handleCartUpdate = () => {
    const qty = quantityRef.current;

    if (qty === 0 && cartItem) {
      removeFromCart(cartItem.id);
    } else if (qty >= 1) {
      if (cartItem) {
        updateQuantity(cartItem.id, qty);
      } else {
        const newCartItem = createCartItem(
          {
            id: product.id || product.productId,
            name: product.name,
            price: product.basePrice || product.price || 0,
            category: product.category,
            variants: product.variants || [],
            infiniteStock: product.infiniteStock || false,
            img: product.img,
          },
          product.selectedVariant || (product.variants && product.variants[0]),
          qty
        );

        if (calculatedPrice !== null) {
          newCartItem.finalPrice = calculatedPrice;
          newCartItem.price = calculatedPrice;
        }

        newCartItem.variantPrice = product.variantPrice || 0;
        newCartItem.stockReference = product.stockReference || "";
        newCartItem.availableStock = product.availableStock || 0;

        console.log("🛒 Agregando item al carrito:", {
          productName: newCartItem.productName,
          variantName: newCartItem.variantName,
          quantity: newCartItem.quantity,
          finalPrice: newCartItem.finalPrice,
          isInfiniteStock: newCartItem.isInfiniteStock,
          availableStock: newCartItem.availableStock,
        });

        addToCart(newCartItem);
      }
    }
  };

  const startAddingProcess = async () => {
    if (disabled) return;

    setIsEditing(true);
    setIsAdding(true);
    clearTimeout(pendingUpdateRef.current);
    pendingUpdateRef.current = setTimeout(async () => {
      try {
        if (isPedidoComponente && currentOrder?.id) {
          if (product.orderIndex !== undefined) {
            await updateOrderItemQuantity(
              currentOrder.id,
              obtenerFechaActual(),
              product.orderIndex,
              quantityRef.current
            );
          } else if (quantityRef.current > 0) {
            const materialesData = await ReadMateriales();
            const productsData = await ReadData();
            const productData = productsData.find(
              (p) => p.data.name === product.name
            )?.data;
            const costoBurger = productData
              ? calcularCostoHamburguesa(
                  materialesData,
                  productData.ingredients
                )
              : 0;
            await addProductToOrder(
              currentOrder.id,
              {
                ...product,
                costoBurger: costoBurger * quantityRef.current,
              },
              quantityRef.current
            );
          }
        } else if (!isOrderItem) {
          handleCartUpdate();
        }
        if (onOrderQuantityChange) onOrderQuantityChange(quantityRef.current);
      } catch (error) {
        console.error("Error al actualizar producto:", error);
      } finally {
        setIsAdding(false);
        setTimeout(() => setIsEditing(false), 300);
      }
    }, 2000);
  };

  return (
    <div className="relative">
      <div
        className={`relative flex items-center w-[80px] h-[35px] pt-0.5 text-center cursor-pointer`}
      >
        <AnimatePresence>
          {isEditing ? (
            <motion.div
              key="edit-qty"
              initial={{ opacity: 0, scaleX: 0.33 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ scaleX: 0.33, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              className={`absolute z-50 overflow-hidden rounded-full bg-gray-300 flex items-center ${
                displayAsFullButton
                  ? ""
                  : animateFrom === "right"
                  ? "right-0"
                  : "left-0"
              }`}
              style={{
                transformOrigin: displayAsFullButton ? "center" : animateFrom,
              }}
            >
              <div className="flex w-fit h-10">
                <div
                  className="text-blue-700 font-coolvetica font-medium flex justify-center text-center items-center w-[35px] h-10 cursor-pointer"
                  onClick={() => handleQuantityChange(-1)}
                >
                  -
                </div>
                <div className="font-coolvetica font-medium text-blue-700 gap-2 flex justify-center text-sm text-center items-center w-[35px] h-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                  {quantity}
                </div>
                <div
                  className={`font-coolvetica font-medium flex justify-center text-center items-center w-[35px] h-10 ${
                    quantity >= maxStock
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-700 cursor-pointer"
                  }`}
                  onClick={() => quantity < maxStock && handleQuantityChange(1)}
                >
                  +
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {!isEditing && (
          <>
            {displayAsFullButton && quantity === 0 && !isOrderItem ? (
              <div className="absolute z-[60]">
                <button
                  disabled={disabled}
                  className={`bg-blue-700 text-sm flex flex-row items-center gap-2 font-coolvetica text-gray-50 rounded-full h-10 px-4 font-medium ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={!disabled ? startAddingProcess : undefined}
                >
                  Agregar
                </button>
              </div>
            ) : displayAsFullButton && quantity > 0 && !isOrderItem ? (
              <div className="absolute z-[60]">
                <button
                  disabled={disabled}
                  className={`bg-gray-300 text-sm flex flex-row items-center gap-2 font-coolvetica text-blue-700 rounded-full h-10 px-4 font-medium ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={!disabled ? startAddingProcess : undefined}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 text-blue-700"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                  {quantity}
                </button>
              </div>
            ) : (
              <div
                className={`bg-gray-300 text-sm flex flex-row items-center gap-2 font-coolvetica text-blue-700 rounded-full h-10 px-4 font-medium`}
                onClick={startAddingProcess}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-6 text-blue-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                {quantity > 0 ? quantity : "+"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuickAddToCart;
