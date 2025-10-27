// hooks/useAvailableFulfillmentMethods.js
import { useMemo } from "react";

export const useAvailableFulfillmentMethods = (cartItems) => {
  return useMemo(() => {
    // console.log("🔍 === DEBUGGEANDO RESTRICCIONES ===");
    // console.log("📦 cartItems completo:", cartItems);
    // console.log("📦 Cantidad de items:", Object.keys(cartItems).length);

    const restrictions = {
      delivery: [],
      takeaway: [],
    };

    Object.values(cartItems).forEach((item, index) => {
      // console.log(`\n--- Item ${index + 1} ---`);
      // console.log("Producto:", item.productName || item.name);
      // console.log("restrictions del item:", item.restrictions);

      const excluded = item.restrictions?.fulfillmentMethodsExcluded || [];
      // console.log("fulfillmentMethodsExcluded:", excluded);

      if (excluded.includes("delivery")) {
        // console.log("✅ Este producto EXCLUYE delivery");
        restrictions.delivery.push(item.productName || item.name);
      }
      if (excluded.includes("takeaway")) {
        // console.log("✅ Este producto EXCLUYE takeaway");
        restrictions.takeaway.push(item.productName || item.name);
      }
    });

    // console.log("\n📊 RESULTADO FINAL:");
    // console.log("Productos que bloquean delivery:", restrictions.delivery);
    // console.log("Productos que bloquean takeaway:", restrictions.takeaway);

    const result = {
      delivery: {
        available: restrictions.delivery.length === 0,
        blockedBy: restrictions.delivery,
      },
      takeaway: {
        available: restrictions.takeaway.length === 0,
        blockedBy: restrictions.takeaway,
      },
      hasConflict:
        restrictions.delivery.length > 0 && restrictions.takeaway.length > 0,
    };

    // console.log("🎯 Métodos disponibles:", result);
    // console.log("=================================\n");

    return result;
  }, [cartItems]);
};
