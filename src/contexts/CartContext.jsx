// contexts/CartContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  calculateProductPrice,
  calculateItemPrice,
} from "../helpers/priceCalculator.js";

const CartContext = createContext();

const generateCartItemId = (productId, variantId, modifierSelections = {}) => {
  const modifiersKey =
    Object.keys(modifierSelections).length > 0
      ? JSON.stringify(
          Object.entries(modifierSelections)
            .sort(([a], [b]) => a.localeCompare(b))
            .reduce((acc, [key, value]) => {
              acc[key] = Array.isArray(value) ? [...value].sort() : value;
              return acc;
            }, {})
        )
      : "";

  return `${productId}-${variantId || "default"}${
    modifiersKey ? `-${btoa(modifiersKey)}` : ""
  }`;
};

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

  // Memoizar subtotal (sin delivery ni fees)
  const subtotal = useMemo(() => {
    return Object.values(cartItems).reduce((sum, item) => {
      return sum + calculateItemPrice(item) * item.quantity;
    }, 0);
  }, [cartItems]);

  // Memoizar total (para mantener compatibilidad)
  const total = useMemo(() => {
    return Object.values(cartItems).reduce(
      (sum, item) => sum + item.finalPrice * item.quantity,
      0
    );
  }, [cartItems]);

  const cartArray = Object.values(cartItems);

  const addToCart = (item) => {
    console.log("➕ addToCart llamado con:", {
      productId: item.productId,
      variantId: item.variantId,
      modifierSelections: item.modifierSelections,
      quantity: item.quantity,
    });

    const cartItemId = generateCartItemId(
      item.productId,
      item.variantId,
      item.modifierSelections
    );

    setCartItems((prevCart) => {
      const existingItem = prevCart[cartItemId];

      if (existingItem) {
        console.log("✅ Item existente encontrado, sumando cantidad:", {
          cartItemId,
          cantidadPrevia: existingItem.quantity,
          cantidadASumar: item.quantity,
          cantidadFinal: existingItem.quantity + item.quantity,
        });
        return {
          ...prevCart,
          [cartItemId]: {
            ...existingItem,
            quantity: existingItem.quantity + item.quantity,
          },
        };
      } else {
        console.log("🆕 Item nuevo, agregando al carrito:", {
          cartItemId,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
        });
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
      infiniteStock: item.infiniteStock || false,
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
        subtotal, // ← NUEVO
        total,
        addToCart,
        updateQuantity,
        updateCartItem,
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
  console.log("🏗️ createCartItem llamado:", {
    productId: product.id,
    productName: product.name,
    variantId: selectedVariant?.id,
    quantity,
    modifierSelections: product.modifierSelections,
  });

  const variant =
    selectedVariant ||
    product.variants?.find((v) => v.default) ||
    product.variants?.[0];

  const priceBreakdown = calculateProductPrice(product, variant, {
    additionalPrice: product.modifiersPrice || 0,
  });

  console.log("💰 createCartItem - Usando priceCalculator:", priceBreakdown);

  const getProductImage = () => {
    if (!product.img) return "";
    if (Array.isArray(product.img)) {
      return product.img[0] || "";
    }
    return product.img;
  };

  const cartItem = {
    productId: product.id,
    productName: product.name,
    variantId: variant?.id || "default",
    variantName: variant?.name || "default",
    quantity: quantity,
    basePrice: priceBreakdown.basePrice,
    variantPrice: priceBreakdown.variantPrice,
    finalPrice: priceBreakdown.totalPrice,
    category: product.category,
    name: product.name,
    price: priceBreakdown.totalPrice,
    variants: selectedVariant ? [selectedVariant] : [],
    img: getProductImage(),
    infiniteStock: product.infiniteStock || false,
    stockReference: variant?.stockReference || "",
    availableStock: variant?.stockSummary?.totalStock || 0,
    stockVersion: variant?.stockSummary?.version || 0,
    restrictions: product.restrictions || { fulfillmentMethodsExcluded: [] },
    modifierSelections: product.modifierSelections || {},
    modifiersPrice: priceBreakdown.modifiersPrice,
  };

  cartItem.id = generateCartItemId(
    cartItem.productId,
    cartItem.variantId,
    cartItem.modifierSelections
  );

  console.log("✨ Cart Item creado:", {
    id: cartItem.id,
    productName: cartItem.productName,
    variantName: cartItem.variantName,
    priceBreakdown: priceBreakdown,
  });

  return cartItem;
};
