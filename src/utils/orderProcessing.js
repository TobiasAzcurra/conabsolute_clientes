import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  runTransaction,
} from "firebase/firestore";
import { StockManager } from "./stockManager";
import {
  createServerTimestamp,
  createDelayedTimestamp,
} from "./timestampHelpers";

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
      throw new Error("PRODUCT_DELETED");
    }
    const productData = { id: productId, ...productDoc.data() };
    console.log(
      `Producto obtenido: ${productData.name}, infiniteStock: ${productData.infiniteStock}`
    );
    return productData;
  } catch (error) {
    console.error("Error al obtener producto:", error);
    throw error;
  }
};

export const consumeStockForOrderAndReturnTraces = async (
  cartItems,
  enterpriseData,
  orderId
) => {
  const stockManager = new StockManager(enterpriseData);
  const results = [];
  const errorList = [];
  const stockUpdates = [];

  console.log(
    `Procesando ${cartItems.length} items del carrito para orderId: ${orderId}...`
  );

  for (const item of cartItems) {
    let productData = null;
    let variant = null;
    let availableStock = 0;

    try {
      console.log(
        `Procesando item: ${item.productName} (ID: ${item.productId}, quantity: ${item.quantity})`
      );
      productData = await getProductData(enterpriseData, item.productId);
      if (!productData) {
        throw new Error("PRODUCT_DELETED");
      }

      if (item.variantId && item.variantId !== "default") {
        variant = productData.variants?.find((v) => v.id === item.variantId);
        if (!variant) {
          console.warn(
            `Variante ${item.variantId} no encontrada, usando default`
          );
          variant = productData.variants?.find((v) => v.default === true);
          if (!variant) throw new Error("VARIANT_NOT_FOUND");
        }
      } else {
        variant = productData.variants?.find((v) => v.default === true);
        if (!variant) throw new Error("VARIANT_NOT_FOUND");
      }

      // Capturar stock disponible ANTES de simular la venta
      availableStock =
        variant.stockSummary?.currentPurchase?.remainingStock ||
        variant.stockSummary?.totalStock ||
        0;

      if (productData.infiniteStock === true) {
        console.log(
          `Producto con stock infinito detectado: ${productData.name}`
        );
      }

      const variantWithCapturedVersion = {
        ...variant,
        stockVersion: item.stockVersion || 0,
        stockReference: item.stockReference || "",
      };

      console.log(
        `Versión capturada en carrito: ${item.stockVersion}, stockReference: ${item.stockReference}`
      );

      const saleResult = await stockManager.simulateVenta(
        productData,
        variantWithCapturedVersion,
        item.quantity,
        orderId
      );

      results.push({
        itemId: item.id,
        purchaseTrace: saleResult.purchaseTrace || [],
        unitCostAvg: saleResult.unitCostAvg || 0,
        totalStockBefore: saleResult.totalStockBefore || 0,
        totalStockAfter: saleResult.totalStockAfter || 0,
      });

      stockUpdates.push({
        ...saleResult,
        variantId: item.variantId,
        orderId,
      });

      console.log(`Item procesado exitosamente: ${item.productName}`);
    } catch (error) {
      console.error(`Error procesando item ${item.id}:`, error);
      let errorType = "GENERIC";
      let message = `Error al procesar ${item.productName || item.name}: ${
        error.message
      }`;

      if (error.message.includes("STOCK_VERSION_MISMATCH")) {
        errorType = "RACE_CONDITION";
        message = `Alguien compró antes que tú el ${
          item.productName || item.name
        }.`;
      } else if (error.message.includes("NO_AVAILABLE_PURCHASE")) {
        errorType = "ADJUSTABLE_STOCK";
        message = `Pediste ${item.quantity} unidades pero solo hay ${availableStock} disponibles.`;
      } else if (error.message.includes("INSUFFICIENT_STOCK")) {
        errorType = "INSUFFICIENT_STOCK";
        const match = error.message.match(/Stock disponible \((\d+)\)/);
        message = `No hay suficiente stock para ${
          item.productName || item.name
        }. Stock disponible: ${match ? match[1] : "desconocido"}.`;
      } else if (error.message.includes("PRODUCT_DELETED")) {
        errorType = "PRODUCT_DELETED";
        message = `El producto ${
          item.productName || item.name
        } ya no está disponible.`;
      } else if (error.message.includes("VARIANT_NOT_FOUND")) {
        errorType = "VARIANT_NOT_FOUND";
        message = `La variante ${
          item.variantName || "desconocida"
        } del producto ${item.productName || item.name} no está disponible.`;
      } else if (error.message.includes("MISSING_STOCK_REFERENCE")) {
        errorType = "MISSING_STOCK_REFERENCE";
        message = `El producto ${
          item.productName || item.name
        } no tiene referencia de stock.`;
      } else if (error.message.includes("Invalid document reference")) {
        errorType = "INVALID_STOCK_REFERENCE";
        message = `Referencia de stock inválida para ${
          item.productName || item.name
        }. Verifica los datos del producto.`;
      }

      errorList.push({
        itemId: item.id,
        productName: item.productName || item.name,
        variantName: item.variantName || "",
        errorType,
        message,
        availableStock: availableStock, // ✅ Agregamos el stock disponible
      });
    }
  }

  return { results, errorList, stockUpdates };
};

