import { useState, useEffect } from "react";
import {
  validateDiscountCodeBasic,
  validateAndCalculateDiscount,
} from "../utils/discountValidator";

// Recibir IDs directamente en lugar de objeto
export const useDiscountCode = (empresaId, sucursalId) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [basicValidation, setBasicValidation] = useState({
    isValid: false,
    checked: false,
  });

  // Validación básica en tiempo real (con debounce)
  useEffect(() => {
    if (!code || code.length < 3) {
      setBasicValidation({ isValid: false, checked: false });
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);

      // Construir enterpriseData aquí
      const enterpriseData = { empresaId, sucursalId };

      const result = await validateDiscountCodeBasic(code, enterpriseData);
      setBasicValidation({
        isValid: result.isValid,
        checked: true,
        reason: result.reason,
      });
      setIsValidating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [code, empresaId, sucursalId]); // Dependencias primitivas, no objetos

  // Validación completa (llamar manualmente al hacer submit)
  const validateFull = async (
    cartItems,
    subtotal,
    deliveryMethod,
    paymentMethod
  ) => {
    if (!code) {
      return { isValid: false, discount: 0 };
    }

    const enterpriseData = { empresaId, sucursalId };

    return await validateAndCalculateDiscount(
      code,
      cartItems,
      subtotal,
      deliveryMethod,
      paymentMethod,
      enterpriseData
    );
  };

  return {
    code,
    setCode,
    isValidating,
    basicValidation,
    validateFull,
  };
};
