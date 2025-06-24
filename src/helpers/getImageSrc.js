/**
 * Devuelve una URL de imagen segura a mostrar.
 * @param {object|string|array|undefined|null} input - Puede ser string, array de strings, o un objeto con campo `img` o `image`.
 * @param {string} [fallback='/placeholder-product.jpg'] - Imagen por defecto si no hay válida.
 * @param {string} [basePath='/menu/'] - Prefijo para imágenes locales.
 * @returns {string} - URL final segura de imagen.
 */
export const getImageSrc = (
  input,
  fallback = '/placeholder-product.jpg',
  basePath = '/menu/'
) => {
  let imgSrc = null;

  if (Array.isArray(input)) {
    imgSrc = input[0]; // ✅ Tomar primera imagen del array
  } else if (typeof input === 'string') {
    imgSrc = input;
  } else if (typeof input === 'object' && input !== null) {
    imgSrc =
      input?.img || input?.image || input?.data?.img || input?.data?.image;

    // ✅ Si imgSrc es array, tomar la primera
    if (Array.isArray(imgSrc)) {
      imgSrc = imgSrc[0];
    }
  }

  if (!imgSrc) return fallback;

  // ✅ Si ya es una URL remota o base64, devolver tal cual
  if (
    typeof imgSrc === 'string' &&
    (imgSrc.startsWith('http') || imgSrc.startsWith('data:image/'))
  ) {
    return imgSrc;
  }

  // ✅ Para rutas locales relativas
  return `${basePath}${imgSrc}`;
};
