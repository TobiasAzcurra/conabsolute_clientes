import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import QuickAddToCart from './quickAddToCart';
import currencyFormat from '../../../helpers/currencyFormat';
import { Link, useParams } from 'react-router-dom';
import { listenToAltaDemanda } from '../../../firebase/constants/altaDemanda';
import LoadingPoints from '../../LoadingPoints';
import { getImageSrc } from '../../../helpers/getImageSrc';
import { useClient } from '../../../contexts/ClientContext';

const Card = ({ data, path }) => {
  const { slugEmpresa, slugSucursal } = useClient();
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

  const {
    id,
    name = 'Producto sin nombre',
    description = '',
    price,
    category,
    variants,
    img,
    image,
  } = data;

  console.log('Card data:', data);

  const images = useMemo(() => {
    const raw = data?.img || data?.image || data?.images || img || [];

    if (Array.isArray(raw)) {
      return raw;
    }

    const resolved = getImageSrc(raw);
    return [resolved];
  }, [data, img]);

  // Generar números y etiquetas aleatorias usando useMemo para que sean consistentes
  const randomLabels = useMemo(() => {
    const generateRandomNumber = () => Math.floor(Math.random() * 4) + 1;

    const allLabels = [
      { key: 'colores', text: `${generateRandomNumber()} colores` },
      { key: 'tamaños', text: `${generateRandomNumber()} tamaños` },
      { key: 'labrados', text: `${generateRandomNumber()} labrados` },
    ];

    // Determinar cuántas etiquetas mostrar (1, 2 o 3)
    const numLabels = Math.floor(Math.random() * 3) + 1;

    // Mezclar el array y tomar solo las primeras numLabels
    const shuffled = allLabels.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numLabels);
  }, [id]); // Usar id como dependencia para que sea consistente por producto

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

  const resolvedImages = useMemo(() => {
    const imgs =
      selectedVariant?.images || data?.img || data?.image || data?.images || [];
    if (Array.isArray(imgs)) return imgs;
    return [getImageSrc(imgs)];
  }, [selectedVariant, data]);

  const basePrice = selectedVariant?.price || data.price || 0;
  const adjustedPrice = Math.ceil((basePrice * priceFactor) / 100) * 100;

  useEffect(() => {
    const handleScroll = () => {
      const isCentered = checkIfCentered();
      setIsInViewport(isCentered);
    };

    // Verificar inicialmente
    handleScroll();

    // Agregar listener de scroll con throttling
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

    window.addEventListener('scroll', throttledScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleScroll);
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
      <div className="absolute right-3.5 top-2.5 z-40">
        <QuickAddToCart
          product={{
            name,
            description,
            price: adjustedPrice,
            img: currentImageSrc,
            path,
            id,
            category,
          }}
        />
      </div>

      <Link
        to={`/${slugEmpresa}/${slugSucursal}/menu/${path}/${data.id}`}
        state={{ product: data }}
        className="w-full"
      >
        <div className="relative h-[160px] overflow-hidden rounded-t-3xl w-full">
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

          <div className="absolute inset-0 bg-gradient-to-t from-gray-400 via-transparent to-transparent opacity-50"></div>

          <div className="absolute bottom-0 left-2 z-30 flex gap-2">
            {randomLabels.map((label, index) => (
              <span
                key={`${label.key}-${index}`}
                className="text-gray-600 text-[10px] font-medium bg-gray-50  px-2 py-1 rounded-t-xl"
              >
                {label.text}
              </span>
            ))}
          </div>

          {isInViewport && (
            <div className="absolute top-4 left-1/2 z-30 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'bg-white opacity-100'
                      : 'bg-white opacity-50'
                  }`}
                />
              ))}
            </div>
          )}

          <img
            src={currentImageSrc}
            alt={name || 'Producto'}
            className={`object-cover w-full h-full transition-all duration-500 transform group-hover:scale-105 ${
              isLoaded && !imageError ? 'opacity-100' : 'opacity-0'
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

        <div className="flex px-4 flex-col justify-between leading-normal font-coolvetica text-left ">
          <div className="flex mt-4 flex-col w-full items-center justify-center ">
            <h5 className=" text-lg   font-medium  text-center">
              {name || 'Producto sin nombre'}
            </h5>
          </div>
          {data?.cardDescription && (
            <p className="text-center text-xs text-gray-600 font-light font-coolvetica leading-tight mb-1">
              {data.cardDescription}
            </p>
          )}

          {description && (
            <p className="text-center text-xs font-light text-opacity-30 text-black">
              {description}
            </p>
          )}
          <div className="flex w-full mt-4 flex-col mb-6">
            <span className="font-bold text-4xl text-black">
              {currencyFormat(adjustedPrice)}
            </span>
            <span className="font-light pr-12 text-xs text-green-500">
              en 6 cuotas de ${Math.ceil(adjustedPrice / 6)} o en transferencia
              / efectivo por ${Math.ceil(adjustedPrice * 0.85)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;
