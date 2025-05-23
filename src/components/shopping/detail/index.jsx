import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toppings from "../../../assets/toppings-v1.json";
import { addItem } from "../../../redux/cart/cartSlice";
import currencyFormat from "../../../helpers/currencyFormat";
import ArrowBack from "../../back";
import logo from "../../../assets/anheloTMwhite.png";
import satisfyerPic from "../../../assets/satisfyerPic.png";
import masterpiecesPic from "../../../assets/djPic.png";
import originalsPic from "../../../assets/masterpiecesPic.png";
import friesPic from "../../../assets/friesPic.png";
import QuickAddToCart from "../card/quickAddToCart";
import VideoSlider from "./VideoSlider";
import { listenToAltaDemanda } from "../../../firebase/readConstants";

const toppingPrice = 300;
const toppingsArray = Object.values(toppings);
const toppingsFree = toppingsArray.filter((t) => t.price === 0);
const toppings100 = toppingsArray.filter((t) => t.price === toppingPrice);

const DetailCard = ({ products, type }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [disable, setDisable] = useState(false);
  const [dataTopping, setDataTopping] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [altaDemanda, setAltaDemanda] = useState(null);
  const [itemsOut, setItemsOut] = useState({});
  const cart = useSelector((state) => state.cartState.cart);

  // Escucha cambios en alta demanda
  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemandaData) => {
      setAltaDemanda(altaDemandaData);
      setItemsOut(altaDemandaData.itemsOut); // Usar altaDemandaData directamente
    });

    return () => unsubscribe();
  }, []);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return <div>Producto no encontrado.</div>;
  }

  // Función para capitalizar cada palabra con solo la primera letra en mayúscula
  const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Arreglo de dependencias vacío

  const handleToppingChange = (event) => {
    const toppingName = event.target.value;
    const isChecked = event.target.checked;

    const selectedTopping = toppingsArray.find((t) => t.name === toppingName);

    if (selectedTopping) {
      if (isChecked) {
        setDataTopping((prevToppings) => [...prevToppings, selectedTopping]);
      } else {
        setDataTopping((prevToppings) =>
          prevToppings.filter((item) => item.name !== selectedTopping.name)
        );
      }
    }
  };

  // Calcula el precio total incluyendo toppings pagados y priceFactor
  const totalPrice = useMemo(() => {
    const basePrice = product.price;
    const toppingsCost = dataTopping
      .filter((t) => t.price > 0)
      .reduce((acc, t) => acc + t.price, 0);

    const priceFactor = altaDemanda?.priceFactor || 1;

    // Aplicamos la misma fórmula de redondeo que en los otros componentes
    return Math.ceil(((basePrice + toppingsCost) * priceFactor) / 100) * 100;
  }, [product.price, dataTopping, altaDemanda?.priceFactor]);

  const getImageForType = (type) => {
    switch (type) {
      case "satisfyer":
        return satisfyerPic;
      case "our":
        return masterpiecesPic;
      case "originals":
        return originalsPic;
      case "papas":
        return friesPic;
      default:
        return masterpiecesPic;
    }
  };

  const getObjectPositionForType = (type) => {
    return type === "originals" ? "object-center" : "object-bottom";
  };

  const productIngredients = {
    // Promociones 2x1
    "2x1 Cuadruple Cheeseburger": [""],
    "2x1 Anhelo Classic": ["anhelo", "tomate", "lechuga"],
    "2x1 BCN Cheeseburger": ["anhelo", "bacon"],
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
    const ingredients = productIngredients[product.name] || []; // Cambiar name por product.name
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

  console.log("acaa", product);
  console.log("acaa2", hasUnavailableIngredients());

  return (
    <div>
      <div className="flex flex-col ">
        {/* <ArrowBack /> */}
        <div className="flex flex-col pt-8 md:pt-6 justify-items-center items-center ">
          <h4 className="font-coolvetica font-bold text-4xl sm:text-6xl text-black text-center px-4 leading-9 ">
            {capitalizeWords(product.name)}
          </h4>
          <p className="font-coolvetica  px-4 text-xs w-full mt-1 font-bold text-center">
            {product.description}
          </p>
          {/* Select para elegir toppings */}
          {product.type === "originals" && (
            <div className="flex flex-col mt-2 items-center">
              {toppingsArray.map((topping) => (
                <label
                  key={topping.name}
                  className="flex items-center mb-2 cursor-pointer"
                >
                  {/* Checkbox oculto */}
                  <input
                    type="checkbox"
                    value={topping.name}
                    onChange={handleToppingChange}
                    className="hidden peer"
                    checked={dataTopping.some((t) => t.name === topping.name)}
                  />
                  {/* Checkbox personalizado */}
                  <span
                    className="relative w-6 h-6 mr-3 border border-gray-400 rounded-full flex-shrink-0 
                                               peer-checked:bg-black peer-checked:border-transparent 
                                               transition-colors duration-200 ease-in-out
                                               
                                               
                                               flex items-center justify-center"
                  >
                    {/* Icono de check, visible solo cuando está seleccionado */}
                    {dataTopping.some((t) => t.name === topping.name) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-gray-100"
                      >
                        <path
                          fillRule="evenodd"
                          d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                  {/* Texto del topping */}
                  <p className="font-bold font-coolvetica text-black text-xs">
                    {capitalizeWords(topping.name)}:{" "}
                    {topping.price === 0
                      ? "Gratis"
                      : currencyFormat(topping.price)}
                  </p>
                </label>
              ))}
            </div>
          )}
          <div className="w-full h-[300px] mt-8 flex items-center justify-center">
            <img
              className="max-w-full sm:w-full md:w-auto h-[300px] object-cover object-center"
              src={`/menu/${product.img}`}
              alt={product.name}
            />
          </div>
          <div className="flex flex-col items-center mb-8 mt-8 gap-2">
            {/* Pasa el producto al QuickAddToCart */}
            {hasUnavailableIngredients() ? (
              <div className="bg-red-main -mt-4 -mb-5 flex flex-row items-center gap-2 font-coolvetica font-medium text-white rounded-3xl p-4 text-4xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-6"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Agotado
              </div>
            ) : (
              <QuickAddToCart
                product={product}
                toppings={dataTopping}
                calculatedPrice={totalPrice} // Agregar esta prop
              />
            )}

            <p className="mt-4 px-4 text-center font-coolvetica text-xs text-black">
              Por <strong>{currencyFormat(totalPrice)}</strong>.{" "}
              {product.type === "satisfyer"
                ? "La versión accesible de Anhelo, para que puedas pedir más en todo momento."
                : product.type === "originals"
                ? "Anhelo, creado por vos. Tu burger ideal."
                : product.type === "our"
                ? "Nuestras mejores combinaciones. Obras de arte."
                : ""}
            </p>
          </div>
        </div>
        <div className="bg-black flex flex-col md:flex-row ">
          <div className="md:flex md:flex-row md:mx-auto md:py-4 md:gap-8">
            {/* imagen por cada tipo */}
            <div className="flex flex-col  ">
              <div className="relative w-full h-[300px] overflow-hidden">
                <img
                  src={getImageForType(
                    product.type ? product.type : product.category
                  )}
                  className={`w-full h-full object-cover ${getObjectPositionForType(
                    product.type ? product.type : product.category
                  )}`}
                  alt=""
                />
                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent"></div>
              </div>
              <p className="text-end text-gray-100/50 text-xs font-coolvetica pt-2 pr-4">
                Si esta <span className="text-gray-100">dedicacion</span>{" "}
                ponemos en la pagina,
                <br />
                imaginate en las <span className="text-gray-100">burgers.</span>
              </p>
            </div>
            {/* Reels */}
            <div className="flex flex-col ">
              <p className="text-2xl mt-6 pl-4 md:pl-0 pr-12 mb-4 text-left font-coolvetica text-gray-100 font-bold">
                <span className="opacity-50">Por que todos quedan</span>{" "}
                pidiendo más:
              </p>

              <VideoSlider />
            </div>
            {/* Logo */}
            <div className="flex flex-col  mt-32 items-center mx-auto mb-16 md:my-auto justify-center">
              <img src={logo} className="h-6 mb-1" alt="Logo de Anhelo" />
              <p className="text-gray-100 font-bold text-xs font-coolvetica">
                Vas a pedir más.
              </p>
            </div>
          </div>
        </div>
      </div>
      {cart.length > 0 && <div className="w-full h-20 bg-black"></div>}
    </div>
  );
};

export default DetailCard;
