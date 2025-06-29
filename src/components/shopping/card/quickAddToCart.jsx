import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addItem,
  updateItemQuantity,
  removeItem,
} from '../../../redux/cart/cartSlice';
import { ReadMateriales, ReadData } from '../../../firebase/orders/uploadOrder';
import { addProductToOrder } from '../../../firebase/orders/addProductToOrder';
import { calcularCostoHamburguesa } from '../../../helpers/currencyFormat';

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
}) => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cartState);
  const location = useLocation();

  const cartItem = !isOrderItem
    ? cart.find(
        (item) =>
          item.name === product.name && item.category === product.category
      )
    : null;

  const initialQuantity = isOrderItem
    ? initialOrderQuantity || product.quantity
    : cartItem?.quantity || 0;

  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      const updated = prev + delta;
      quantityRef.current = updated;
      return updated;
    });
  };

  const handleCartUpdate = () => {
    const qty = quantityRef.current;
    if (qty === 0 && cartItem) {
      const itemIndex = cart.findIndex(
        (item) =>
          item.name === product.name && item.category === product.category
      );
      dispatch(removeItem(itemIndex));
    } else if (qty >= 1) {
      const payload = {
        name: product.name,
        category: product.category,
        quantity: qty,
      };
      if (cartItem) dispatch(updateItemQuantity(payload));
      else
        dispatch(
          addItem({
            ...payload,
            price: calculatedPrice || product.price,
            img: product.img,
          })
        );
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
        console.error('Error al actualizar producto:', error);
      } finally {
        setIsAdding(false);
        setTimeout(() => setIsEditing(false), 300);
      }
    }, 2000);
  };

  return (
    <div
      className={`relative ${
        displayAsFullButton
          ? 'w-[182px] h-[72px]'
          : 'w-[35px] h-[35px] pt-0.5 text-center cursor-pointer'
      } flex items-center justify-center`}
    >
      <AnimatePresence>
        {isEditing ? (
          <motion.div
            key="edit-qty"
            initial={{ opacity: 0, scaleX: 0.33 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ scaleX: 0.33, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            className={`absolute z-50 overflow-hidden rounded-3xl border-black border-2 bg-gray-50 flex items-center ${
              displayAsFullButton ? '' : 'right-0'
            }`}
            style={{
              transformOrigin: displayAsFullButton ? 'center' : 'right',
            }}
          >
            <div className="flex w-[105px] h-[35px]">
              <div
                className="text-black font-coolvetica font-black flex justify-center text-center items-center w-[35px] h-[35px] cursor-pointer"
                onClick={() => handleQuantityChange(-1)}
              >
                -
              </div>
              <div className="font-coolvetica font-black flex justify-center text-center items-center w-[35px] h-[35px]">
                {quantity}
              </div>
              <div
                className="text-black font-coolvetica font-black flex justify-center text-center items-center w-[35px] h-[35px] cursor-pointer"
                onClick={() => handleQuantityChange(1)}
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
                className={`bg-black flex flex-row items-center gap-2 font-coolvetica font-medium text-white rounded-full p-4 text-4xl ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={!disabled ? startAddingProcess : undefined}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                Agregar
              </button>
            </div>
          ) : (
            <div
              className={`${
                quantity > 0 ? 'bg-black border text-gray-100' : 'bg-gray-50'
              } rounded-3xl font-black border border-black border-opacity-20 flex items-center justify-center pb-0.5 w-[35px] h-[35px] text-center cursor-pointer`}
              onClick={startAddingProcess}
            >
              {quantity > 0 ? quantity : '+'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuickAddToCart;
