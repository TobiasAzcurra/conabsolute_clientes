import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  addItem,
  updateItemQuantity,
  removeItem,
} from "../../../redux/cart/cartSlice";
import {
  addProductToOrder,
  ReadMateriales,
  ReadData,
} from "../../../firebase/uploadOrder";
import { calcularCostoHamburguesa } from "../../../helpers/currencyFormat";
import { motion } from "framer-motion";

const QuickAddToCart = ({
  product,
  animateFromCenter,
  toppings,
  isOrderItem = false,
  onOrderQuantityChange = null,
  initialOrderQuantity = null,
  isPedidoComponente = false,
  currentOrder = null,
  calculatedPrice = null,
}) => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cartState);
  const location = useLocation();

  // 🔥 Normalizar el producto para asegurar compatibilidad
  const normalizedProduct = {
    ...product,
    name: product.name || product.data?.name || "Producto sin nombre",
    price: product.price || product.data?.price || 0,
    img: product.img || product.data?.img || "",
    category:
      product.category ||
      product.categoria ||
      product.data?.categoria ||
      "default",
    type: product.type || "regular",
  };

  console.log(`🛒 QuickAddToCart recibió producto:`, {
    original: product,
    normalized: normalizedProduct,
  });

  if (!normalizedProduct.category || normalizedProduct.category === "default") {
    console.warn(
      "⚠️ El producto no tiene una categoría definida. Se usará 'default'.",
      normalizedProduct
    );
  }

  const effectiveToppings =
    toppings && toppings.length > 0
      ? toppings
      : normalizedProduct.toppings || [];

  const compareToppings = (toppings1, toppings2) => {
    if (!toppings1 || !toppings2) return false;
    if (toppings1.length !== toppings2.length) return false;
    const sorted1 = [...toppings1].sort((a, b) => a.id - b.id);
    const sorted2 = [...toppings2].sort((a, b) => a.id - b.id);
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
  };

  const cartItem = !isOrderItem
    ? cart.find(
        (item) =>
          item.name === normalizedProduct.name &&
          item.category === normalizedProduct.category &&
          compareToppings(item.toppings, effectiveToppings)
      )
    : null;

  const initialQuantity = isOrderItem
    ? initialOrderQuantity || normalizedProduct.quantity
    : cartItem
    ? cartItem.quantity
    : 0;

  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const quantityRef = useRef(quantity);
  const pendingUpdateRef = useRef(null);

  useEffect(() => {
    if (isOrderItem) {
      setQuantity(initialOrderQuantity || normalizedProduct.quantity);
      quantityRef.current = initialOrderQuantity || normalizedProduct.quantity;
    } else {
      setQuantity(cartItem ? cartItem.quantity : 0);
      quantityRef.current = cartItem ? cartItem.quantity : 0;
    }
  }, [cartItem, initialOrderQuantity, isOrderItem, normalizedProduct.quantity]);

  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, []);

  const handleIncrement = () => {
    setQuantity((prevQuantity) => {
      const newQuantity = prevQuantity + 1;
      quantityRef.current = newQuantity;
      console.log(
        `➕ Incrementando ${normalizedProduct.name} a ${newQuantity}`
      );
      return newQuantity;
    });
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity((prevQuantity) => {
        const newQuantity = prevQuantity - 1;
        quantityRef.current = newQuantity;
        console.log(
          `➖ Decrementando ${normalizedProduct.name} a ${newQuantity}`
        );
        return newQuantity;
      });
    }
  };

  const startAddingProcess = async () => {
    console.log(`🔵 Iniciando proceso de agregar: ${normalizedProduct.name}`);
    setIsEditing(true);
    setIsAdding(true);

    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }

    pendingUpdateRef.current = setTimeout(async () => {
      try {
        if (isPedidoComponente && currentOrder?.id) {
          // Si el producto ya existe en el pedido, usamos updateOrderItemQuantity
          if (normalizedProduct.orderIndex !== undefined) {
            await updateOrderItemQuantity(
              currentOrder.id,
              obtenerFechaActual(),
              normalizedProduct.orderIndex,
              quantityRef.current
            );
          } else {
            // Si es un producto nuevo, usamos addProductToOrder
            if (quantityRef.current > 0) {
              // Fetch materials and products data for cost calculation
              const materialesData = await ReadMateriales();
              const productsData = await ReadData();

              // Find the product data
              const productData = productsData.find(
                (p) => p.data.name === normalizedProduct.name
              )?.data;

              // Calculate the cost using the existing helper function
              const costoBurger = productData
                ? calcularCostoHamburguesa(
                    materialesData,
                    productData.ingredients
                  )
                : 0;

              // Calculate toppings cost
              let costoToppings = 0;
              if (effectiveToppings.length > 0) {
                effectiveToppings.forEach((topping) => {
                  const materialTopping = materialesData.find(
                    (material) =>
                      material.nombre.toLowerCase() ===
                      topping.name.toLowerCase()
                  );
                  if (materialTopping) {
                    costoToppings += materialTopping.costo;
                  }
                });
              }

              // Prepare the product with costs
              const productWithCosts = {
                ...normalizedProduct,
                toppings: effectiveToppings,
                costoBurger:
                  (costoBurger + costoToppings) * quantityRef.current,
              };

              await addProductToOrder(
                currentOrder.id,
                productWithCosts,
                quantityRef.current
              );
            }
          }
        } else if (!isOrderItem) {
          // Lógica original del carrito
          if (quantityRef.current === 0) {
            if (cartItem) {
              const itemIndex = cart.findIndex(
                (item) =>
                  item.name === normalizedProduct.name &&
                  compareToppings(item.toppings, effectiveToppings)
              );
              console.log(
                `🗑️ Removiendo ${normalizedProduct.name} del carrito`
              );
              dispatch(removeItem(itemIndex));
            }
          } else if (quantityRef.current >= 1) {
            if (cartItem) {
              const updatePayload = {
                name: normalizedProduct.name,
                category: normalizedProduct.category,
                toppings: effectiveToppings,
                quantity: quantityRef.current,
              };
              console.log(
                `🔄 Actualizando cantidad de ${normalizedProduct.name} a ${quantityRef.current}`
              );
              dispatch(updateItemQuantity(updatePayload));
            } else {
              const newItem = {
                name: normalizedProduct.name,
                price: calculatedPrice || normalizedProduct.price,
                img: normalizedProduct.img,
                toppings: effectiveToppings,
                quantity: quantityRef.current,
                category: normalizedProduct.category,
                type: normalizedProduct.type,
              };
              console.log(`✅ Agregando nuevo item al carrito:`, newItem);
              dispatch(addItem(newItem));
            }
          }
        }

        if (onOrderQuantityChange) {
          onOrderQuantityChange(quantityRef.current);
        }
      } catch (error) {
        console.error("❌ Error in startAddingProcess:", error);
      } finally {
        setIsAdding(false);
        setTimeout(() => setIsEditing(false), 300);
      }
    }, 2000);
  };

  const isCarritoPage = location.pathname === "/carrito";
  const shouldAnimateBothSides =
    /^\/menu\/(mates|termos|bombillas|yerbas|canastas|burgers|bebidas|papas)\/[^\/]+$/.test(
      location.pathname
    ) || animateFromCenter;

  const isMenuProductPage =
    /^\/menu\/(mates|termos|bombillas|yerbas|canastas|burgers|bebidas|papas)\/[^\/]+$/.test(
      location.pathname
    );

  return (
    <div className="pt-0.5 w-[35px] h-[35px] text-center cursor-pointer flex items-center justify-center relative">
      {isEditing ? (
        <motion.div
          initial={{ width: 35 }}
          animate={{ width: isAdding ? 100 : 35 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center absolute ${
            shouldAnimateBothSides
              ? "left-1/2 transform -translate-x-1/2"
              : isCarritoPage || isPedidoComponente
              ? "left-0"
              : "right-0"
          } top-0 flex-row rounded-3xl font-black border-black border-2 bg-gray-100`}
        >
          <div
            className="text-black font-coolvetica font-black text-center items-center flex justify-center w-[35px] h-[35px] cursor-pointer"
            onClick={handleDecrement}
          >
            -
          </div>
          <span className="font-coolvetica font-black text-center items-center flex justify-center w-[35px] h-[35px]">
            {quantity}
          </span>
          <div
            className="text-black font-coolvetica font-black text-center items-center flex justify-center w-[35px] h-[35px] cursor-pointer"
            onClick={handleIncrement}
          >
            +
          </div>
        </motion.div>
      ) : isMenuProductPage && quantity === 0 && !isOrderItem ? (
        <button
          className="bg-black flex flex-row items-center gap-2 font-coolvetica font-medium text-white rounded-full p-4 text-4xl"
          onClick={startAddingProcess}
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
      ) : (
        <div
          className={`${
            quantity > 0 ? "bg-black border text-gray-100" : "bg-gray-100"
          } rounded-3xl font-black border border-black border-opacity-20 flex items-center justify-center pb-0.5 w-[35px] h-[35px] text-center cursor-pointer`}
          onClick={startAddingProcess}
        >
          {quantity > 0 ? quantity : "+"}
        </div>
      )}
    </div>
  );
};

export default QuickAddToCart;
