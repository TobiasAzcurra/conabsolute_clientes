import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link, useParams } from "react-router-dom";
import { listenToAltaDemanda } from "../../../firebase/constants/altaDemanda";
import LoadingPoints from "../../LoadingPoints";
import { getImageSrc } from "../../../helpers/getImageSrc";
import { useClient } from "../../../contexts/ClientContext";

const Card = ({ data, path }) => {
  const { slugEmpresa, slugSucursal, clientConfig } = useClient();
  const [priceFactor, setPriceFactor] = useState(1);
  const [itemsOut, setItemsOut] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [showConsultStock, setShowConsultStock] = useState(false);
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

  const images = useMemo(() => {
    const raw = data?.img || data?.image || data?.images || [];

    if (Array.isArray(raw)) {
      return raw;
    }

    const resolved = getImageSrc(raw);
    return [resolved];
  }, [data]);

  const variantStats = useMemo(() => {
    const stats = {};

    for (const variant of variants || []) {
      const key = variant.linkedTo;
      const value = variant.name;
      if (!key || !value) continue;

      const stringKey = String(key).toLowerCase();
      const stringValue = String(value).toLowerCase();

      if (!stats[stringKey]) stats[stringKey] = new Set();
      stats[stringKey].add(stringValue);
    }

    const result = {};
    for (const key in stats) {
      result[key] = Array.from(stats[key]);
    }

    return result;
  }, [variants]);

  const visibleLabels = useMemo(() => {
    return Object.entries(variantStats)
      .filter(([, values]) => values.length > 0)
      .map(([key, values]) => {
        const translatedKey = clientConfig?.labels?.[key] || key;
        return {
          key,
          text: `${values.length} ${translatedKey}`,
        };
      });
  }, [variantStats, clientConfig]);

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
    return variants.find((v) => v.stock > 0) || variants[0];
  };

  const selectedVariant = useMemo(
    () => getDefaultVariant(data.variants),
    [data.variants]
  );

  const basePrice = data.price || 0;
  const adjustedPrice = Math.ceil((basePrice * priceFactor) / 100) * 100;

  // Nueva lógica de precios
  const pricingInfo = useMemo(() => {
    const hasInstallments = installments?.enabled && installments.quantity;
    const hasCashDiscount = cashDiscount?.enabled && cashDiscount.percentage;

    if (hasCashDiscount) {
      // Caso 1: Con descuento en efectivo - precio principal es el más barato
      const cashPrice = Math.ceil(
        adjustedPrice * (1 - cashDiscount.percentage)
      );
      const result = {
        mainPrice: cashPrice,
        primaryText: "en efectivo/transferencia",
        secondaryText: null,
      };

      if (hasInstallments) {
        const interestRate = installments.interest || 0;
        const finalAmount = adjustedPrice * (1 + interestRate);
        const perCuota = finalAmount / installments.quantity;

        result.secondaryText = `o por ${installments.quantity} cuota${
          installments.quantity > 1 ? "s" : ""
        } de ${currencyFormat(Math.ceil(perCuota))}${
          interestRate === 0
            ? " (sin interés)"
            : ` (con ${Math.floor(interestRate * 100)}% interés)`
        }`;
      }

      return result;
    }

    if (hasInstallments) {
      // Caso 2: Solo cuotas - precio principal es el normal
      const interestRate = installments.interest || 0;
      const finalAmount = adjustedPrice * (1 + interestRate);
      const perCuota = finalAmount / installments.quantity;

      return {
        mainPrice: adjustedPrice,
        primaryText: null,
        secondaryText: `o en ${installments.quantity} cuota${
          installments.quantity > 1 ? "s" : ""
        } de ${currencyFormat(Math.ceil(perCuota))}${
          interestRate === 0
            ? " (sin interés)"
            : ` (con ${Math.floor(interestRate * 100)}% interés)`
        }`,
      };
    }

    // Caso 3: Simple - solo precio
    return {
      mainPrice: adjustedPrice,
      primaryText: null,
      secondaryText: null,
    };
  }, [adjustedPrice, installments, cashDiscount]);

  const resolvedImages = useMemo(() => {
    const imgs =
      selectedVariant?.images || data?.img || data?.image || data?.images || [];
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

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemanda) => {
      setPriceFactor(altaDemanda.priceFactor);
      setItemsOut(altaDemanda.itemsOut);
    });
    return () => unsubscribe();
  }, []);

  const currentImageSrc = images[currentImageIndex];

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col rounded-3xl items-center border border-black border-opacity-30 bg-gray-50  transition duration-300 w-full max-w-[400px] text-black z-50"
    >
      {(!variants || variants.length === 0) && (
        <div className="absolute right-3.5 top-2.5 z-40">
          <QuickAddToCart
            product={{
              name,
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
        {/* loading */}
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

          {/* indicador de variante */}
          <div className="absolute bottom-0 left-2 z-30 flex gap-2">
            {visibleLabels.map((label, index) => (
              <span
                key={`${label.key}-${index}`}
                className="text-gray-400 text-[10px] font-medium bg-gray-50 px-2 py-1 rounded-t-xl"
              >
                {label.text}
              </span>
            ))}
          </div>

          {/* indicador de imagenes */}
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
              {name || "Producto sin nombre"}
            </h5>
          </div>
          {data?.cardDescription && (
            <p className="text-center text-xs text-gray-400 font-light font-coolvetica leading-tight ">
              {data.cardDescription}
            </p>
          )}
          <div className="flex w-full mt-4 flex-col mb-4">
            <span className="font-bold text-4xl text-black">
              {currencyFormat(pricingInfo.mainPrice)}
            </span>

            {(pricingInfo.primaryText || pricingInfo.secondaryText) && (
              <div className="font-light pr-12  mt-1 flex flex-col items-start">
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
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;