const extractModifierOptions = (item) => {
  if (!item.modifierSelections || !item.variants?.[0]?.modifierGroups) {
    return [];
  }

  const variant = item.variants[0];
  const allOptions = [];

  variant.modifierGroups.forEach((group) => {
    const selectedOptionIds = item.modifierSelections[group.id] || [];
    selectedOptionIds.forEach((optionId) => {
      const option = group.options.find((opt) => opt.id === optionId);
      if (option) {
        allOptions.push({
          id: option.id,
          name: option.name,
          price: option.price,
        });
      }
    });
  });

  return allOptions;
};

export const computeItemFinancials = (item, unitCostAvg) => {
  const unitPrice =
    (item.basePrice || 0) +
    (item.variantPrice || 0) +
    (item.modifiersPrice || 0);
  const quantity = item.quantity || 0;
  const unitCost = round2(unitCostAvg || 0);
  const totalCost = round2(unitCost * quantity);
  const unitMargin = round2(unitPrice - unitCost);
  const totalMargin = round2(unitMargin * quantity);
  const totalPrice = round2(unitPrice * quantity);
  return { unitCost, totalCost, unitMargin, totalMargin, totalPrice };
};

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
      "usage.usageTracking": arrayUnion(orderId),
    });
    console.log(`Uso de descuento registrado para orden ${orderId}`);
  } catch (error) {
    console.error("Error registrando uso de descuento:", error);
  }
};

