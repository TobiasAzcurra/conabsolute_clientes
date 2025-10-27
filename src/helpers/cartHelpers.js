// helpers/cartHelpers.js
import { createCartItem } from "../contexts/CartContext";

/**
 * Helper para agregar productos al carrito desde cualquier componente
 * Reemplaza las llamadas a dispatch(addItem())
 */
export const addProductToCart = (
  product,
  selectedVariant = null,
  quantity = 1,
  addToCart
) => {
  // Validaciones básicas
  if (!product || !product.id) {
    console.error("Producto inválido:", product);
    return false;
  }

  if (quantity <= 0) {
    console.error("Cantidad debe ser mayor a 0");
    return false;
  }

  try {
    // Crear item usando el helper del CartContext
    const cartItem = createCartItem(product, selectedVariant, quantity);

    // Agregar al carrito
    addToCart(cartItem);

    console.log("Producto agregado al carrito:", {
      product: product.name,
      variant: selectedVariant?.name || "default",
      quantity: quantity,
      price: cartItem.finalPrice,
    });

    return true;
  } catch (error) {
    console.error("Error agregando producto al carrito:", error);
    return false;
  }
};

/**
 * Helper para componentes que usaban Redux dispatch
 * Mantiene la misma API para facilitar migración
 */
export const useCartActions = (addToCart) => {
  const addItem = (item) => {
    // Convertir formato anterior a nuevo formato
    const cartItem = createCartItem(
      {
        id: item.productId || item.id,
        name: item.name,
        price: item.basePrice || item.price,
        category: item.category,
        variants: item.variants,
      },
      item.selectedVariant,
      item.quantity
    );

    addToCart(cartItem);
  };

  return { addItem };
};

// Ejemplo de uso en componentes:

// ANTES (con Redux):
// const dispatch = useDispatch();
// const handleAddToCart = () => {
//   dispatch(addItem({
//     id: product.id,
//     name: product.name,
//     price: product.price,
//     quantity: 1
//   }));
// };

// DESPUÉS (con Context):
// const { addToCart } = useCart();
// const handleAddToCart = () => {
//   addProductToCart(product, selectedVariant, 1, addToCart);
// };
