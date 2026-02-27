import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { calculateItemPrice } from "../helpers/priceCalculator";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

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

    // Validar fechas con mejor manejo de errores
    try {
      // Timezone con fallback
      const timezone =
        enterpriseData.timezone || "America/Argentina/Buenos_Aires";
      console.log(`🌍 Usando timezone: ${timezone}`);

      const now = new Date();
      const nowInTimezone = toZonedTime(now, timezone);
      const todayStr = format(nowInTimezone, "yyyy-MM-dd");

      console.log(`📅 Fecha actual (${timezone}):`, todayStr);

      // Validar startDate
      if (
        discountData.restrictions?.validity?.startDate &&
        discountData.restrictions.validity.startDate.trim() !== ""
      ) {
        const startDate = discountData.restrictions.validity.startDate;
        console.log(`  Fecha inicio: ${startDate}`);

        if (todayStr < startDate) {
          console.log("❌ Código aún no válido");
          return {
            isValid: false,
            reason: "not_started",
            details: `Válido desde: ${startDate}`,
          };
        }
      }

      // Validar endDate
      if (
        discountData.restrictions?.validity?.endDate &&
        discountData.restrictions.validity.endDate.trim() !== ""
      ) {
        const endDate = discountData.restrictions.validity.endDate;
        console.log(`  Fecha fin: ${endDate}`);

        if (todayStr > endDate) {
          console.log("❌ Código expirado");
          return {
            isValid: false,
            reason: "expired",
            details: `Expiró el: ${endDate}`,
          };
        }
      }
    } catch (dateError) {
      console.error("❌ Error validando fechas:", dateError);
      // Si hay error con fechas, continuar sin validar fechas
      console.warn("⚠️ Continuando sin validar fechas de validez");
    }

    console.log("✅ Validación básica APROBADA");
    return {
      isValid: true,
      discountId: discountDoc.id,
      discountData,
    };
  } catch (error) {
    console.error("❌ Error validando código básico:", error);
    return {
      isValid: false,
      reason: "error",
      details: error.message,
    };
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
      message: getErrorMessage(basicValidation.reason, basicValidation.details),
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
    console.log(`      precio: $${calculateItemPrice(item)}`);
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
      message: getErrorMessage(
        "min_amount",
        `Monto mínimo: $${config.minOrderAmount}`
      ),
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
      message: getErrorMessage("delivery_excluded"),
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
      message: getErrorMessage("payment_excluded"),
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

    // ✨ NUEVO: Calcular descuento parcial
    const excludedProducts = cartItems
      .filter((item) => {
        const isProductExcluded = restrictions.itemsExcluded?.includes(
          item.productId
        );
        const isVariantExcluded = restrictions.itemsExcluded?.includes(
          item.variantId
        );
        return isProductExcluded || isVariantExcluded;
      })
      .map((item) => ({
        id: item.id,
        name: item.productName || item.name,
        variantName: item.variantName || "",
      }));

    const eligibleProducts = cartItems
      .filter((item) => {
        const isProductExcluded = restrictions.itemsExcluded?.includes(
          item.productId
        );
        const isVariantExcluded = restrictions.itemsExcluded?.includes(
          item.variantId
        );
        return !isProductExcluded && !isVariantExcluded;
      })
      .map((item) => ({
        id: item.id,
        name: item.productName || item.name,
        variantName: item.variantName || "",
        price: calculateItemPrice(item),
        quantity: item.quantity,
      }));

    const eligibleSubtotal = eligibleProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let partialDiscount = 0;
    if (config.type === "percentage") {
      partialDiscount = round2((eligibleSubtotal * config.value) / 100);
      if (
        config.maxDiscountAmount &&
        partialDiscount > config.maxDiscountAmount
      ) {
        partialDiscount = config.maxDiscountAmount;
      }
    } else if (config.type === "fixed_amount") {
      partialDiscount = round2(config.value);
      if (partialDiscount > eligibleSubtotal) {
        partialDiscount = eligibleSubtotal;
      }
    }

    console.log(`💰 Descuento parcial calculado: $${partialDiscount}`);
    console.log(`📊 Sobre subtotal elegible: $${eligibleSubtotal}`);

    return {
      isValid: false,
      discount: 0,
      reason: "excluded_items",
      message:
        "Algunos productos no aplican para este descuento. Clickea pedir para ver mas detalle. No se confirmará el pedido sin tu confirmación.",
      discountId,
      discountData,
      partialDiscountDetails: {
        excludedProducts,
        eligibleProducts,
        partialDiscount,
        eligibleSubtotal,
      },
    };
  }
  console.log("\n✅ Todos los items son elegibles");

  // 6. Validar horarios excluidos con timezone awareness
  if (restrictions.timeExcluded && restrictions.timeExcluded.length > 0) {
    console.log("\n⏰ VALIDANDO HORARIOS EXCLUIDOS:");

    try {
      const timezone =
        enterpriseData.timezone || "America/Argentina/Buenos_Aires";
      const nowInTimezone = toZonedTime(new Date(), timezone);

      const currentDay = format(nowInTimezone, "EEEE").toLowerCase(); // "monday", "tuesday", etc.
      const currentTimeMillis = nowInTimezone.getTime();

      console.log(`  Día actual: ${currentDay}`);
      console.log(`  Hora actual: ${format(nowInTimezone, "HH:mm")}`);

      const isTimeExcluded = restrictions.timeExcluded.some((exclusion) => {
        if (exclusion.day !== currentDay) {
          return false;
        }

        console.log(`  Revisando exclusiones para ${exclusion.day}:`);

        return exclusion.hoursRange?.some((range) => {
          // Los timestamps en hoursRange son timestamps absolutos (con fecha)
          // Solo nos interesan las horas, así que comparamos hora del día
          const startDate = new Date(range.start);
          const endDate = new Date(range.end);

          const startHour = startDate.getHours();
          const startMin = startDate.getMinutes();
          const endHour = endDate.getHours();
          const endMin = endDate.getMinutes();

          const currentHour = nowInTimezone.getHours();
          const currentMin = nowInTimezone.getMinutes();

          const currentTotalMin = currentHour * 60 + currentMin;
          const startTotalMin = startHour * 60 + startMin;
          const endTotalMin = endHour * 60 + endMin;

          console.log(
            `    Rango: ${startHour}:${startMin
              .toString()
              .padStart(2, "0")} - ${endHour}:${endMin
              .toString()
              .padStart(2, "0")}`
          );

          const isInRange =
            currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;

          if (isInRange) {
            console.log(`    ❌ Hora actual está en rango excluido`);
          }

          return isInRange;
        });
      });

      if (isTimeExcluded) {
        console.log("\n❌ Código no válido en este horario");
        return {
          isValid: false,
          discount: 0,
          reason: "time_excluded",
          message: getErrorMessage("time_excluded"),
        };
      }

      console.log("\n✅ Horario permitido");
    } catch (timeError) {
      console.error("❌ Error validando horarios:", timeError);
      console.warn("⚠️ Continuando sin validar horarios");
    }
  }

  // 7. Verificar usos máximos
  console.log("\n🎯 VALIDANDO USOS MÁXIMOS:");
  const currentUses = discountData.usage?.usageTracking?.length || 0;
  const maxUses = discountData.usage?.maxUses;

  console.log(`  Usos actuales: ${currentUses}`);
  console.log(`  Usos máximos: ${maxUses || "Sin límite"}`);

  if (maxUses && currentUses >= maxUses) {
    console.log("  ❌ Límite de usos alcanzado");
    return {
      isValid: false,
      discount: 0,
      reason: "max_uses",
      message: getErrorMessage("max_uses"),
    };
  }
  console.log("  ✅ Usos disponibles");

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
    const itemPrice = calculateItemPrice(item);
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
const getErrorMessage = (reason, details = "") => {
  const messages = {
    too_short: "Código inválido (mínimo 3 caracteres)",
    not_found: "Código inválido. Verificá que esté bien escrito",
    inactive: "Este código no está activo",
    not_started: details ? `Código invalido. ${details}` : "Código invalido",
    expired: details
      ? `Código inválido. Este código expiró. ${details}`
      : "Este código expiró",
    min_amount:
      details || "Código inválido. No alcanzas el monto mínimo para usar.",
    delivery_excluded: "Código inválido para este método de entrega",
    payment_excluded: "Código inválido para este método de pago",
    excluded_items:
      "Algunos productos de tu carrito no aplican para este descuento. Clickea pedir para ver mas detalle. No se confirmará el pedido sin tu confirmación.",
    time_excluded: "Código inválido en este horario",
    max_uses: "Código inválido. Limite de usos alcanzado",
    error: details
      ? `Error: ${details}`
      : "Error al validar código. Intenta nuevamente",
  };

  return messages[reason] || "Código inválido";
};
