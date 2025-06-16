import React, { useState, useEffect } from 'react';
import QuickAddToCart from './quickAddToCart';
import currencyFormat from '../../../helpers/currencyFormat';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { listenToAltaDemanda } from '../../../firebase/readConstants';
import LoadingPoints from '../../LoadingPoints';

const Card = ({
  name,
  description,
  price,
  img,
  path,
  id,
  category,
  type,
  data,
}) => {
  const { slug } = useParams();
  const [priceFactor, setPriceFactor] = useState(1);
  const [itemsOut, setItemsOut] = useState({});
  // const [availableUnits, setAvailableUnits] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null); // Estado para el color seleccionado
  const [showConsultStock, setShowConsultStock] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemanda) => {
      setPriceFactor(altaDemanda.priceFactor);
      setItemsOut(altaDemanda.itemsOut);
    });
    return () => unsubscribe();
  }, []);

  // const renderStars = (score) => {
  //   const stars = [];
  //   const fullStars = Math.floor(score);
  //   const hasHalfStar = score - fullStars >= 0.5;
  //   const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  //   for (let i = 0; i < fullStars; i++) {
  //     stars.push(
  //       <FontAwesomeIcon
  //         key={`full-${i}`}
  //         icon="star"
  //         className="text-red-main h-3"
  //         aria-label="Estrella completa"
  //       />
  //     );
  //   }

  //   if (hasHalfStar) {
  //     stars.push(
  //       <FontAwesomeIcon
  //         key="half"
  //         icon="star-half-alt"
  //         className="text-red-main h-3"
  //         aria-label="Media estrella"
  //       />
  //     );
  //   }

  //   for (let i = 0; i < emptyStars; i++) {
  //     stars.push(
  //       <FontAwesomeIcon
  //         key={`empty-${i}`}
  //         icon={['far', 'star']}
  //         className="text-red-main h-3"
  //         aria-label="Estrella vacía"
  //       />
  //     );
  //   }

  //   return stars;
  // };

  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const adjustedPrice = Math.ceil((price * priceFactor) / 100) * 100;

  // Función para verificar si el producto tiene ingredientes agotados
  // const hasUnavailableIngredients = () => {
  //   const ingredients = productIngredients[name] || [];
  //   // Si no tiene ingredientes o solo tiene strings vacíos, no filtrar
  //   if (
  //     ingredients.length === 0 ||
  //     (ingredients.length === 1 && ingredients[0] === '')
  //   ) {
  //     return false;
  //   }
  //   // Verificar si algún ingrediente está agotado (false)
  //   return ingredients.some(
  //     (ingredient) => ingredient !== '' && itemsOut[ingredient] === false
  //   );
  // };

  const getImageSrc = () => {
    const imgSrc = data?.img || data?.image || img;
    if (!imgSrc) return '/placeholder-product.jpg';
    if (imgSrc.startsWith('https://') || imgSrc.startsWith('data:image/')) {
      return imgSrc;
    }
    return `/menu/${imgSrc}`;
  };

  const imageSrc = getImageSrc();

  // const handleColorClick = (colorIndex, event) => {
  //   event.preventDefault(); // Prevenir navegación del Link
  //   event.stopPropagation(); // Evitar que el evento se propague
  //   setSelectedColor(colorIndex);
  // };

  // const colors = [
  //   { bg: 'bg-red-500', name: 'rojo' },
  //   { bg: 'bg-white', name: 'blanco' },
  //   { bg: 'bg-black', name: 'negro' },
  // ];

  return (
    <div className="group relative flex flex-col rounded-3xl items-center border border-black border-opacity-30 bg-gray-100  transition duration-300 w-full max-w-[400px] text-black z-50 ">
      <div className="absolute right-3.5 top-2.5 z-40">
        <QuickAddToCart
          product={{
            name,
            description,
            price: adjustedPrice,
            img: imageSrc,
            path,
            id,
            category,
            type,
          }}
        />
      </div>

      <Link
        to={`/${slug}/menu/${path}/${id}`}
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

          <img
            src={imageSrc}
            alt={name || 'Producto'}
            className={`object-cover w-full h-full transition-transform duration-300 transform group-hover:scale-105 ${
              isLoaded && !imageError ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => {
              console.log(`✅ Imagen cargada exitosamente para ${name}`);
              setIsLoaded(true);
              setImageError(false);
            }}
            onError={(e) => {
              console.error(
                `❌ Error al cargar imagen para ${name}:`,
                imageSrc
              );
              setImageError(true);
              setIsLoaded(false);
            }}
          />
        </div>
        <div className="flex px-4 flex-col justify-between leading-normal font-coolvetica text-left ">
          <div className="flex mt-4 flex-col w-full items-center justify-center ">
            <h5 className=" text-xl   font-medium  text-center">
              {name || 'Producto sin nombre'}
            </h5>
          </div>
          <p className="text-center text-xs font-light text-opacity-30 text-black">
            {description}
          </p>
          <div className="flex w-full mt-4 items-center  justify-between mb-6">
            {type === 'promo' ? (
              <div className="flex flex-row gap-2 items-baseline">
                <span className="font-bold text-4xl text-black">
                  {currencyFormat(adjustedPrice)}
                </span>
                <p className="font-light line-through opacity-30">
                  {currencyFormat(adjustedPrice * 2)}
                </p>
              </div>
            ) : (
              <span className="font-bold text-4xl text-black">
                {currencyFormat(adjustedPrice)}
              </span>
            )}
            {/* <div className="flex flex-col gap-1 items-end">
              <div className="flex flex-row gap-1">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`${
                      color.bg
                    } h-4 w-4 rounded-full cursor-pointer transition-all duration-200 ${
                      selectedColor === index
                        ? 'border-4 border-gray-500'
                        : 'border border-gray-300'
                    }`}
                    onClick={(e) => handleColorClick(index, e)}
                    title={`Seleccionar color ${color.name}`}
                  />
                ))}
              </div>
              <p className="font-medium text-xs text-gray-500">
                {showConsultStock
                  ? '*Consultar disponibilidad de stock'
                  : `${availableUnits}u. disponibles`}
              </p>
            </div> */}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;
