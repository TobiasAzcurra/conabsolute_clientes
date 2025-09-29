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

    console.log("🔍 VALIDACIÓN BÁSICA:", codeUpper);

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
      console.log("❌ Código no encontrado");
      return { isValid: false, reason: "not_found" };
    }

    const discountDoc = snapshot.docs[0];
    const discountData = discountDoc.data();

    console.log("✅ Código encontrado:", {
      code: discountData.code,
      status: discountData.status,
      itemsExcluded: discountData.restrictions?.itemsExcluded || [],
      type: discountData.discountConfig?.type,
      value: discountData.discountConfig?.value,
    });

    if (discountData.status !== "active") {
      console.log("❌ Código inactivo");
      return { isValid: false, reason: "inactive" };
    }

    const today = new Date().toISOString().split("T")[0];
    if (
      discountData.validity?.startDate &&
      today < discountData.validity.startDate
    ) {
      console.log("❌ Código aún no válido");
      return { isValid: false, reason: "not_started" };
    }

    if (
      discountData.validity?.endDate &&
      today > discountData.validity.endDate
    ) {
      console.log("❌ Código expirado");
      return { isValid: false, reason: "expired" };
    }

    console.log("✅ Validación básica APROBADA");
    return {
      isValid: true,
      discountId: discountDoc.id,
      discountData,
    };
  } catch (error) {
    console.error("❌ Error validando código básico:", error);
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
  console.log("\n========================================");
  console.log("🎫 VALIDACIÓN COMPLETA DE DESCUENTO");
  console.log("========================================");

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

  console.log("\n📋 DATOS DEL DESCUENTO:");
  console.log("  Código:", discountData.code);
  console.log("  Tipo:", config.type);
  console.log(
    "  Valor:",
    config.value + (config.type === "percentage" ? "%" : "")
  );
  console.log("  Monto mínimo:", config.minOrderAmount || "Sin mínimo");
  console.log("  Descuento máximo:", config.maxDiscountAmount || "Sin máximo");

  console.log("\n🚫 RESTRICCIONES:");
  console.log("  Items excluidos:", restrictions.itemsExcluded || []);
  console.log(
    "  Métodos entrega excluidos:",
    restrictions.fulfillmentsMethodsExcluded || []
  );
  console.log(
    "  Métodos pago excluidos:",
    restrictions.paymentMethodsExcluded || []
  );

  console.log("\n🛒 CARRITO:");
  cartItems.forEach((item, i) => {
    console.log(`  [${i}] ${item.productName || item.name}`);
    console.log(`      productId: "${item.productId}"`);
    console.log(`      variantId: "${item.variantId}"`);
    console.log(
      `      precio: $${
        (item.basePrice || item.price || 0) + (item.variantPrice || 0)
      }`
    );
    console.log(`      cantidad: ${item.quantity}`);
  });

  // 2. Validar monto mínimo
  console.log("\n💵 VALIDANDO MONTO MÍNIMO:");
  if (config.minOrderAmount && subtotal < config.minOrderAmount) {
    console.log(
      `  ❌ Subtotal ($${subtotal}) < Mínimo requerido ($${config.minOrderAmount})`
    );
    return {
      isValid: false,
      discount: 0,
      reason: "min_amount",
      message: `Monto mínimo requerido: $${config.minOrderAmount}`,
    };
  }
  console.log(
    `  ✅ Subtotal ($${subtotal}) >= Mínimo ($${config.minOrderAmount || 0})`
  );

  // 3. Validar método de entrega
  console.log("\n🚚 VALIDANDO MÉTODO DE ENTREGA:");
  console.log(`  Método actual: "${deliveryMethod}"`);
  if (restrictions.fulfillmentsMethodsExcluded?.includes(deliveryMethod)) {
    console.log(`  ❌ Método excluido`);
    return {
      isValid: false,
      discount: 0,
      reason: "delivery_excluded",
      message: "Código no válido para este método de entrega",
    };
  }
  console.log(`  ✅ Método permitido`);

  // 4. Validar método de pago
  console.log("\n💳 VALIDANDO MÉTODO DE PAGO:");
  console.log(`  Método actual: "${paymentMethod}"`);
  if (restrictions.paymentMethodsExcluded?.includes(paymentMethod)) {
    console.log(`  ❌ Método excluido`);
    return {
      isValid: false,
      discount: 0,
      reason: "payment_excluded",
      message: "Código no válido para este método de pago",
    };
  }
  console.log(`  ✅ Método permitido`);

  // 5. Validar items/variantes excluidos
  console.log("\n🔍 VALIDANDO ITEMS EXCLUIDOS:");
  const hasExcludedItem = cartItems.some((item) => {
    const isProductExcluded = restrictions.itemsExcluded?.includes(
      item.productId
    );
    const isVariantExcluded = restrictions.itemsExcluded?.includes(
      item.variantId
    );

    console.log(`  Item: "${item.productName || item.name}"`);
    console.log(
      `    productId "${item.productId}" excluido: ${isProductExcluded}`
    );
    console.log(
      `    variantId "${item.variantId}" excluido: ${isVariantExcluded}`
    );

    if (isProductExcluded || isVariantExcluded) {
      console.log(`    ❌ ITEM EXCLUIDO`);
      return true;
    }
    console.log(`    ✅ Item permitido`);
    return false;
  });

  if (hasExcludedItem) {
    console.log("\n❌ RESULTADO: Carrito contiene items excluidos");
    return {
      isValid: false,
      discount: 0,
      reason: "excluded_items",
      message: "Algunos productos no aplican para este descuento",
    };
  }
  console.log("\n✅ Todos los items son elegibles");

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
  const currentUses = discountData.usage?.usageTracking?.length || 0;
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
  console.log("\n💰 CALCULANDO DESCUENTO:");

  const eligibleItems = cartItems.filter((item) => {
    const isProductExcluded = restrictions.itemsExcluded?.includes(
      item.productId
    );
    const isVariantExcluded = restrictions.itemsExcluded?.includes(
      item.variantId
    );
    return !isProductExcluded && !isVariantExcluded;
  });

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
    const itemPrice =
      (item.basePrice || item.price || 0) + (item.variantPrice || 0);
    const itemTotal = itemPrice * item.quantity;
    console.log(
      `  ${item.productName}: $${itemPrice} x ${item.quantity} = $${itemTotal}`
    );
    return sum + itemTotal;
  }, 0);

  console.log(`\n  Subtotal elegible: $${eligibleSubtotal}`);

  let discount = 0;

  if (config.type === "percentage") {
    discount = round2((eligibleSubtotal * config.value) / 100);
    console.log(`  ${config.value}% de $${eligibleSubtotal} = $${discount}`);

    if (config.maxDiscountAmount && discount > config.maxDiscountAmount) {
      console.log(`  Limitado a máximo: $${config.maxDiscountAmount}`);
      discount = config.maxDiscountAmount;
    }
  } else if (config.type === "fixed_amount") {
    discount = round2(config.value);

    if (discount > eligibleSubtotal) {
      discount = eligibleSubtotal;
    }
  }

  console.log(`\n✅ DESCUENTO FINAL: $${discount}`);
  console.log("========================================\n");

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
      eligibleSubtotal,
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
