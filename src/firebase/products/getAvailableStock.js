export const getAvailableStock = (producto) => {
  if (!producto.stock || !Array.isArray(producto.stock)) {
    return 0;
  }

  return producto.stock.reduce((total, lote) => {
    return total + (lote.stockRestante || 0);
  }, 0);
};
