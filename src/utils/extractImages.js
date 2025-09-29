// utils/extractImages.js
export const extractImageUrls = {
  fromAssets: (assets) => {
    const urls = [];
    if (assets?.hero) {
      if (Array.isArray(assets.hero)) {
        urls.push(...assets.hero.filter((url) => typeof url === "string"));
      } else if (typeof assets.hero === "string") {
        urls.push(assets.hero);
      }
    }
    if (assets?.logo && typeof assets.logo === "string") urls.push(assets.logo);
    if (assets?.loading && typeof assets.loading === "string")
      urls.push(assets.loading);
    return urls.filter(Boolean);
  },

  fromCategories: (categories) => {
    const urls = [];
    categories?.forEach((cat) => {
      const img = cat.image || cat.img;
      if (img) {
        if (Array.isArray(img)) {
          // Solo la primera imagen del array
          if (typeof img[0] === "string") urls.push(img[0]);
        } else if (typeof img === "string") {
          urls.push(img);
        }
      }
    });
    return urls.filter(Boolean);
  },

  fromProducts: (products, limit = null) => {
    const urls = [];
    const productArray = Array.isArray(products) ? products : [];
    const slice = limit ? productArray.slice(0, limit) : productArray;

    slice.forEach((product) => {
      // Prioridad: img > image > images
      // Solo tomar la PRIMERA imagen de cualquier array

      if (product.img) {
        if (Array.isArray(product.img)) {
          if (typeof product.img[0] === "string") {
            urls.push(product.img[0]);
            return; // Ya tenemos una imagen, salir
          }
        } else if (typeof product.img === "string") {
          urls.push(product.img);
          return;
        }
      }

      if (product.image) {
        if (Array.isArray(product.image)) {
          if (typeof product.image[0] === "string") {
            urls.push(product.image[0]);
            return;
          }
        } else if (typeof product.image === "string") {
          urls.push(product.image);
          return;
        }
      }

      if (Array.isArray(product.images) && product.images[0]) {
        if (typeof product.images[0] === "string") {
          urls.push(product.images[0]);
        }
      }
    });

    return [...new Set(urls)]; // Eliminar duplicados
  },

  fromProductsByCategory: (productsByCategory, firstCategory) => {
    if (!productsByCategory || !firstCategory) return [];
    const firstProducts = productsByCategory[firstCategory] || [];
    return extractImageUrls.fromProducts(firstProducts, 15);
  },
};
