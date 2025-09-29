// contexts/CartContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Estado del carrito - mismo patrón que POS (object con itemId como key)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cartItems");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return {};
    }
  });

  // Auto-persistir en localStorage cuando cambie el carrito
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  // Generar ID único para items del carrito
  const generateCartItemId = (productId, variantId) => {
    return `${productId}-${variantId || "default"}`;
  };

  // Calcular total del carrito
  const total = Object.values(cartItems).reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  // Convertir a array para compatibilidad con componentes existentes
  const cartArray = Object.values(cartItems);

  // Función para agregar item al carrito
  const addToCart = (item) => {
    const cartItemId = generateCartItemId(item.productId, item.variantId);

    setCartItems((prevCart) => {
      const existingItem = prevCart[cartItemId];

      if (existingItem) {
        // Si ya existe, sumar cantidades
        return {
          ...prevCart,
          [cartItemId]: {
            ...existingItem,
            quantity: existingItem.quantity + item.quantity,
          },
        };
      } else {
        // Nuevo item
        return {
          ...prevCart,
          [cartItemId]: {
            ...item,
            id: cartItemId,
          },
        };
      }
    });
  };

  // Función para actualizar cantidad
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems((prevCart) => {
      const item = prevCart[itemId];
      if (!item) return prevCart;

      return {
        ...prevCart,
        [itemId]: {
          ...item,
          quantity: newQuantity,
        },
      };
    });
  };

  // Función para remover item del carrito
  const removeFromCart = (itemId) => {
    setCartItems((prevCart) => {
      const newCart = { ...prevCart };
      delete newCart[itemId];
      return newCart;
    });
  };

  // Función para limpiar carrito
  const clearCart = () => {
    setCartItems({});
  };

  // Funciones para compatibilidad con Redux existente
  const addItem = (item) => {
    // Convertir formato Redux a formato nuevo
    const cartItem = {
      productId: item.productId || item.id,
      productName: item.name,
      variantId: item.variantId || "default",
      variantName: item.variantName || "default",
      quantity: item.quantity,
      basePrice: item.basePrice || item.price,
      variantPrice:
        (item.finalPrice || item.price) - (item.basePrice || item.price),
      finalPrice: item.finalPrice || item.price,
      category: item.category,
      name: item.name, // Para compatibilidad
      variants: item.variants || [],
      isInfiniteStock: item.isInfiniteStock || false,
      stockReference: item.stockReference || "",
      availableStock: item.availableStock || 0,
    };
    addToCart(cartItem);
  };

  const removeOneItem = (index) => {
    const item = cartArray[index];
    if (item) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const addOneItem = (index) => {
    const item = cartArray[index];
    if (item) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const removeItem = (index) => {
    const item = cartArray[index];
    if (item) {
      removeFromCart(item.id);
    }
  };

  // Estado adicional para compatibilidad
  const [lastCart, setLastCart] = useState([]);
  const [envioExpress, setEnvioExpress] = useState(0);

  const addLastCart = () => {
    setLastCart(cartArray);
  };

  const changeLastCart = () => {
    // Limpiar carrito actual y cargar lastCart
    clearCart();
    lastCart.forEach((item) => addItem(item));
  };

  // ← NUEVO: Función para manejar envío express (requerida por useFormStates)
  const setEnvioExpressValue = (value) => {
    setEnvioExpress(value);
  };

  return (
    <CartContext.Provider
      value={{
        // Nuevo patrón (preferido)
        cartItems,
        cartArray,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,

        // Compatibilidad con Redux existente
        cart: cartArray, // Para useSelector((state) => state.cartState.cart)
        addItem,
        removeOneItem,
        addOneItem,
        removeItem,
        lastCart,
        addLastCart,
        changeLastCart,
        envioExpress,
        setEnvioExpress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

// Helper function para crear items del carrito desde productos
export const createCartItem = (
  product,
  selectedVariant = null,
  quantity = 1
) => {
  // Encontrar variante (seleccionada o default)
  const variant =
    selectedVariant ||
    product.variants?.find((v) => v.default) ||
    product.variants?.[0];

  const basePrice = product.price || 0;
  const variantPrice = variant?.price || 0;
  const finalPrice = basePrice + variantPrice;

  // ← NUEVO: Obtener imagen del producto base
  const getProductImage = () => {
    if (!product.img) return "";

    // Si es array, tomar la primera
    if (Array.isArray(product.img)) {
      return product.img[0] || "";
    }

    // Si es string, devolverla directamente
    return product.img;
  };

  return {
    productId: product.id,
    productName: product.name,
    variantId: variant?.id || "default",
    variantName: variant?.name || "default",
    quantity: quantity,
    basePrice: basePrice,
    variantPrice: variantPrice,
    finalPrice: finalPrice,
    category: product.category,

    // Para compatibilidad con sistema actual
    name: product.name,
    price: finalPrice,
    variants: selectedVariant ? [selectedVariant] : [],

    // ← NUEVO: Agregar imagen del producto
    img: getProductImage(),

    // Para futuro con StockManager
    isInfiniteStock: product.infiniteStock || false,
    stockReference: variant?.stockReference || "",
    availableStock: variant?.stockSummary?.totalStock || 0,
  };
};
