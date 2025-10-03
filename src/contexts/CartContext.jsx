// contexts/CartContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cartItems");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  const generateCartItemId = (productId, variantId) => {
    return `${productId}-${variantId || "default"}`;
  };

  const total = Object.values(cartItems).reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  const cartArray = Object.values(cartItems);

  const addToCart = (item) => {
    const cartItemId = generateCartItemId(item.productId, item.variantId);

    setCartItems((prevCart) => {
      const existingItem = prevCart[cartItemId];

      if (existingItem) {
        return {
          ...prevCart,
          [cartItemId]: {
            ...existingItem,
            quantity: existingItem.quantity + item.quantity,
          },
        };
      } else {
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

  // NUEVO: Actualizar propiedades específicas de un item
  const updateCartItem = (itemId, updates) => {
    setCartItems((prevCart) => {
      const item = prevCart[itemId];
      if (!item) return prevCart;

      return {
        ...prevCart,
        [itemId]: {
          ...item,
          ...updates,
        },
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevCart) => {
      const newCart = { ...prevCart };
      delete newCart[itemId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCartItems({});
  };

  const addItem = (item) => {
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
      name: item.name,
      variants: item.variants || [],
      infiniteStock: item.infiniteStock || false, // ← CAMBIO AQUÍ
      stockReference: item.stockReference || "",
      availableStock: item.availableStock || 0,
      stockVersion: item.stockVersion || 0,
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

  const [lastCart, setLastCart] = useState([]);
  const [envioExpress, setEnvioExpress] = useState(0);

  const addLastCart = () => {
    setLastCart(cartArray);
  };

  const changeLastCart = () => {
    clearCart();
    lastCart.forEach((item) => addItem(item));
  };

  const setEnvioExpressValue = (value) => {
    setEnvioExpress(value);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartArray,
        total,
        addToCart,
        updateQuantity,
        updateCartItem, // NUEVO
        removeFromCart,
        clearCart,
        cart: cartArray,
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

export const createCartItem = (
  product,
  selectedVariant = null,
  quantity = 1
) => {
  const variant =
    selectedVariant ||
    product.variants?.find((v) => v.default) ||
    product.variants?.[0];

  const basePrice = product.price || 0;
  const variantPrice = variant?.price || 0;
  const finalPrice = basePrice + variantPrice;

  const getProductImage = () => {
    if (!product.img) return "";
    if (Array.isArray(product.img)) {
      return product.img[0] || "";
    }
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
    name: product.name,
    price: finalPrice,
    variants: selectedVariant ? [selectedVariant] : [],
    img: getProductImage(),
    infiniteStock: product.infiniteStock || false,
    stockReference: variant?.stockReference || "",
    availableStock: variant?.stockSummary?.totalStock || 0,
    stockVersion: variant?.stockSummary?.version || 0,
    restrictions: product.restrictions || { fulfillmentMethodsExcluded: [] }, // ⭐ AGREGAR ESTA LÍNEA
  };
};
