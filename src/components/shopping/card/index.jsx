import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import QuickAddToCart from "./quickAddToCart";
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
    for (const key in stats) {
      result[key] = Array.from(stats[key]);
    }

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
  const adjustedPrice = basePrice + variantDiff;

  const pricingInfo = useMemo(() => {
    const hasInstallments = installments?.enabled && installments.quantity;
    const hasCashDiscount = cashDiscount?.enabled && cashDiscount.percentage;

    const result = {
      mainPrice: adjustedPrice,
      primaryText: null,
      secondaryText: null,
    };

    const paymentOptions = [];

    if (hasCashDiscount) {
      const discountPercentage =
        cashDiscount.percentage > 1
          ? cashDiscount.percentage / 100
          : cashDiscount.percentage;

      const cashPrice = Math.ceil(adjustedPrice * (1 - discountPercentage));
      paymentOptions.push(
        `${currencyFormat(cashPrice)} en efectivo/transferencia`
      );
    }

    if (hasInstallments) {
      const interestRate =
        installments.interest > 1
          ? installments.interest / 100
          : installments.interest;

      const finalAmount = adjustedPrice * (1 + interestRate);
      const perCuota = finalAmount / installments.quantity;

      const installmentText = `${installments.quantity} cuota${
        installments.quantity > 1 ? "s" : ""
      } de ${currencyFormat(Math.ceil(perCuota))}${
        interestRate === 0 ? " (sin interés)" : ""
      }`;

      paymentOptions.push(installmentText);
    }

    if (paymentOptions.length === 1) {
      result.primaryText = `o ${paymentOptions[0]}`;
    } else if (paymentOptions.length === 2) {
      result.primaryText = `o ${paymentOptions[0]}`;
      result.secondaryText = `o ${paymentOptions[1]}`;
    }

    return result;
  }, [adjustedPrice, installments, cashDiscount]);

  const images = useMemo(() => {
    const imgs = selectedVariant?.images?.length
      ? selectedVariant.images
      : data?.img || data?.image || data?.images || [];

    if (Array.isArray(imgs)) return imgs;
    return [getImageSrc(imgs)];
  }, [selectedVariant, data]);

  useEffect(() => {
    const handleScroll = () => {
      const isCentered = checkIfCentered();
      setIsInViewport(isCentered);
    };

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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInViewport, images]);

  const currentImageSrc = images[currentImageIndex];

  // Lógica de stock mejorada
  const stockStatus = useMemo(() => {
    // Si tiene stock infinito, siempre hay stock
    if (data.infiniteStock) {
      return { available: true, limited: false };
    }

    // Si no hay variantes, verificar stock del producto
    if (!variants || variants.length === 0) {
      const hasStock = data.stockSummary?.totalStock > 0;
      return { available: hasStock, limited: false };
    }

    // Si hay variantes, analizar su stock
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

  const finalName =
    selectedVariant?.name && !selectedVariant?.default
      ? selectedVariant.name
      : name;

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col rounded-3xl items-center shadow-md bg-gray-50 pb-2 transition duration-300 w-full max-w-[400px] text-black z-50"
    >
      {(!variants || variants.length === 0) && (
        <div className="absolute right-3.5 top-2.5 z-40">
          <QuickAddToCart
            product={{
              name: finalName,
              description: data.cardDescription || description,
              price: pricingInfo.mainPrice,
              img: currentImageSrc,
              path,
              id,
              category,
            }}
          />
        </div>
      )}

      <Link
        to={`/${slugEmpresa}/${slugSucursal}/menu/${path}/${data.id}`}
        state={{ product: data }}
        className="w-full"
      >
        <div className="relative h-[160px]  overflow-hidden rounded-t-3xl w-full">
          {!isLoaded && !imageError && (
            <div className="h-full w-full items-center justify-center flex">
              <LoadingPoints />
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-500 mx-auto mb-2"
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
                <span className="text-gray-500 text-xs">Sin imagen</span>
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
                          className="bg-gray-50 bg-opacity-40 text-gray-50 font-coolvetica  text-xs font-light px-2 py-1  rounded-lg shadow-lg shadow-gray-900"
                        >
                          {attr}
                        </div>
                      ))}
                      {hasMore && (
                        <div className="bg-gray-50 bg-opacity-70 text-gray-50 font-coolvetica  text-xs font-light px-2 py-1  rounded-lg shadow-lg shadow-gray-900">
                          +{attributes.length - maxVisible}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {isInViewport && images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "bg-gray-50 opacity-100"
                      : "bg-gray-50 opacity-30"
                  }`}
                />
              ))}
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
            onError={(e) => {
              setImageError(true);
              setIsLoaded(false);
            }}
          />
        </div>

        {/* datos */}
        <div className="flex px-4 flex-col justify-between leading-normal font-coolvetica text-left ">
          <div className="flex mt-4 flex-col w-full items-center justify-center ">
            <h5 className=" text-lg   font-medium  text-center">
              {(name || "Producto sin nombre").charAt(0).toUpperCase() +
                (name || "Producto sin nombre").slice(1).toLowerCase()}
            </h5>
          </div>
          {data?.cardDescription && (
            <p className="text-center text-xs text-gray-400 font-light font-coolvetica  ">
              {data.cardDescription}
            </p>
          )}
          <div className="flex w-full mt-4 flex-col mb-4">
            <div className="flex flex-row justify-between items-center">
              <span className="font-bold text-4xl text-black">
                {currencyFormat(pricingInfo.mainPrice)}
              </span>
              {/* Indicador de stock - arriba derecha sobre imagen */}
              {!stockStatus.available && (
                <span className=" bg-red-500 text-gray-50 px-4 py-2 text-xs font-light rounded-full z-40 shadow-lg">
                  Agotado
                </span>
              )}
              {stockStatus.limited && (
                <span className=" bg-yellow-500 text-gray-50 px-4 py-2 text-xs font-light rounded-full z-40 shadow-lg">
                  Stock limitado
                </span>
              )}
            </div>
            {(pricingInfo.primaryText || pricingInfo.secondaryText) && (
              <div className="font-light pr-12   flex flex-col items-start">
                {pricingInfo.primaryText && (
                  <span className="text-gray-400 font-light text-xs">
                    {pricingInfo.primaryText}
                  </span>
                )}
                {pricingInfo.secondaryText && (
                  <span className="text-gray-400 text-xs">
                    {pricingInfo.secondaryText}
                  </span>
                )}
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
