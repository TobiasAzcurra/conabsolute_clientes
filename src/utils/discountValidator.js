import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

// Helper de redondeo
const round2 = (n) => Math.round(n * 100) / 100;

// Validación LIGERA (para tiempo real mientras el usuario escribe)
export const validateDiscountCodeBasic = async (code, enterpriseData) => {
  if (!code || code.trim().length < 3) {
    return { isValid: false, reason: "too_short" };
  }

  try {
    const codeUpper = code.trim().toUpperCase();

    // Buscar el código en Firebase
    const discountCodesRef = collection(
      db,
      "absoluteClientes",
      enterpriseData.empresaId,
      "sucursales",
      enterpriseData.sucursalId,
      "discountCodes"
    );

    const q = query(discountCodesRef, where("code", "==", codeUpper));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { isValid: false, reason: "not_found" };
    }

    const discountDoc = snapshot.docs[0];
    const discountData = discountDoc.data();

    // Validaciones básicas
    if (discountData.status !== "active") {
      return { isValid: false, reason: "inactive" };
    }

    // Verificar fechas
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    if (
      discountData.validity?.startDate &&
      today < discountData.validity.startDate
    ) {
      return { isValid: false, reason: "not_started" };
    }

    if (
      discountData.validity?.endDate &&
      today > discountData.validity.endDate
    ) {
      return { isValid: false, reason: "expired" };
    }

    // Si pasa validaciones básicas
    return {
      isValid: true,
      discountId: discountDoc.id,
      discountData,
    };
  } catch (error) {
    console.error("Error validando código básico:", error);
    return { isValid: false, reason: "error" };
  }
};

// Validación COMPLETA (para submit, incluye todas las restricciones)
export const validateAndCalculateDiscount = async (
  code,
  cartItems,
  subtotal,
  deliveryMethod,
  paymentMethod,
  enterpriseData
) => {
  // 1. Primero validación básica
  const basicValidation = await validateDiscountCodeBasic(code, enterpriseData);

  if (!basicValidation.isValid) {
    return {
      isValid: false,
      discount: 0,
      reason: basicValidation.reason,
      message: getErrorMessage(basicValidation.reason),
    };
  }

  const { discountData, discountId } = basicValidation;
  const config = discountData.discountConfig;
  const restrictions = discountData.restrictions || {};

  // 2. Validar monto mínimo
  if (config.minOrderAmount && subtotal < config.minOrderAmount) {
    return {
      isValid: false,
      discount: 0,
      reason: "min_amount",
      message: `Monto mínimo requerido: $${config.minOrderAmount}`,
    };
  }

  // 3. Validar método de entrega
  if (restrictions.fulfillmentsMethodsExcluded?.includes(deliveryMethod)) {
    return {
      isValid: false,
      discount: 0,
      reason: "delivery_excluded",
      message: "Código no válido para este método de entrega",
    };
  }

  // 4. Validar método de pago
  if (restrictions.paymentMethodsExcluded?.includes(paymentMethod)) {
    return {
      isValid: false,
      discount: 0,
      reason: "payment_excluded",
      message: "Código no válido para este método de pago",
    };
  }

  // 5. Validar items excluidos
  const hasExcludedItem = cartItems.some((item) =>
    restrictions.itemsExcluded?.includes(item.productId)
  );

  if (hasExcludedItem) {
    return {
      isValid: false,
      discount: 0,
      reason: "excluded_items",
      message: "Algunos productos no aplican para este descuento",
    };
  }

  // 6. Validar horarios excluidos
  if (restrictions.timeExcluded && restrictions.timeExcluded.length > 0) {
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const currentTime = now.getTime();

    const isTimeExcluded = restrictions.timeExcluded.some((exclusion) => {
      if (exclusion.day !== currentDay) return false;

      return exclusion.hoursRange?.some((range) => {
        return currentTime >= range.start && currentTime <= range.end;
      });
    });

    if (isTimeExcluded) {
      return {
        isValid: false,
        discount: 0,
        reason: "time_excluded",
        message: "Código no válido en este horario",
      };
    }
  }

  // 7. Verificar usos máximos
  const currentUses = Object.keys(
    discountData.usage?.usageTracking || {}
  ).length;
  const maxUses = discountData.usage?.maxUses;

  if (maxUses && currentUses >= maxUses) {
    return {
      isValid: false,
      discount: 0,
      reason: "max_uses",
      message: "Este código alcanzó el límite de usos",
    };
  }

  // 8. Calcular descuento
  let discount = 0;

  if (config.type === "percentage") {
    // Porcentaje sobre el subtotal
    discount = round2((subtotal * config.value) / 100);

    // Respetar máximo si existe
    if (config.maxDiscountAmount && discount > config.maxDiscountAmount) {
      discount = config.maxDiscountAmount;
    }
  } else if (config.type === "fixed") {
    // Monto fijo
    discount = round2(config.value);

    // No puede ser mayor que el subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }
  }

  // 9. Retornar resultado exitoso
  return {
    isValid: true,
    discount,
    discountId,
    discountData: {
      code: discountData.code,
      type: config.type,
      value: config.value,
      appliedDiscount: discount,
      stackable: restrictions.stackable || false,
    },
    message: `¡Descuento aplicado: -$${discount}!`,
  };
};

// Helper para mensajes de error amigables
const getErrorMessage = (reason) => {
  const messages = {
    too_short: "Ingresa un código válido",
    not_found: "Código no encontrado",
    inactive: "Este código no está activo",
    not_started: "Este código aún no es válido",
    expired: "Este código expiró",
    error: "Error al validar código",
  };

  return messages[reason] || "Código inválido";
};
