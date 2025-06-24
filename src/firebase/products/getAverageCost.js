export const getAverageCost = (producto) => {
  if (!producto.stock || !Array.isArray(producto.stock)) {
    return 0;
  }

  const lotesConStock = producto.stock.filter((lote) => lote.stockRestante > 0);

  if (lotesConStock.length === 0) {
    return 0;
  }

  const costoTotal = lotesConStock.reduce((total, lote) => {
    return total + lote.costoUnitario * lote.stockRestante;
  }, 0);

  const stockTotal = lotesConStock.reduce((total, lote) => {
    return total + lote.stockRestante;
  }, 0);

  return stockTotal > 0 ? costoTotal / stockTotal : 0;
};
