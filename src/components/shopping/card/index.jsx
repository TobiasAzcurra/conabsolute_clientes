import React, { useState, useEffect } from "react";
import QuickAddToCart from "./quickAddToCart";
import currencyFormat from "../../../helpers/currencyFormat";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { listenToAltaDemanda } from "../../../firebase/readConstants";

const Card = ({ name, description, price, img, path, id, category, type }) => {
  const [rating, setRating] = useState(0);
  const [priceFactor, setPriceFactor] = useState(1);

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemanda) => {
      setPriceFactor(altaDemanda.priceFactor);
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

  const adjustedPrice = Math.ceil((price * priceFactor) / 100) * 100;

  return (
    <div className="group relative flex flex-col rounded-3xl items-center border border-black border-opacity-30 bg-gray-100  transition duration-300 w-full max-w-[400px] text-black z-50 ">
      <div className="absolute right-3.5 top-2.5 z-40">
        <QuickAddToCart
          product={{
            name,
            description,
            price: adjustedPrice,
            img,
            path,
            id,
            category,
            type,
          }}
        />
      </div>

      <Link to={`/menu/${path}/${id}`} className="w-full">
        <div className="relative h-[160px] overflow-hidden rounded-t-3xl w-full">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
              <span className="text-gray-400 text-sm">Cargando...</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-400 via-transparent to-transparent opacity-50"></div>
          <img
            className={`object-cover w-full h-full transition-transform duration-300 transform group-hover:scale-105 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: `center ${imgPosition}` }}
            src={`/menu/${img}`}
            alt={name}
            onLoad={() => setIsLoaded(true)}
          />
        </div>

        <div className="flex px-4 flex-col justify-between leading-normal font-coolvetica text-left ">
          <div className="flex mt-4 flex-col w-full items-center justify-center ">
            <h5 className=" text-xl   font-medium ">{capitalizeWords(name)}</h5>
            <div className="bg-red-main rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10 mb-4 gap-2 mt-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-5 text-white"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clip-rule="evenodd"
                />
              </svg>

              <p>Agotado</p>
            </div>
          </div>
          <p className="text-center text-xs font-light text-opacity-30 text-black">
            {description}
          </p>
          <div className="flex w-full mt-4 items-left justify-between mb-6">
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
            {!excludedNames.includes(name) && rating > 0 && (
              <div className="flex  items-center  gap-4">
                <div className="flex items-center  mb-0.5 gap-0.5">
                  {renderStars(rating)}
                </div>
                <div className="text-sm bg-red-main text-gray-100 h-6 flex items-center text-center justify-center w-9 font-light rounded-md ">
                  {rating.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;
