import React, { useState, useEffect } from "react";
import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { listenToAltaDemanda } from "../../../firebase/readConstants";
import LoadingPoints from "../../LoadingPoints";

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
  const [rating, setRating] = useState(0);
  const [priceFactor, setPriceFactor] = useState(1);
  const [itemsOut, setItemsOut] = useState({});

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemanda) => {
      setPriceFactor(altaDemanda.priceFactor);
      setItemsOut(altaDemanda.itemsOut);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const firestore = getFirestore();
        const burgersRef = collection(firestore, "burgers");
        const snapshot = await getDocs(burgersRef);

        snapshot.docs.forEach((doc) => {
          const burgerData = doc.data();
          if (burgerData.name === name) {
            // Si el rating es menor a 4, establecer 4 o 4.1
            const actualRating = burgerData.rating || 0;
            const adjustedRating =
              actualRating < 4 ? (Math.random() > 0.5 ? 4 : 4.1) : actualRating;
            setRating(adjustedRating);
          }
        });
      } catch (error) {
        console.error("Error al obtener ratings:", error);
      }
    };

    if (path === "burgers") {
      fetchRating();
    }
  }, [name, path, id]);

  const excludedNames = [
    "Coca-Cola (310 ml.)",
    "Fanta de naranja (310 ml.)",
    "Sprite (310 ml.)",
  ];

  const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getImagePosition = (productName) => {
    const imagePositions = {
      "Satisfyer Easter Egg": "65%",
      "Satisfyer BCN Cheeseburger": "40%",
      "Satisfyer ANHELO Classic": "50%",
      "Simple Cheeseburger": "70%",
      "Doble Cheeseburger": "60%",
      "Triple Cheeseburger": "40%",
      "Cuadruple Cheeseburger": "35%",
      "Crispy BCN": "65%",
      "ANHELO Classic": "55%",
      "BCN Cheeseburger": "65%",
      "BBQ BCN Cheeseburger": "55%",
      "Easter Egg": "70%",
      "Mario Inspired": "45%",
      "2x1 BCN Cheeseburger": "85%",
      "2x1 Anhelo Yummy": "95%",
      "Papas Anhelo ®": "50%",
      "Papas con Cheddar ®": "50%",
      "Pote Cheddar": "50%",
    };

    return imagePositions[productName] || "50%";
  };

  const imgPosition = getImagePosition(name);

  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesomeIcon
          key={`full-${i}`}
          icon="star"
          className="text-red-main h-3"
          aria-label="Estrella completa"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon
          key="half"
          icon="star-half-alt"
          className="text-red-main h-3"
          aria-label="Media estrella"
        />
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesomeIcon
          key={`empty-${i}`}
          icon={["far", "star"]}
          className="text-red-main h-3"
          aria-label="Estrella vacía"
        />
      );
    }

    return stars;
  };

  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const adjustedPrice = Math.ceil((price * priceFactor) / 100) * 100;

  const productIngredients = {
    // Promociones 2x1
    // "2x1 Cuadruple Cheeseburger": [""],
    "2x1 Anhelo Classic": ["anhelo", "tomate", "lechuga"],
    "2x1 BCN Cheeseburger": ["anhelo", "bacon"],

    "2x1 Anhelo Yummy": ["anhelo", "yummy"],
    "2x1 BBQ BCN Cheeseburger": ["bacon", "bbq", "caramelizada"],
    "2x1 Easter Egg": ["anhelo", "huevo", "bacon"],
    "2x1 Mario Inspired": ["mayonesa", "mario"],

    // Satisfyers
    "Satisfyer Easter Egg": ["anhelo", "huevo", "bacon"],
    "Satisfyer BCN Cheeseburger": ["anhelo", "bacon"],
    "Satisfyer ANHELO Classic": ["anhelo", "tomate", "lechuga"],

    // Hamburguesas principales
    "Simple Cheeseburger": [""],
    "Doble Cheeseburger": [""],
    "Triple Cheeseburger": [""],
    "Cuadruple Cheeseburger": [""],
    "ANHELO Classic": ["anhelo", "tomate", "lechuga"],
    "BCN Cheeseburger": ["anhelo", "bacon"],
    "BBQ BCN Cheeseburger": ["bacon", "bbq", "caramelizada"],
    "Easter Egg": ["anhelo", "huevo", "bacon"],
    "Mario Inspired": ["mayonesa", "mario"],
  };

  // Función para verificar si el producto tiene ingredientes agotados
  const hasUnavailableIngredients = () => {
    const ingredients = productIngredients[name] || [];
    // Si no tiene ingredientes o solo tiene strings vacíos, no filtrar
    if (
      ingredients.length === 0 ||
      (ingredients.length === 1 && ingredients[0] === "")
    ) {
      return false;
    }
    // Verificar si algún ingrediente está agotado (false)
    return ingredients.some(
      (ingredient) => ingredient !== "" && itemsOut[ingredient] === false
    );
  };

  // Función para obtener la URL de la imagen
  const getImageSrc = () => {
    // 🔥 CLAVE: Priorizar la imagen de Firebase Storage

    // 1. Primero verificar si hay imagen en data.img (Firebase Storage URL)
    if (data?.img && data.img.startsWith("https://")) {
      console.log(
        `🖼️ Usando imagen de Firebase Storage para ${name}:`,
        data.img
      );
      return data.img;
    }

    // 2. Si hay img directamente en el objeto (también de Firebase)
    if (img && img.startsWith("https://")) {
      console.log(`🖼️ Usando imagen directa de Firebase para ${name}:`, img);
      return img;
    }

    // 3. Fallback a imagen local (para productos legacy)
    if (img && !img.startsWith("https://")) {
      console.log(`📁 Usando imagen local para ${name}:`, `/menu/${img}`);
      return `/menu/${img}`;
    }

    // 4. Imagen por defecto si no hay nada
    console.warn(`⚠️ No se encontró imagen para ${name}, usando placeholder`);
    return "/placeholder-product.jpg";
  };

  const imageSrc = getImageSrc();

  return (
    <div className="group relative flex flex-col rounded-3xl items-center border border-black border-opacity-30 bg-gray-100  transition duration-300 w-full max-w-[400px] text-black z-50 ">
      <div className="absolute right-3.5 top-2.5 z-40">
        {hasUnavailableIngredients() ? (
          <div className="bg-red-main rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10  gap-2 ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 "
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clipRule="evenodd"
              />
            </svg>

            <p className="font-coolvetica text-xs">Agotado</p>
          </div>
        ) : (
          <QuickAddToCart
            product={{
              name,
              description,
              price: adjustedPrice,
              img: imageSrc, // Pasar la URL correcta
              path,
              id,
              category,
              type,
            }}
          />
        )}
      </div>

      <Link to={`/menu/${path}/${id}`} className="w-full">
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
            className={`object-cover w-full h-full transition-transform duration-300 transform group-hover:scale-105 ${
              isLoaded && !imageError ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: `center ${imgPosition}` }}
            src={imageSrc}
            alt={name || "Producto"}
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
              {capitalizeWords(name || "Producto sin nombre")}
            </h5>
          </div>
          <p className="text-center text-xs font-light text-opacity-30 text-black">
            {description}
          </p>
          <div className="flex w-full mt-4 items-center  justify-between mb-6">
            {type === "promo" ? (
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
            <div className="flex flex-col items-end">
              <p className="font-medium text-xs text-gray-500">
                2u. disponibles
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;
