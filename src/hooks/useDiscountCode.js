import { useState, useEffect } from "react";
import { validateAndCalculateDiscount } from "../utils/discountValidator";

export const useDiscountCode = (
  empresaId,
  sucursalId,
  cartItems,
  deliveryMethod,
  paymentMethod,
  subtotal // ← NUEVO: recibir como parámetro
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

      const enterpriseData = { empresaId, sucursalId };

      // Ya no calcular subtotal aquí, usar el que viene por parámetro
      const result = await validateAndCalculateDiscount(
        code,
        cartItems,
        subtotal, // ← usar el memoizado del context
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
  }, [
    code,
    empresaId,
    sucursalId,
    cartItems,
    deliveryMethod,
    paymentMethod,
    subtotal,
  ]);

  return {
    code,
    setCode,
    isValidating,
    validation,
  };
};
