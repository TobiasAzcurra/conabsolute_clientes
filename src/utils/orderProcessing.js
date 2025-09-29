// utils/orderProcessing.js - Con descuentos desde Firebase
import { db } from "../firebase/config";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { StockManager } from "./stockManager";

const round2 = (n) => Math.round(n * 100) / 100;

export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getProductData = async (enterpriseData, productId) => {
  try {
    const productRef = doc(
      db,
      "absoluteClientes",
      enterpriseData.id,
      "sucursales",
      enterpriseData.selectedSucursal.id,
      "productos",
      productId
    );

    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      console.error(`❌ Producto ${productId} no existe en Firebase`);
      return null;
    }

    const productData = { id: productId, ...productDoc.data() };
    console.log(
      `✅ Producto obtenido: ${productData.name}, infiniteStock: ${productData.infiniteStock}`
    );

    return productData;
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return null;
  }
};

export const consumeStockForOrderAndReturnTraces = async (
  cartItems,
  enterpriseData
) => {
  const stockManager = new StockManager(enterpriseData);
  const results = [];

  console.log(`📦 Procesando ${cartItems.length} items del carrito...`);

  for (const item of cartItems) {
    try {
      console.log(
        `🔍 Procesando item: ${item.productName} (ID: ${item.productId})`
      );

      const productData = await getProductData(enterpriseData, item.productId);
      if (!productData) {
        throw new Error(`Producto ${item.productId} no encontrado`);
      }

      let variant = null;
      if (item.variantId && item.variantId !== "default") {
        variant = productData.variants?.find((v) => v.id === item.variantId);
        if (!variant) {
          console.warn(
            `⚠️ Variante ${item.variantId} no encontrada, usando default`
          );
          variant = productData.variants?.find((v) => v.default === true);
        }
      } else {
        variant = productData.variants?.find((v) => v.default === true);
      }

      if (productData.infiniteStock === true) {
        console.log(
          `♾️ Producto con stock infinito detectado: ${productData.name}`
        );
      }

      const saleResult = await stockManager.simulateVenta(
        productData,
        variant,
        item.quantity
      );

      results.push({
        itemId: item.id,
        purchaseTrace: saleResult.purchaseTrace || [],
        unitCostAvg: saleResult.unitCostAvg || 0,
        totalStockBefore: saleResult.totalStockBefore || 0,
        totalStockAfter: saleResult.totalStockAfter || 0,
      });

      console.log(`✅ Item procesado exitosamente: ${item.productName}`);
    } catch (error) {
      console.error(`❌ Error procesando item ${item.id}:`, error);
      throw error;
    }
  }

  return results;
};

export const computeItemFinancials = (item, unitCostAvg) => {
  const unitPrice = (item.basePrice || 0) + (item.variantPrice || 0);
  const quantity = item.quantity || 0;

  const unitCost = round2(unitCostAvg || 0);
  const totalCost = round2(unitCost * quantity);
  const unitMargin = round2(unitPrice - unitCost);
  const totalMargin = round2(unitMargin * quantity);
  const totalPrice = round2(unitPrice * quantity);

  return { unitCost, totalCost, unitMargin, totalMargin, totalPrice };
};

// Registrar uso del código de descuento en Firebase
const registerDiscountUsage = async (discountId, orderId, enterpriseData) => {
  try {
    const discountRef = doc(
      db,
      "absoluteClientes",
      enterpriseData.id,
      "sucursales",
      enterpriseData.selectedSucursal.id,
      "discountCodes",
      discountId
    );

    await updateDoc(discountRef, {
      [`usage.usageTracking.${orderId}`]: new Date().toISOString(),
    });

    console.log(`✅ Uso de descuento registrado para orden ${orderId}`);
  } catch (error) {
    console.error("Error registrando uso de descuento:", error);
    // No lanzar error, el pedido ya se creó exitosamente
  }
};