export const handlePOSSubmit = async (
  formData,
  cartItems,
  enterpriseData,
  clientData
) => {
  try {
    console.log("Procesando pedido con schema POS");
    const orderId = generateUUID();
    let confirmedAt = createServerTimestamp();
    if (formData.delayMinutes && formData.delayMinutes > 0) {
      confirmedAt = createDelayedTimestamp(formData.delayMinutes);
      console.log(`Pedido confirmado con delay: ${formData.delayMinutes}min`);
    }

    console.log("Consumiendo stock...");
    const { results, errorList, stockUpdates } =
      await consumeStockForOrderAndReturnTraces(
        cartItems,
        enterpriseData,
        orderId
      );

    if (errorList.length > 0) {
      throw { errorList };
    }

    const itemsForOrder = cartItems.map((item) => {
      const trace = results.find((t) => t.itemId === item.id);
      const financials = computeItemFinancials(item, trace?.unitCostAvg || 0);
      return {
        productId: item.productId || "",
        productName: item.productName || item.name || "",
        quantity: item.quantity || 0,
        variantId: item.variantId || "default",
        variantName: item.variantName || "default",
        modifiers: extractModifierOptions(item),
        financeSummary: {
          unitBasePrice: item.basePrice || 0,
          unitVariantPrice: item.variantPrice || 0,
          unitModifiersPrice: item.modifiersPrice || 0,
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

    const subtotal = round2(
      itemsForOrder.reduce(
        (sum, item) => sum + (item.financeSummary?.totalPrice || 0),
        0
      )
    );
    let descuento = 0;
    let discountArray = [];
    if (formData.appliedDiscount && formData.appliedDiscount.isValid) {
      descuento = round2(formData.appliedDiscount.discount);
      discountArray.push({
        type: "coupon",
        reason: formData.appliedDiscount.discountData.code,
        value: descuento,
      });
      console.log("Descuento aplicado:", {
        code: formData.appliedDiscount.discountData.code,
        value: descuento,
      });
    }
    const shippingCost =
      formData.deliveryMethod === "delivery"
        ? round2(parseFloat(formData.shipping) || 0)
        : 0;
    const envioExpress = round2(parseFloat(formData.envioExpress) || 0);
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
    let estimatedTime = null;
    if (formData.estimatedTime) {
      estimatedTime = formData.estimatedTime;
    }

    const orderData = {
      status: "Confirmed",
      statusNote: "",
      orderNotes: formData.aclaraciones || "",
      from: {
        feature: "webapp",
        employeeUser: "",
      },
      timestamps: {
        createdAt: createServerTimestamp(),
        updatedAt: createServerTimestamp(),
        pendingAt: null,
        confirmedAt: confirmedAt,
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
        estimatedTime: estimatedTime,
        deliveryNotes: formData.references || "",
        distance: formData.deliveryDistance || null,
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

    const stockManager = new StockManager(enterpriseData);
    const pedidoRef = doc(
      db,
      "absoluteClientes",
      enterpriseData.id,
      "sucursales",
      enterpriseData.selectedSucursal.id,
      "pedidos",
      orderId
    );

    await runTransaction(db, async (transaction) => {
      // ✅ FILTRAR productos con stock infinito
      const validStockUpdates = stockUpdates.filter(
        (update) => update.productRef && update.stockRef
      );

      console.log(`📦 Total productos: ${stockUpdates.length}`);
      console.log(`📊 Stock normal: ${validStockUpdates.length}`);
      console.log(
        `♾️ Stock infinito: ${stockUpdates.length - validStockUpdates.length}`
      );

      // Aplicar solo updates válidos
      if (validStockUpdates.length > 0) {
        await stockManager.applyStockUpdates(validStockUpdates, transaction);
      }

      // Guardar el pedido
      transaction.set(pedidoRef, orderData);
    });

    if (formData.appliedDiscount?.discountId) {
      await registerDiscountUsage(
        formData.appliedDiscount.discountId,
        orderId,
        enterpriseData
      );
    }

    console.log("Pedido guardado con schema POS:");
    console.log("Items con trazabilidad:", itemsForOrder.length);
    console.log("Margen total:", grossMargin);
    console.log(
      "% Margen:",
      (finalProfitMarginPercentage * 100).toFixed(1) + "%"
    );
    if (descuento > 0) {
      console.log("Descuento aplicado:", descuento);
    }

    return orderId;
  } catch (error) {
    console.error("Error en handlePOSSubmit:", error);
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
    modifiersPrice: item.modifiersPrice || 0,
    finalPrice: item.finalPrice || item.price || 0,
    category: item.category,
    isInfiniteStock: item.isInfiniteStock || false,
    stockReference: item.stockReference
      ? item.stockReference.split("/").pop()
      : "",
    availableStock: item.availableStock || 0,
    stockVersion: item.stockVersion || 0,
    modifierSelections: item.modifierSelections || {},
    variants: item.variants || [],
  }));
};
