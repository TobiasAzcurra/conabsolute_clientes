// helpers/priceCalculator.js

/**
 * Calcula el desglose de precios de un producto con variante y modifiers
 * @param {Object} product - El producto base
 * @param {Object|null} variant - La variante seleccionada
 * @param {Object} modifierSelections - Las selecciones de modifiers {selections: {}, additionalPrice: 0, isValid: boolean}
 * @returns {Object} Desglose de precios {basePrice, variantPrice, modifiersPrice, totalPrice}
 */
export const calculateProductPrice = (
  product,
  variant = null,
  modifierSelections = {}
) => {
  const basePrice = product?.price || 0;
  const variantPrice = variant?.price || 0;
  const modifiersPrice = modifierSelections?.additionalPrice || 0;

  return {
    basePrice,
    variantPrice,
    modifiersPrice,
    totalPrice: basePrice + variantPrice + modifiersPrice,
  };
};

/**
 * Calcula el precio total de un item que ya está en el carrito
 * @param {Object} cartItem - Item del carrito
 * @returns {number} Precio total del item
 */
export const calculateItemPrice = (cartItem) => {
  // Priorizar finalPrice si existe, sino calcular desde componentes
  if (cartItem.finalPrice !== undefined && cartItem.finalPrice !== null) {
    return cartItem.finalPrice;
  }

  const basePrice = cartItem.basePrice || 0;
  const variantPrice = cartItem.variantPrice || 0;
  const modifiersPrice = cartItem.modifiersPrice || 0;

  return basePrice + variantPrice + modifiersPrice;
};

/**
 * Calcula el precio total de un item multiplicado por cantidad
 * @param {Object} cartItem - Item del carrito
 * @param {number} quantity - Cantidad de items
 * @returns {number} Precio total (precio unitario * cantidad)
 */
export const calculateItemTotal = (cartItem, quantity = 1) => {
  return calculateItemPrice(cartItem) * quantity;
};