export const handlePOSSubmit = async (
  formData,
  cartItems,
  enterpriseData,
  clientData
) => {
  try {
    console.log("🚀 Procesando pedido con nuevo schema POS");

    const now = new Date().toISOString();
    const orderId = generateUUID();

    // 1. Consumir stock y obtener traces
    console.log("📦 Consumiendo stock...");
    const traces = await consumeStockForOrderAndReturnTraces(
      cartItems,
      enterpriseData
    );

    // 2. Construir items con financeSummary y stockSummary
    const itemsForOrder = cartItems.map((item) => {
      const trace = traces.find((t) => t.itemId === item.id);
      const financials = computeItemFinancials(item, trace?.unitCostAvg || 0);

      return {
        productId: item.productId || "",
        productName: item.productName || item.name || "",
        quantity: item.quantity || 0,
        variantId: item.variantId || "default",
        variantName: item.variantName || "default",

        financeSummary: {
          unitBasePrice: item.basePrice || 0,
          unitVariantPrice: item.variantPrice || 0,
          totalPrice: financials.totalPrice,
          unitCost: financials.unitCost,
          totalCost: financials.totalCost,
          unitMargin: financials.unitMargin,
          totalMargin: financials.totalMargin,
        },

        stockSummary: {
          stockReference: item.stockReference || "",
          totalStockBefore: trace?.totalStockBefore || 0,
          totalStockAfter: trace?.totalStockAfter || 0,
          purchaseTrace: trace?.purchaseTrace || [],
        },
      };
    });

    // 3. Calcular subtotal
    const subtotal = round2(
      itemsForOrder.reduce(
        (sum, item) => sum + (item.financeSummary?.totalPrice || 0),
        0
      )
    );

    // 4. Procesar descuento desde appliedDiscount (validado previamente)
    let descuento = 0;
    let discountArray = [];
    let discountMetadata = null; // NUEVO: para metadata adicional

    if (formData.appliedDiscount && formData.appliedDiscount.isValid) {
      descuento = round2(formData.appliedDiscount.discount);

      // Array con schema correcto
      discountArray.push({
        type: "coupon",
        reason: formData.appliedDiscount.discountData.code,
        value: descuento,
        timestamp: now,
      });

      // Metadata adicional (fuera del array)
      discountMetadata = {
        discountId: formData.appliedDiscount.discountId,
        code: formData.appliedDiscount.discountData.code,
      };

      console.log("🎫 Descuento aplicado:", {
        code: formData.appliedDiscount.discountData.code,
        value: descuento,
      });
    }

    // 5. Calcular envío
    const shippingCost =
      formData.deliveryMethod === "delivery"
        ? round2(parseFloat(formData.shipping) || 0)
        : 0;

    const envioExpress = round2(parseFloat(formData.envioExpress) || 0);

    // 6. Totales finales
    const totalAfterDiscounts = round2(subtotal - descuento);
    const total = round2(totalAfterDiscounts + shippingCost + envioExpress);

    const totalCosts = round2(
      itemsForOrder.reduce(
        (sum, item) => sum + (item.financeSummary?.totalCost || 0),
        0
      )
    );
    const grossMargin = round2(totalAfterDiscounts - totalCosts);
    const finalProfitMarginPercentage =
      totalAfterDiscounts > 0 ? round2(grossMargin / totalAfterDiscounts) : 0;

    // 7. Construir orderData con schema POS
    const orderData = {
      status: "Confirmed",
      statusNote: "",
      orderNotes: formData.references || formData.orderNotes || "",

      from: {
        feature: "webapp",
        employeeUser: "",
      },

      timestamps: {
        createdAt: now,
        updatedAt: now,
        pendingAt: null,
        confirmedAt: now,
        readyAt: null,
        deliveredAt: null,
        clientAt: null,
        canceledAt: null,
      },

      customer: {
        phone: formData.phone || "",
      },

      fulfillment: {
        method: formData.deliveryMethod || "delivery",
        assignedTo: "",
        address: formData.address || clientData?.address || "",
        coordinates: formData.coordinates || [0, 0],
        estimatedTime: formData.hora || null,
        deliveryNotes: formData.deliveryNotes || "",
      },

      items: itemsForOrder,

      payment: {
        method: formData.paymentMethod || "cash",
        status: "pending",

        financeSummary: {
          subtotal: subtotal,
          shipping: shippingCost + envioExpress,
          totalDiscounts: descuento,
          total: total,
          totalCosts: totalCosts,
          GrossMargin: grossMargin,
          taxes: "",
          finalProfitMarginPercentage: finalProfitMarginPercentage,
        },

        discounts: discountArray,
      },
    };

    // 8. Guardar en Firebase
    const pedidoRef = doc(
      db,
      "absoluteClientes",
      enterpriseData.id,
      "sucursales",
      enterpriseData.selectedSucursal.id,
      "pedidos",
      orderId
    );

    await setDoc(pedidoRef, orderData);

    console.log("✅ Pedido guardado con schema POS:");
    console.log("📊 Items con trazabilidad:", itemsForOrder.length);
    console.log("💰 Margen total:", grossMargin);
    console.log(
      "📈 % Margen:",
      (finalProfitMarginPercentage * 100).toFixed(1) + "%"
    );

    if (descuento > 0) {
      console.log("🎫 Descuento aplicado:", descuento);
    }

    // 9. Registrar uso del código de descuento
    if (formData.appliedDiscount?.discountId) {
      await registerDiscountUsage(
        formData.appliedDiscount.discountId,
        orderId,
        enterpriseData
      );
    }

    return orderId;
  } catch (error) {
    console.error("❌ Error en handlePOSSubmit:", error);
    throw error;
  }
};

export const adaptCartToPOSFormat = (contextCartItems) => {
  return Object.values(contextCartItems).map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName || item.name,
    quantity: item.quantity,
    variantId: item.variantId || "default",
    variantName: item.variantName || "default",
    basePrice: item.basePrice || item.price || 0,
    variantPrice: item.variantPrice || 0,
    finalPrice: item.finalPrice || item.price || 0,
    category: item.category,
    isInfiniteStock: item.isInfiniteStock || false,
    stockReference: item.stockReference || "",
    availableStock: item.availableStock || 0,
  }));
};
