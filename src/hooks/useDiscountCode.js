import { useState, useEffect } from "react";
import { validateAndCalculateDiscount } from "../utils/discountValidator";

export const useDiscountCode = (
  empresaId,
  sucursalId,
  cartItems,
  deliveryMethod,
  paymentMethod
) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState({
    isValid: false,
    checked: false,
    discount: 0,
    message: "",
    reason: "",
  });

  useEffect(() => {
    if (!code || code.length < 3) {
      setValidation({
        isValid: false,
        checked: false,
        discount: 0,
        message: "",
        reason: "",
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);

      // Calcular subtotal
      const subtotal = cartItems.reduce((sum, item) => {
        const price =
          (item.basePrice || item.price || 0) + (item.variantPrice || 0);
        return sum + price * item.quantity;
      }, 0);

      const enterpriseData = { empresaId, sucursalId };

      // Validación COMPLETA en tiempo real
      const result = await validateAndCalculateDiscount(
        code,
        cartItems,
        subtotal,
        deliveryMethod,
        paymentMethod,
        enterpriseData
      );

      setValidation({
        isValid: result.isValid,
        checked: true,
        discount: result.discount || 0,
        message: result.message,
        reason: result.reason || "",
        discountData: result.discountData,
        discountId: result.discountId,
      });

      setIsValidating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [code, empresaId, sucursalId, cartItems, deliveryMethod, paymentMethod]);

  return {
    code,
    setCode,
    isValidating,
    validation,
  };
};
