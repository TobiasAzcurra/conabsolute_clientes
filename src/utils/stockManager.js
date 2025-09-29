// utils/stockManager.js - Con optimistic locking implementado
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
    console.log(`♾️ Procesando venta de stock infinito: ${cantidad} unidades`);

    const timestamp = Date.now();
    const infiniteValue = Number.MAX_SAFE_INTEGER;

    const purchaseTrace = [
      {
        compraId: `infinite-stock-${timestamp}`,
        units: cantidad,
        unitCost: 0,
        remainingBefore: infiniteValue,
        remainingAfter: infiniteValue,
      },
    ];

    return {
      purchaseTrace,
      unitCostAvg: 0,
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
    if (compraIndex !== -1) {
      compras[compraIndex].stockRestante = 0;
      compras[compraIndex].ventasId = ventasId;

      await updateDoc(stockRef, {
        compras: compras,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  async updateStockRealReducir(
    stockReference,
    compraId,
    cantidadVendida,
    ventaId
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
      throw new Error("Documento de stock no encontrado");
    }

    const stockData = stockDoc.data();
    const compras = stockData?.compras || [];

    const compraIndex = compras.findIndex((c) => c.compraId === compraId);
    if (compraIndex !== -1) {
      compras[compraIndex].stockRestante -= cantidadVendida;
      const currentVentas = compras[compraIndex].ventasId || [];
      compras[compraIndex].ventasId = [...currentVentas, ventaId];

      await updateDoc(stockRef, {
        compras: compras,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  // OPTIMISTIC LOCKING: Usar transaction para garantizar atomicidad
  async processMultiPurchaseSaleWithTransaction(
    producto,
    selectedVariant,
    cantidadTotal,
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

    return await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error(
          "PRODUCT_DELETED: Producto eliminado durante la compra"
        );
      }

      const productData = productDoc.data();
      const variants = productData?.variants || [];

      let variantIndex;
      if (selectedVariant) {
        variantIndex = variants.findIndex((v) => v.id === selectedVariant.id);
      } else {
        variantIndex = variants.findIndex((v) => v.default === true);
      }

      if (variantIndex === -1) {
        throw new Error("VARIANT_NOT_FOUND: Variante no encontrada");
      }

      const variant = variants[variantIndex];
      const currentStockSummary = variant.stockSummary;

      if (!currentStockSummary) {
        throw new Error("MISSING_STOCK_SUMMARY: Variante sin stockSummary");
      }

      // OPTIMISTIC LOCK: Verificar versión
      const currentVersion = currentStockSummary.version || 0;
      const expectedVersion = selectedVariant?.stockSummary?.version || 0;

      if (currentVersion !== expectedVersion) {
        throw new Error(
          `STOCK_VERSION_MISMATCH: Stock actualizado por otra venta. Versión esperada: ${expectedVersion}, actual: ${currentVersion}`
        );
      }

      // Verificar stock disponible
      if (currentStockSummary.totalStock < cantidadTotal) {
        throw new Error(
          `INSUFFICIENT_STOCK: Stock insuficiente. Disponible: ${currentStockSummary.totalStock}, solicitado: ${cantidadTotal}`
        );
      }

      const totalStockBefore = currentStockSummary.totalStock;
      const purchaseTrace = [];
      let cantidadRestante = cantidadTotal;

      // Consumir de la compra actual
      const cantidadDeCompraActual = Math.min(
        cantidadRestante,
        currentStockSummary.currentPurchase.remainingStock
      );

      if (cantidadDeCompraActual > 0) {
        const remainingBefore =
          currentStockSummary.currentPurchase.remainingStock;
        const remainingAfter = remainingBefore - cantidadDeCompraActual;

        purchaseTrace.push({
          compraId: currentStockSummary.currentPurchase.compraID,
          units: cantidadDeCompraActual,
          unitCost: currentStockSummary.currentPurchase.unitCost || 0,
          remainingBefore: remainingBefore,
          remainingAfter: remainingAfter,
        });

        cantidadRestante -= cantidadDeCompraActual;
      }

      const newTotalStock = currentStockSummary.totalStock - cantidadTotal;
      const newVersion = currentVersion + 1;
      const newRemainingStock =
        currentStockSummary.currentPurchase.remainingStock -
        cantidadDeCompraActual;
      const newVentasId = [
        ...(currentStockSummary.currentPurchase.ventasId || []),
        ventaId,
      ];

      let updatedStockSummary;

      if (newRemainingStock === 0) {
        // Compra actual agotada - necesitamos encontrar la siguiente
        // Esto lo haremos después de la transacción
        updatedStockSummary = {
          version: newVersion,
          currentPurchase: {
            compraID: currentStockSummary.currentPurchase.compraID,
            remainingStock: 0,
            unitCost: currentStockSummary.currentPurchase.unitCost || 0,
            ventasId: newVentasId,
          },
          totalStock: newTotalStock,
          lastUpdated: new Date().toISOString(),
          needsReplenishment: true, // Flag para actualizar después
        };
      } else {
        updatedStockSummary = {
          ...currentStockSummary,
          version: newVersion,
          currentPurchase: {
            ...currentStockSummary.currentPurchase,
            remainingStock: newRemainingStock,
            ventasId: newVentasId,
          },
          totalStock: newTotalStock,
          lastUpdated: new Date().toISOString(),
        };
      }

      variants[variantIndex] = {
        ...variant,
        stockSummary: updatedStockSummary,
      };

      transaction.update(productRef, { variants: variants });

      console.log(
        `✅ Stock actualizado con transaction. Nueva versión: ${newVersion}`
      );

      const unitsTotal = purchaseTrace.reduce((a, e) => a + e.units, 0);
      const costTotal = purchaseTrace.reduce(
        (a, e) => a + e.units * e.unitCost,
        0
      );
      const unitCostAvg =
        unitsTotal > 0 ? this.round2(costTotal / unitsTotal) : 0;

      return {
        purchaseTrace,
        unitCostAvg,
        finalRemainingStock: newRemainingStock,
        totalStockAfter: newTotalStock,
        totalStockBefore,
        needsReplenishment: updatedStockSummary.needsReplenishment || false,
        stockReference,
        compraIdToUpdate: currentStockSummary.currentPurchase.compraID,
        ventasIdToUpdate: newVentasId,
      };
    });
  }

  async simulateVenta(producto, selectedVariant = null, cantidad = 1) {
    try {
      console.log(
        `🛒 Simulando venta de ${cantidad} unidades - ${producto.name}`
      );

      if (producto.infiniteStock === true) {
        return this.handleInfiniteStockSale(
          producto,
          selectedVariant,
          cantidad
        );
      }

      const ventaId = this.generateUUID();

      const variant =
        selectedVariant || producto.variants?.find((v) => v.default);
      if (!variant) {
        throw new Error("VARIANT_NOT_FOUND: No se encontró variante");
      }

      const stockReference = variant.stockReference;
      if (!stockReference) {
        throw new Error(
          "MISSING_STOCK_REFERENCE: Producto sin referencia de stock"
        );
      }

      // Ejecutar venta con optimistic locking
      const result = await this.processMultiPurchaseSaleWithTransaction(
        producto,
        selectedVariant,
        cantidad,
        ventaId,
        stockReference
      );

      // Actualizar stock real después de la transacción exitosa
      if (result.needsReplenishment) {
        await this.updateStockRealAgotarCompra(
          stockReference,
          result.compraIdToUpdate,
          result.ventasIdToUpdate
        );

        // Buscar siguiente compra y actualizar producto
        const nextPurchase = await this.findNextAvailablePurchase(
          stockReference
        );

        if (nextPurchase) {
          const productRef = doc(
            db,
            "absoluteClientes",
            this.enterpriseData.id,
            "sucursales",
            this.enterpriseData.selectedSucursal.id,
            "productos",
            producto.id
          );

          const recalculatedTotalStock =
            await this.calculateTotalStockFromSource(
              stockReference,
              nextPurchase.compraId,
              nextPurchase.stockRestante
            );

          const productDoc = await getDoc(productRef);
          const variants = productDoc.data().variants;
          const variantIndex = variants.findIndex(
            (v) => v.id === (selectedVariant?.id || variant.id)
          );

          if (variantIndex !== -1) {
            const currentVersion = variants[variantIndex].stockSummary.version;
            variants[variantIndex].stockSummary = {
              version: currentVersion,
              currentPurchase: {
                compraID: nextPurchase.compraId,
                remainingStock: nextPurchase.stockRestante,
                unitCost: nextPurchase.unitCost || 0,
                ventasId: [],
              },
              totalStock: recalculatedTotalStock,
              lastUpdated: new Date().toISOString(),
            };

            await updateDoc(productRef, { variants: variants });
          }
        }
      } else {
        // Solo actualizar stock real (reducir)
        await this.updateStockRealReducir(
          stockReference,
          result.compraIdToUpdate,
          cantidad,
          ventaId
        );
      }

      return result;
    } catch (error) {
      console.error("❌ Error al simular venta:", error);
      throw error;
    }
  }
}
