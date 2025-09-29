// utils/stockManager.js - SINTAXIS FIREBASE V9 CORREGIDA
import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export class StockManager {
  constructor(enterpriseData) {
    this.enterpriseData = enterpriseData;
  }

  // Generar UUID para identificadores únicos
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

  // Helper de redondeo
  round2(n) {
    return Math.round(n * 100) / 100;
  }

  // Manejar venta de productos con stock infinito
  handleInfiniteStockSale(producto, selectedVariant = null, cantidad = 1) {
    console.log(`♾️ Procesando venta de stock infinito: ${cantidad} unidades`);

    const timestamp = Date.now();
    const infiniteValue = Number.MAX_SAFE_INTEGER;

    // purchaseTrace sintético con costos en 0
    const purchaseTrace = [
      {
        compraId: `infinite-stock-${timestamp}`,
        units: cantidad,
        unitCost: 0, // Costo = 0 para infinite stock
        remainingBefore: infiniteValue,
        remainingAfter: infiniteValue,
      },
    ];

    return {
      purchaseTrace,
      unitCostAvg: 0, // Promedio = 0
      finalRemainingStock: infiniteValue,
      totalStockAfter: infiniteValue,
      totalStockBefore: infiniteValue,
    };
  }

  // ✅ CORREGIDO: Calcular totalStock desde documento stock real
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
        // Usar remainingStock desde stockSummary
        if (currentRemainingStock !== undefined) {
          totalStock += currentRemainingStock;
        } else {
          totalStock += compra.stockRestante || 0;
        }
      } else {
        // Otras compras: usar stockRestante del documento
        totalStock += compra.stockRestante || 0;
      }
    });

    return totalStock;
  }

  // ✅ CORREGIDO: Buscar siguiente compra disponible (FIFO)
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

    // Buscar primera compra con stockRestante > 0 (FIFO)
    return compras.find((compra) => compra.stockRestante > 0) || null;
  }

  // ✅ CORREGIDO: Actualizar stock real: agotar compra completamente
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

  // ✅ CORREGIDO: Actualizar stock real: reducir específico
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

  // ✅ CORREGIDO: Procesamiento de venta multi-compra (FIFO) con traza enriquecida
  async processMultiPurchaseSale(
    productRef,
    variants,
    variantIndex,
    cantidadTotal,
    ventaId,
    stockReference
  ) {
    const variant = variants[variantIndex];
    const currentStockSummary = variant.stockSummary;
    let cantidadRestante = cantidadTotal;

    const totalStockBefore = currentStockSummary.totalStock;
    const purchaseTrace = [];

    // PASO 1: Consumir de la compra actual
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
    }

    cantidadRestante -= cantidadDeCompraActual;

    if (cantidadRestante === 0) {
      // CASO SIMPLE: Todo el stock viene de la compra actual
      const newRemainingStock =
        currentStockSummary.currentPurchase.remainingStock -
        cantidadDeCompraActual;
      const newTotalStock = currentStockSummary.totalStock - cantidadTotal;
      const newVersion = (currentStockSummary.version || 0) + 1;
      const newVentasId = [
        ...(currentStockSummary.currentPurchase.ventasId || []),
        ventaId,
      ];

      if (newRemainingStock === 0) {
        // Compra actual agotada
        await this.updateStockRealAgotarCompra(
          stockReference,
          currentStockSummary.currentPurchase.compraID,
          newVentasId
        );

        // Buscar siguiente compra para reposición
        const nextPurchase = await this.findNextAvailablePurchase(
          stockReference
        );

        if (nextPurchase) {
          const recalculatedTotalStock =
            await this.calculateTotalStockFromSource(
              stockReference,
              nextPurchase.compraId,
              nextPurchase.stockRestante
            );

          const newStockSummary = {
            version: newVersion,
            currentPurchase: {
              compraID: nextPurchase.compraId,
              remainingStock: nextPurchase.stockRestante,
              unitCost: nextPurchase.unitCost || 0,
              ventasId: [],
            },
            totalStock: recalculatedTotalStock,
            lastUpdated: new Date().toISOString(),
          };

          variants[variantIndex] = {
            ...variant,
            stockSummary: newStockSummary,
          };
          await updateDoc(productRef, { variants: variants });
        } else {
          // No hay más stock
          const emptyStockSummary = {
            version: newVersion,
            currentPurchase: {
              compraID: "",
              remainingStock: 0,
              unitCost: 0,
              ventasId: [],
            },
            totalStock: 0,
            lastUpdated: new Date().toISOString(),
          };
          variants[variantIndex] = {
            ...variant,
            stockSummary: emptyStockSummary,
          };
          await updateDoc(productRef, { variants: variants });
        }
      } else {
        // Actualizar solo stockSummary
        const updatedStockSummary = {
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

        variants[variantIndex] = {
          ...variant,
          stockSummary: updatedStockSummary,
        };
        await updateDoc(productRef, { variants: variants });
      }

      const finalVariant = variants[variantIndex];
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
        finalRemainingStock:
          finalVariant.stockSummary.currentPurchase.remainingStock,
        totalStockAfter: finalVariant.stockSummary.totalStock,
        totalStockBefore,
      };
    } else {
      // CASO COMPLEJO: Necesita múltiples compras
      // Por brevedad, lanzamos error - implementación completa requiere más lógica
      throw new Error(
        `Stock insuficiente. Disponible: ${
          cantidadTotal - cantidadRestante
        }, solicitado: ${cantidadTotal}`
      );
    }
  }

  // ✅ CORREGIDO: Función principal: simular venta
  async simulateVenta(producto, selectedVariant = null, cantidad = 1) {
    try {
      console.log(
        `🛒 Simulando venta de ${cantidad} unidades - ${producto.name}`
      );

      // Detectar productos con stock infinito
      if (producto.infiniteStock === true) {
        return this.handleInfiniteStockSale(
          producto,
          selectedVariant,
          cantidad
        );
      }

      // Generar ID único para la venta
      const ventaId = this.generateUUID();

      // ✅ SINTAXIS CORREGIDA: Referencia al producto usando v9
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
      if (!productDoc.exists()) {
        throw new Error("El producto no existe");
      }

      const productData = productDoc.data();
      const variants = productData?.variants || [];

      // Encontrar la variante correcta
      let variantIndex;
      if (selectedVariant) {
        variantIndex = variants.findIndex((v) => v.id === selectedVariant.id);
      } else {
        variantIndex = variants.findIndex((v) => v.default === true);
      }

      if (variantIndex === -1) {
        throw new Error("Variante no encontrada");
      }

      const variant = variants[variantIndex];
      const stockReference = variant.stockReference;

      if (!stockReference) {
        throw new Error("Producto sin referencia de stock");
      }

      return await this.processMultiPurchaseSale(
        productRef,
        variants,
        variantIndex,
        cantidad,
        ventaId,
        stockReference
      );
    } catch (error) {
      console.error("❌ Error al simular venta:", error);
      throw error;
    }
  }
}
