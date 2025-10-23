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

  cleanStockReference(stockReference) {
    if (!stockReference) return null;
    const segments = stockReference.split("/");
    return segments[segments.length - 1];
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
    currentRemainingStock,
    purchaseTrace = []
  ) {
    const cleanedStockReference = this.cleanStockReference(stockReference);
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      cleanedStockReference
    );
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      console.warn(`Stock no encontrado para ${cleanedStockReference}`);
      return 0;
    }
    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];
    let totalStock = 0;
    compras.forEach((compra) => {
      let stockToAdd;
      const trace = purchaseTrace.find((t) => t.compraId === compra.compraId);
      if (trace) {
        stockToAdd = trace.remainingAfter;
      } else if (
        currentPurchaseId &&
        compra.compraId === currentPurchaseId &&
        currentRemainingStock !== undefined
      ) {
        stockToAdd = currentRemainingStock;
      } else {
        stockToAdd = compra.stockRestante || 0;
      }
      totalStock += stockToAdd;
      console.log(
        `Compra ${compra.compraId}: stockRestante=${
          compra.stockRestante
        }, stockToAdd=${stockToAdd}, trace=${JSON.stringify(trace)}`
      );
    });
    console.log(
      `Total stock calculado para ${cleanedStockReference}: ${totalStock}`
    );
    return totalStock;
  }

  async findNextAvailablePurchase(stockReference) {
    const cleanedStockReference = this.cleanStockReference(stockReference);
    const stockRef = doc(
      db,
      "absoluteClientes",
      this.enterpriseData.id,
      "sucursales",
      this.enterpriseData.selectedSucursal.id,
      "stock",
      cleanedStockReference
    );
    const stockDoc = await getDoc(stockRef);
    if (!stockDoc.exists()) {
      return null;
    }
    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];
    return compras.find((compra) => compra.stockRestante > 0) || null;
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
            throw new Error(
              `PRODUCT_DELETED: Producto ${item.productId} no encontrado`
            );
          }
          const productData = productDoc.data();
          const variant = productData.variants?.find(
            (v) => v.id === item.variantId
          );
          if (!variant) {
            throw new Error(
              `VARIANT_NOT_FOUND: Variante ${item.variantId} no encontrada`
            );
          }
          const cleanedStockReference = this.cleanStockReference(
            variant.stockReference
          );
          if (!cleanedStockReference) {
            throw new Error(
              `MISSING_STOCK_REFERENCE: Producto ${item.productId} sin referencia de stock válida`
            );
          }
          const stockRef = doc(
            db,
            "absoluteClientes",
            this.enterpriseData.id,
            "sucursales",
            this.enterpriseData.selectedSucursal.id,
            "stock",
            cleanedStockReference
          );
          const stockDoc = await getDoc(stockRef);
          const totalStock = stockDoc.exists()
            ? (stockDoc.data().compras || []).reduce(
                (sum, compra) => sum + (compra.stockRestante || 0),
                0
              )
            : 0;
          return {
            ...item,
            stockVersion: variant.stockSummary?.version || 0,
            availableStock: totalStock,
            stockReference: cleanedStockReference,
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
    orderId,
    stockReference
  ) {
    const cleanedStockReference = this.cleanStockReference(stockReference);
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
      cleanedStockReference
    );
    return await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error("PRODUCT_DELETED");
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
        throw new Error("VARIANT_NOT_FOUND");
      }
      const stockSummary = variants[variantIndex].stockSummary || {};
      const currentVersion = stockSummary.version || 0;
      const currentPurchase = stockSummary.currentPurchase || {};
      console.log(
        `Versión en carrito: ${selectedVariant.stockVersion}, Versión en Firestore: ${currentVersion}`
      );
      if (currentVersion !== selectedVariant.stockVersion) {
        throw new Error("STOCK_VERSION_MISMATCH");
      }
      // Validar stock real desde stockRef
      const realTotalStock = (stockData.compras || []).reduce(
        (sum, compra) => sum + (compra.stockRestante || 0),
        0
      );
      console.log(
        `Stock real en stockRef: ${realTotalStock}, cantidad solicitada: ${cantidad}`
      );
      if (realTotalStock < cantidad) {
        throw new Error(
          `INSUFFICIENT_STOCK: Stock disponible (${realTotalStock}) es menor a la cantidad solicitada (${cantidad})`
        );
      }
      let unitsToConsume = cantidad;
      let purchaseTrace = [];
      let needsReplenishment = false;
      let compraIdToUpdate = currentPurchase.compraID;
      let ventasIdToUpdate = [...(currentPurchase.ventasId || []), orderId];
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
          throw new Error(
            `INSUFFICIENT_STOCK_IN_NEXT_PURCHASE: Stock disponible (${nextPurchase.stockRestante}) es menor a la cantidad solicitada (${unitsToConsume})`
          );
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
      const newTotalStock = await this.calculateTotalStockFromSource(
        cleanedStockReference,
        currentPurchase.compraID,
        remainingStock,
        purchaseTrace
      );
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
              ventasId: nextPurchase ? [orderId] : ventasIdToUpdate,
            }
          : {
              compraID: currentPurchase.compraID,
              remainingStock: remainingStock,
              unitCost: currentPurchase.unitCost,
              ventasId: ventasIdToUpdate,
            },
        totalStock: newTotalStock,
        lastUpdated: createClientTimestamp(),
      };
      return {
        purchaseTrace,
        unitCostAvg,
        needsReplenishment,
        compraIdToUpdate: currentPurchase.compraID,
        ventasIdToUpdate,
        unitsFromCurrent,
        unitsFromNext,
        nextPurchaseId: nextPurchase ? nextPurchase.compraId : null,
        productRef,
        stockRef,
        variants,
        variantIndex,
        newStockSummary,
      };
    });
  }

  async simulateVenta(
    producto,
    selectedVariant = null,
    cantidad = 1,
    orderId,
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
        const stockReference = this.cleanStockReference(
          selectedVariant.stockReference
        );
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
        if (!productDoc.exists()) throw new Error("PRODUCT_DELETED");
        const productData = productDoc.data();
        const variant = productData.variants.find(
          (v) => v.id === selectedVariant.id
        );
        if (!variant) throw new Error("VARIANT_NOT_FOUND");
        selectedVariant.stockVersion = variant.stockSummary.version;
        const result = await this.processMultiPurchaseSaleWithTransaction(
          producto,
          selectedVariant,
          cantidad,
          orderId,
          stockReference
        );
        return {
          ...result,
          totalStockBefore: variant.stockSummary.totalStock || 0,
          totalStockAfter: result.newStockSummary.totalStock,
          orderId,
        };
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

  async applyStockUpdates(updates) {
    await runTransaction(db, async (transaction) => {
      const stockDocs = new Map();
      for (const update of updates) {
        const { stockRef } = update;
        if (!stockDocs.has(stockRef.path)) {
          const stockDoc = await transaction.get(stockRef);
          stockDocs.set(stockRef.path, stockDoc);
        }
      }

      for (const update of updates) {
        const {
          productRef,
          stockRef,
          variants,
          variantIndex,
          newStockSummary,
          needsReplenishment,
          compraIdToUpdate,
          ventasIdToUpdate,
          unitsFromCurrent,
          unitsFromNext,
          nextPurchaseId,
          orderId,
          purchaseTrace,
        } = update;

        const stockDoc = stockDocs.get(stockRef.path);
        if (!stockDoc.exists()) throw new Error("Stock no encontrado");
        const stockData = stockDoc.data();
        const compras = stockData.compras || [];

        if (needsReplenishment) {
          console.log(
            `Compra actual agotada, actualizando stock para ${compraIdToUpdate}`
          );
          const compraIndex = compras.findIndex(
            (c) => c.compraId === compraIdToUpdate
          );
          if (compraIndex === -1) throw new Error("Compra no encontrada");
          compras[compraIndex].stockRestante = 0;
          compras[compraIndex].ventasId = ventasIdToUpdate;
          if (unitsFromNext > 0 && nextPurchaseId) {
            console.log(
              `Actualizando stock para siguiente compra ${nextPurchaseId}`
            );
            const nextCompraIndex = compras.findIndex(
              (c) => c.compraId === nextPurchaseId
            );
            if (nextCompraIndex === -1)
              throw new Error("Siguiente compra no encontrada");
            compras[nextCompraIndex].stockRestante -= unitsFromNext;
            compras[nextCompraIndex].ventasId = [
              ...(compras[nextCompraIndex].ventasId || []),
              orderId,
            ];
          }
          transaction.update(stockRef, {
            compras,
            lastUpdated: createServerTimestamp(),
          });
        } else if (
          unitsFromCurrent > 0 &&
          update.purchaseTrace[0].remainingAfter === 0
        ) {
          console.log(
            `Compra actual agotada (remainingStock = 0), actualizando stock para ${compraIdToUpdate}`
          );
          const compraIndex = compras.findIndex(
            (c) => c.compraId === compraIdToUpdate
          );
          if (compraIndex === -1) throw new Error("Compra no encontrada");
          compras[compraIndex].stockRestante = 0;
          compras[compraIndex].ventasId = ventasIdToUpdate;
          transaction.update(stockRef, {
            compras,
            lastUpdated: createServerTimestamp(),
          });
        } else {
          console.log(
            `No se actualiza stock: compra ${compraIdToUpdate} aún tiene stock restante (${update.purchaseTrace[0].remainingAfter})`
          );
        }

        const finalTotalStock = await this.calculateTotalStockFromSource(
          stockRef.path,
          compraIdToUpdate,
          update.purchaseTrace[0].remainingAfter,
          purchaseTrace
        );
        console.log(
          `Total stock final para ${stockRef.path}: ${finalTotalStock}`
        );
        variants[variantIndex].stockSummary = {
          ...newStockSummary,
          totalStock: finalTotalStock,
        };
        transaction.update(productRef, { variants });
      }
    });
  }
}
