// utils/productSorters.js

/**
 * Agrupa productos por categoría
 */
export const groupByCategory = (products) => {
  return products.reduce((acc, product) => {
    const key = product.categoryId || "sin-categoria";
    if (!acc[key]) acc[key] = [];

    const alreadyExists = acc[key].some((p) => p.id === product.id);
    if (!alreadyExists) {
      acc[key].push(product);
    }

    return acc;
  }, {});
};

/**
 * Ordena productos según el orden de las categorías (por position)
 */
export const sortProductsByCategory = (products, categories) => {
  if (!categories || categories.length === 0) return products;

  const categoryOrder = categories
    .filter((cat) => cat.position !== undefined)
    .sort((a, b) => a.position - b.position)
    .map((cat) => cat.id);

  if (categoryOrder.length === 0) return products;

  return categoryOrder.flatMap((catId) =>
    products.filter((p) => p.categoryId === catId)
  );
};

/**
 * Ordena productos alfabéticamente
 */
export const sortProductsByName = (products) => {
  return [...products].sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
  });
};

/**
 * Ordena productos por precio (ascendente)
 */
export const sortProductsByPrice = (products) => {
  return [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
};

/**
 * Ordena productos por fecha de creación (más recientes primero)
 */
export const sortProductsByDate = (products) => {
  return [...products].sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
    const dateB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
    return dateB - dateA;
  });
};

/**
 * Ordena productos por la posición mínima de sus tags
 */
export const sortProductsByTagPosition = (products, productTags) => {
  const getMinTagPosition = (product) => {
    if (!product.tags || product.tags.length === 0) {
      return Infinity;
    }

    const positions = product.tags
      .map((tagId) => {
        const tag = productTags.find((t) => t.id === tagId);
        return tag?.position ?? Infinity;
      })
      .filter((pos) => pos !== Infinity);

    return positions.length > 0 ? Math.min(...positions) : Infinity;
  };

  return [...products].sort((a, b) => {
    const posA = getMinTagPosition(a);
    const posB = getMinTagPosition(b);
    return posA - posB;
  });
};
