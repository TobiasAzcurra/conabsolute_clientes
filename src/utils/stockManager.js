import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  runTransaction,
} from "firebase/firestore";
import {
  createServerTimestamp,
  createClientTimestamp,
} from "./timestampHelpers";

export class StockManager {
  constructor(enterpriseData) {
    this.enterpriseData = enterpriseData;
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  round2(n) {
    return Math.round(n * 100) / 100;
  }

  handleInfiniteStockSale(producto, selectedVariant = null, cantidad = 1) {
    console.log(`Procesando venta de stock infinito: ${cantidad} unidades`);
    const timestamp = Date.now();
    const infiniteValue = Number.MAX_SAFE_INTEGER;
    const variant =
      selectedVariant || producto.variants?.find((v) => v.default);
    const unitCost = variant?.stockSummary?.currentPurchase?.unitCost || 0;
    console.log(`Costo unitario para stock infinito: $${unitCost}`);
    const purchaseTrace = [
      {
        compraId: `infinite-stock-${timestamp}`,
        units: cantidad,
        unitCost: unitCost,
        remainingBefore: infiniteValue,
        remainingAfter: infiniteValue,
      },
    ];
    return {
      purchaseTrace,
      unitCostAvg: unitCost,
      finalRemainingStock: infiniteValue,
      totalStockAfter: infiniteValue,
      totalStockBefore: infiniteValue,
    };
  }

  async calculateTotalStockFromSource(
    stockReference,
    currentPurchaseId,
    currentRemainingStock
  ) {
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      stockReference
    );
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      return 0;
    }
    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];
    let totalStock = 0;
    compras.forEach((compra) => {
      if (currentPurchaseId && compra.compraId === currentPurchaseId) {
        if (currentRemainingStock !== undefined) {
          totalStock += currentRemainingStock;
        } else {
          totalStock += compra.stockRestante || 0;
        }
      } else {
        totalStock += compra.stockRestante || 0;
      }
    });
    return totalStock;
  }

  async findNextAvailablePurchase(stockReference) {
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      stockReference
    );
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      return null;
    }
    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];
    return compras.find((compra) => compra.stockRestante > 0) || null;
  }

  async updateStockRealReducir(stockReference, compraId, cantidad, ventaId) {
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      stockReference
    );
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      throw new Error("Documento de stock no encontrado");
    }
    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];
    const compraIndex = compras.findIndex((c) => c.compraId === compraId);
    if (compraIndex === -1) {
      throw new Error("Compra no encontrada");
    }
    compras[compraIndex].stockRestante -= cantidad;
    compras[compraIndex].ventasId = [
      ...(compras[compraIndex].ventasId || []),
      ventaId,
    ];
    await updateDoc(stockRef, {
      compras,
      lastUpdated: createServerTimestamp(),
    });
    console.log(
      `Stock actualizado: compra ${compraId}, stockRestante: ${compras[compraIndex].stockRestante}, ventaId: ${ventaId}`
    );
  }

  async updateStockRealAgotarCompra(stockReference, compraId, ventasId) {
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      stockReference
    );
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      throw new Error("Documento de stock no encontrado");
    }
    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];
    const compraIndex = compras.findIndex((c) => c.compraId === compraId);
    if (compraIndex === -1) {
      throw new Error("Compra no encontrada");
    }
    compras[compraIndex].stockRestante = 0;
    compras[compraIndex].ventasId = ventasId;
    await updateDoc(stockRef, {
      compras,
      lastUpdated: createServerTimestamp(),
    });
    console.log(`Compra ${compraId} agotada, ventasId: ${ventasId}`);
  }

  async updateCartStockVersions(cartItems) {
    try {
      const updatedItems = await Promise.all(
        cartItems.map(async (item) => {
          const productRef = doc(
            db,
            "absoluteClientes",
            this.enterpriseData.id,
            "sucursales",
            this.enterpriseData.selectedSucursal.id,
            "productos",
            item.productId
          );
          const productDoc = await getDoc(productRef);
          if (!productDoc.exists()) {
            throw new Error(`Producto ${item.productId} no encontrado`);
          }
          const productData = productDoc.data();
          const variant = productData.variants?.find(
            (v) => v.id === item.variantId
          );
          if (!variant) {
            throw new Error(`Variante ${item.variantId} no encontrada`);
          }
          return {
            ...item,
            stockVersion: variant.stockSummary?.version || 0,
            availableStock: variant.stockSummary?.totalStock || 0,
          };
        })
      );
      console.log("Versiones de stock actualizadas exitosamente");
      return updatedItems;
    } catch (error) {
      console.error("Error actualizando versiones de stock:", error);
      throw error;
    }
  }

  async processMultiPurchaseSaleWithTransaction(
    producto,
    selectedVariant,
    cantidad,
    ventaId,
    stockReference
  ) {
    const productRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "productos",
      producto.id
    );
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      stockReference
    );
    return await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error("Producto no encontrado");
      }
      const stockDoc = await transaction.get(stockRef);
      if (!stockDoc.exists()) {
        throw new Error("Stock no encontrado");
      }
      const productData = productDoc.data();
      const stockData = stockDoc.data();
      const variants = productData.variants || [];
      const variantIndex = variants.findIndex(
        (v) => v.id === selectedVariant.id
      );
      if (variantIndex === -1) {
        throw new Error("Variante no encontrada");
      }
      const stockSummary = variants[variantIndex].stockSummary || {};
      const currentVersion = stockSummary.version || 0;
      const currentPurchase = stockSummary.currentPurchase || {};
      const totalStock = stockSummary.totalStock || 0;
      console.log(
        `Versión en carrito: ${selectedVariant.stockVersion}, Versión en Firestore: ${currentVersion}`
      );
      if (currentVersion !== selectedVariant.stockVersion) {
        throw new Error("STOCK_VERSION_MISMATCH");
      }
      if (totalStock < cantidad) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      let unitsToConsume = cantidad;
      let purchaseTrace = [];
      let needsReplenishment = false;
      let compraIdToUpdate = currentPurchase.compraID;
      let ventasIdToUpdate = [...(currentPurchase.ventasId || []), ventaId];
      let remainingStock = currentPurchase.remainingStock || 0;
      let unitsFromCurrent = 0;
      let unitsFromNext = 0;
      let nextPurchase = null;
      if (remainingStock >= unitsToConsume) {
        unitsFromCurrent = unitsToConsume;
        remainingStock -= unitsToConsume;
        unitsToConsume = 0;
      } else {
        unitsFromCurrent = remainingStock;
        unitsToConsume -= remainingStock;
        remainingStock = 0;
        needsReplenishment = true;
      }
      purchaseTrace.push({
        compraId: currentPurchase.compraID,
        units: unitsFromCurrent,
        unitCost: currentPurchase.unitCost || 0,
        remainingBefore: currentPurchase.remainingStock,
        remainingAfter: remainingStock,
      });
      if (unitsToConsume > 0) {
        nextPurchase = stockData.compras.find(
          (c) => c.compraId !== currentPurchase.compraID && c.stockRestante > 0
        );
        if (!nextPurchase) {
          throw new Error("NO_AVAILABLE_PURCHASE");
        }
        if (nextPurchase.stockRestante < unitsToConsume) {
          throw new Error("INSUFFICIENT_STOCK_IN_NEXT_PURCHASE");
        }
        unitsFromNext = unitsToConsume;
        purchaseTrace.push({
          compraId: nextPurchase.compraId,
          units: unitsFromNext,
          unitCost: nextPurchase.unitCost || 0,
          remainingBefore: nextPurchase.stockRestante,
          remainingAfter: nextPurchase.stockRestante - unitsFromNext,
        });
      }
      console.log(
        `Consumidas ${unitsFromCurrent} unidades de compra ${currentPurchase.compraID}`
      );
      if (unitsFromNext > 0)
        console.log(
          `Consumidas ${unitsFromNext} unidades de compra ${nextPurchase.compraId}`
        );
      const totalCost = purchaseTrace.reduce(
        (sum, trace) => sum + trace.units * trace.unitCost,
        0
      );
      const unitCostAvg = totalCost / cantidad;
      const newStockSummary = {
        version: currentVersion + 1,
        currentPurchase: needsReplenishment
          ? {
              compraID: nextPurchase
                ? nextPurchase.compraId
                : currentPurchase.compraID,
              remainingStock: nextPurchase
                ? nextPurchase.stockRestante - unitsFromNext
                : 0,
              unitCost: nextPurchase
                ? nextPurchase.unitCost
                : currentPurchase.unitCost,
              ventasId: nextPurchase ? [ventaId] : ventasIdToUpdate,
            }
          : {
              compraID: currentPurchase.compraID,
              remainingStock: remainingStock,
              unitCost: currentPurchase.unitCost,
              ventasId: ventasIdToUpdate,
            },
        totalStock: totalStock - cantidad,
        lastUpdated: createClientTimestamp(),
      };
      variants[variantIndex].stockSummary = newStockSummary;
      transaction.update(productRef, { variants });
      console.log(`Traza generada:`, purchaseTrace);
      console.log(`Nuevo stockSummary:`, newStockSummary);
      return {
        purchaseTrace,
        unitCostAvg,
        needsReplenishment,
        compraIdToUpdate: currentPurchase.compraID,
        ventasIdToUpdate,
        unitsFromCurrent,
        unitsFromNext,
        nextPurchaseId: nextPurchase ? nextPurchase.compraId : null,
      };
    });
  }

  async simulateVenta(
    producto,
    selectedVariant = null,
    cantidad = 1,
    maxRetries = 3
  ) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        console.log(
          `Simulando venta de ${cantidad} unidades - ${
            producto.name
          } (Intento ${retries + 1})`
        );
        if (producto.infiniteStock === true) {
          return this.handleInfiniteStockSale(
            producto,
            selectedVariant,
            cantidad
          );
        }
        const ventaId = this.generateUUID();
        const stockReference = selectedVariant.stockReference;
        if (!stockReference) {
          throw new Error(
            "MISSING_STOCK_REFERENCE: Producto sin referencia de stock"
          );
        }
        const productRef = doc(
          db,
          "absoluteClientes",
          this.enterpriseData.id,
          "sucursales",
          this.enterpriseData.selectedSucursal.id,
          "productos",
          producto.id
        );
        const productDoc = await getDoc(productRef);
        if (!productDoc.exists()) throw new Error("Producto no encontrado");
        const productData = productDoc.data();
        const variant = productData.variants.find(
          (v) => v.id === selectedVariant.id
        );
        if (!variant) throw new Error("Variante no encontrada");
        selectedVariant.stockVersion = variant.stockSummary.version;
        const result = await this.processMultiPurchaseSaleWithTransaction(
          producto,
          selectedVariant,
          cantidad,
          ventaId,
          stockReference
        );
        // Actualizar stock solo si la compra actual se agota o se usa una compra siguiente
        if (result.needsReplenishment) {
          console.log(
            `Compra actual agotada, actualizando stock para ${result.compraIdToUpdate}`
          );
          await this.updateStockRealAgotarCompra(
            stockReference,
            result.compraIdToUpdate,
            result.ventasIdToUpdate
          );
          if (result.unitsFromNext > 0 && result.nextPurchaseId) {
            console.log(
              `Actualizando stock para siguiente compra ${result.nextPurchaseId}`
            );
            await this.updateStockRealReducir(
              stockReference,
              result.nextPurchaseId,
              result.unitsFromNext,
              ventaId
            );
          }
        } else if (
          result.unitsFromCurrent > 0 &&
          result.unitsFromCurrent === result.purchaseTrace[0].remainingBefore
        ) {
          // Actualizar stock si la compra actual se agota completamente
          console.log(
            `Compra actual agotada (remainingStock = 0), actualizando stock para ${result.compraIdToUpdate}`
          );
          await this.updateStockRealAgotarCompra(
            stockReference,
            result.compraIdToUpdate,
            result.ventasIdToUpdate
          );
        } else {
          console.log(
            `No se actualiza stock: compra ${result.compraIdToUpdate} aún tiene stock restante`
          );
        }
        return result;
      } catch (error) {
        if (
          error.message === "STOCK_VERSION_MISMATCH" &&
          retries < maxRetries - 1
        ) {
          console.warn(
            `STOCK_VERSION_MISMATCH detectado, reintentando (${
              retries + 1
            }/${maxRetries})`
          );
          retries++;
          continue;
        }
        console.error("Error al simular venta:", error);
        throw error;
      }
    }
    throw new Error("Max retries reached for STOCK_VERSION_MISMATCH");
  }
}
