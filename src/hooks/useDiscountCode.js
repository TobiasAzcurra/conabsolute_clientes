import { useState, useEffect } from "react";
import { validateAndCalculateDiscount } from "../utils/discountValidator";

export const useDiscountCode = (
  empresaId,
  sucursalId,
  cartItems,
  deliveryMethod,
  paymentMethod,
  subtotal,
  timezone = "America/Argentina/Buenos_Aires" // ← NUEVO parámetro
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

      const enterpriseData = {
        empresaId,
        sucursalId,
        timezone, // ← Pasar timezone
      };

      try {
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
      } catch (error) {
        console.error("Error en validación de descuento:", error);
        setValidation({
          isValid: false,
          checked: true,
          discount: 0,
          message: "Error al validar el código. Intenta nuevamente.",
          reason: "error",
        });
      } finally {
        setIsValidating(false);
      }
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
    timezone,
  ]);

  return {
    code,
    setCode,
    isValidating,
    validation,
  };
};
