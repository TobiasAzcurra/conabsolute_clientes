/**
 * Devuelve una URL de imagen segura a mostrar.
 * @param {object|string|undefined|null} input - Objeto con campo `img` o `image`, o directamente una string.
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

  if (typeof input === 'string') {
    imgSrc = input;
  } else if (typeof input === 'object' && input !== null) {
    imgSrc =
      input?.img || input?.image || input?.data?.img || input?.data?.image;
  }

  if (!imgSrc) return fallback;

  if (
    typeof imgSrc === 'string' &&
    (imgSrc.startsWith('https://') || imgSrc.startsWith('data:image/'))
  ) {
    return imgSrc;
  }

  return `${basePath}${imgSrc}`;
};
