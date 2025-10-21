import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";
import LoadingPoints from "../../LoadingPoints";
import { getImageSrc } from "../../../helpers/getImageSrc";
import { useClient } from "../../../contexts/ClientContext";

const Card = ({ data, path }) => {
  const { slugEmpresa, slugSucursal } = useClient();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cardRef = useRef(null);
  const intervalRef = useRef(null);

  const installments = data?.installments;
  const cashDiscount = data?.cashDiscount;

  const {
    id,
    name = "Producto sin nombre",
    description = "",
    category,
    variants,
  } = data;

  const variantStats = useMemo(() => {
    const stats = {};
    for (const variant of variants || []) {
      if (!variant.attributes) continue;
      Object.entries(variant.attributes).forEach(([key, value]) => {
        const stringKey = String(key).toLowerCase();
        const stringValue = String(value).toLowerCase();
        if (!stats[stringKey]) stats[stringKey] = new Set();
        stats[stringKey].add(stringValue);
      });
    }
    const result = {};
    for (const key in stats) result[key] = Array.from(stats[key]);
    return result;
  }, [variants]);

  const checkIfCentered = useCallback(() => {
    if (!cardRef.current) return false;
    const rect = cardRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportCenterY = viewportHeight / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const distanceFromCenter = Math.abs(cardCenterY - viewportCenterY);
    const threshold = 140;
    return (
      distanceFromCenter < threshold &&
      rect.top < viewportHeight &&
      rect.bottom > 0
    );
  }, []);

  const getDefaultVariant = (variants) => {
    if (!Array.isArray(variants) || variants.length === 0) return null;
    return (
      variants.find((v) => v.default) ||
      variants.find((v) => v.stockSummary?.totalStock > 0) ||
      variants[0]
    );
  };

  const selectedVariant = useMemo(
    () => getDefaultVariant(data.variants),
    [data.variants]
  );

  const basePrice = data.price || 0;
  const variantDiff = selectedVariant?.price || 0;
  const adjustedPrice = basePrice + variantDiff; // precio de lista base

  // >>> NUEVA LÓGICA DE PRICING (Reglas 1–3)
  const pricingInfo = useMemo(() => {
    const hasInstallments = Boolean(
      installments?.enabled && installments.quantity
    );
    const hasCashDiscount = Boolean(
      cashDiscount?.enabled && cashDiscount.percentage
    );

    // Normalizo porcentaje (permite 10 ó 0.10)
    const discountPct = hasCashDiscount
      ? cashDiscount.percentage > 1
        ? cashDiscount.percentage / 100
        : cashDiscount.percentage
      : 0;

    const cashPrice = hasCashDiscount
      ? Math.ceil(adjustedPrice * (1 - discountPct))
      : null;

    // Texto de cuotas si aplica
    let installmentText = null;
    if (hasInstallments) {
      const interestRate =
        installments.interest > 1
          ? installments.interest / 100
          : installments.interest || 0;
      const finalAmount = adjustedPrice * (1 + interestRate);
      const perCuota = Math.ceil(finalAmount / installments.quantity);
      installmentText = `${installments.quantity} cuota${
        installments.quantity > 1 ? "s" : ""
      } de ${currencyFormat(perCuota)}${
        interestRate === 0 ? " (sin interés)" : ""
      }`;
    }

    // Regla 1 + 2 + 3 → Jerarquía y no redundancia
    // - Si hay descuento en efectivo, el precio principal es el de efectivo.
    // - Si hay descuento, NO muestro el precio original como alternativa; sólo tachado.
    // - Si NO hay descuento, el precio principal es el de lista, y las alternativas pueden ser cuotas.

    if (hasCashDiscount) {
      return {
        mainPrice: cashPrice, // grande
        strikeThroughOldPrice: adjustedPrice, // pequeño, tachado
        installmentText, // alternativa (si existe)
      };
    }

    // Sin descuento efectivo
    return {
      mainPrice: adjustedPrice, // grande
      strikeThroughOldPrice: null, // no hay
      installmentText, // si hay, se muestra como alternativa
    };
  }, [adjustedPrice, installments, cashDiscount]);

  const images = useMemo(() => {
    const imgs = selectedVariant?.images?.length
      ? selectedVariant.images
      : data?.img || data?.image || data?.images || [];
    if (Array.isArray(imgs)) return imgs;
    return [getImageSrc(imgs)];
  }, [selectedVariant, data]);

  useEffect(() => {
    const handleScroll = () => setIsInViewport(checkIfCentered());
    handleScroll();
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", throttledScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [checkIfCentered]);

  useEffect(() => {
    if (isInViewport && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInViewport, images]);

  const currentImageSrc = images[currentImageIndex];

  // Lógica de stock mejorada
  const stockStatus = useMemo(() => {
    if (data.infiniteStock) return { available: true, limited: false };
    if (!variants || variants.length === 0) {
      const hasStock = data.stockSummary?.totalStock > 0;
      return { available: hasStock, limited: false };
    }
    const variantsWithStock = variants.filter(
      (v) => v.stockSummary?.totalStock > 0
    );
    const allOutOfStock = variantsWithStock.length === 0;
    const someOutOfStock = variantsWithStock.length < variants.length;
    return {
      available: !allOutOfStock,
      limited: someOutOfStock && !allOutOfStock,
    };
  }, [data.infiniteStock, data.stockSummary, variants]);

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col rounded-3xl items-center shadow-lg shadow-gray-200 bg-gray-50  transition duration-300 w-full max-w-[400px] text-black z-50"
    >
      <Link
        to={`/${slugEmpresa}/${slugSucursal}/menu/${path}/${data.id}`}
        state={{ product: data }}
        className="w-full"
      >
        <div className="relative w-full aspect-square  overflow-hidden rounded-t-3xl bg-gray-100">
          {!isLoaded && !imageError && (
            <div className="h-full w-full items-center justify-center flex">
              <LoadingPoints />
            </div>
          )}

          {!currentImageSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 text-gray-400 mx-auto "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          )}

          {Object.keys(variantStats).filter(
            (key) => variantStats[key].length > 0
          ).length > 0 && (
            <div className="absolute bottom-2 left-4 right-4 z-30">
              <div className="flex flex-wrap gap-1 justify-start">
                {(() => {
                  const attributes = Object.keys(variantStats)
                    .filter((key) => variantStats[key].length > 0)
                    .map((key) => key.charAt(0).toUpperCase() + key.slice(1));
                  const maxVisible = 3;
                  const visibleAttributes = attributes.slice(0, maxVisible);
                  const hasMore = attributes.length > maxVisible;
                  return (
                    <>
                      {visibleAttributes.map((attr, index) => (
                        <div
                          key={index}
                          className="bg-gray-300 capitalize bg-opacity-50 text-gray-50  font-primary  text-xs font-light px-2.5 py-1.5 backdrop-blur-md rounded-full"
                        >
                          {attr}
                        </div>
                      ))}
                      {hasMore && (
                        <div className="bg-gray-300 bg-opacity-70 text-gray-50  font-primary  text-xs font-light px-2.5 py-1.5 backdrop-blur-md rounded-full">
                          +{attributes.length - maxVisible}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <img
            src={currentImageSrc}
            alt={name || "Producto"}
            className={`object-cover w-full h-full transition-all duration-500 transform group-hover:scale-105 ${
              isLoaded && !imageError ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => {
              setIsLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              setImageError(true);
              setIsLoaded(false);
            }}
          />
        </div>

        {/* datos */}
        <div className="flex px-4 flex-col justify-between leading-normal  font-primary  text-left">
          <div className="flex mt-4 flex-col w-full">
            <h5 className="text-base font-medium">
              {(name || "Producto sin nombre").charAt(0).toUpperCase() +
                (name || "Producto sin nombre").slice(1).toLowerCase()}
            </h5>
          </div>
          {data?.cardDescription && (
            <p className="text-xs text-gray-400 font-light  font-primary ">
              {data.cardDescription}
            </p>
          )}

          <div className="flex w-full mt-4 flex-col mb-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-black">
                  {currencyFormat(pricingInfo.mainPrice)}
                </span>
                {pricingInfo.strikeThroughOldPrice && (
                  <span className="text-xs text-gray-400 font-light">
                    en efectivo/transferencia
                  </span>
                )}
              </div>

              {/* Indicadores de stock */}
              {!stockStatus.available && (
                <span className="bg-red-500 text-gray-50 px-4 py-2 text-xs font-medium rounded-full z-40">
                  Agotado
                </span>
              )}
              {stockStatus.limited && (
                <span className="bg-yellow-500 text-gray-50 px-4 py-2 text-xs font-medium rounded-full z-40">
                  Stock limitado
                </span>
              )}
            </div>

            {/* Alternativas de pago (sin redundancias) */}
            {pricingInfo.installmentText && (
              <div className="font-light pr-12 flex flex-col items-start">
                <span className="text-gray-400 text-xs">{`o ${pricingInfo.installmentText}`}</span>
              </div>
            )}

            {data.deliveryDelay && (
              <div className="mt-1">
                {(() => {
                  const delayHours = data.deliveryDelay;
                  const delayText =
                    delayHours < 24
                      ? `${delayHours} hora${delayHours !== 1 ? "s" : ""}`
                      : `${Math.ceil(delayHours / 24)} día${
                          Math.ceil(delayHours / 24) !== 1 ? "s" : ""
                        }`;
                  return (
                    <p className="text-gray-500 text-xs font-light">
                      Este producto está en otra sucursal y demora {delayText}{" "}
                      en llegar.
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;
