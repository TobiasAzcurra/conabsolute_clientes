import { Link, useLocation } from "react-router-dom";
import QuickAddToCart from "../../components/shopping/card/quickAddToCart";
import { useState } from "react";
import { listenToAltaDemanda } from "../../firebase/readConstants";
import { useEffect } from "react";

const Items = ({
  selectedItem,
  img,
  name,
  currentOrder,
  handleItemClick,
  isPedidoComponente = false,
}) => {
  // Importamos useLocation para obtener la ruta actual
  const [priceFactor, setPriceFactor] = useState(1);
  const [itemsOut, setItemsOut] = useState({});

  const location = useLocation();

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemanda) => {
      setPriceFactor(altaDemanda.priceFactor);
      setItemsOut(altaDemanda.itemsOut);
    });

    return () => unsubscribe();
  }, []);

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
    const ingredients = productIngredients[selectedItem.name] || []; // Cambiar name por product.name
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

  const adjustedPrice =
    Math.ceil((selectedItem?.price * priceFactor) / 100) * 100;

  // Cuando pasamos el producto a QuickAddToCart, incluimos el precio ajustado
  const adjustedProduct = {
    ...selectedItem,
    price: adjustedPrice,
  };

  // Función para capitalizar cada palabra con solo la primera letra en mayúscula
  const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Verificamos si estamos en la ruta /carrito
  const isCarrito = location.pathname === "/carrito";
  // Determinamos si este item está seleccionado
  const isSelected = selectedItem === name;

  // Ajustamos las clases de los estilos dependiendo de si está seleccionado
  const borderStyle = isSelected
    ? "border-2 border-black border-opacity-100"
    : "border border-black border-opacity-20";

  const className = `flex flex-col items-center ${borderStyle} rounded-3xl bg-gray-100 p-1 transition duration-300 text-black ${
    isCarrito || isPedidoComponente ? "w-[110px]" : "w-full max-w-[200px]"
  }`;

  // Ajustamos la fuente de la imagen solo si estamos en /carrito
  let imageSrc = img;
  if (isCarrito) {
    imageSrc =
      img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
  }

  const content = (
    <>
      <div className="h-[70px] w-full rounded-t-3xl overflow-hidden bg-gradient-to-b from-gray-100 via-gray-100 to-gray-300 relative flex justify-center">
        <img
          className="object-cover absolute top-2.5 h-[70px]"
          src={imageSrc}
          alt={name}
        />
      </div>
      <div
        className={`font-coolvetica text-center ${
          isCarrito || isPedidoComponente
            ? "flex flex-col items-center justify-between h-[93px]"
            : "h-[50px]"
        }`}
      >
        <h5 className="mt-1 text-xs font-medium tracking-tight">
          {capitalizeWords(name)}
        </h5>

        {isCarrito && selectedItem && (
          <div className="pb-3">
            {hasUnavailableIngredients() ? (
              <div className="bg-red-main rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10  gap-2 ">
                <p className="font-coolvetica text-xs">Agotado</p>
              </div>
            ) : (
              <QuickAddToCart
                product={adjustedProduct}
                animateFromCenter={true}
              />
            )}
          </div>
        )}
        {isPedidoComponente && selectedItem && (
          <div className="pb-3">
            {hasUnavailableIngredients() ? (
              <div className="bg-red-main rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10  gap-2 ">
                <p className="font-coolvetica text-xs">Agotado</p>
              </div>
            ) : (
              <QuickAddToCart
                product={adjustedProduct}
                animateFromCenter={true}
                isPedidoComponente={isPedidoComponente}
                currentOrder={currentOrder}
              />
            )}
          </div>
        )}
      </div>
    </>
  );

  if (isCarrito || isPedidoComponente) {
    // Cuando estás en /carrito, renderizamos un <div> en lugar de un <Link>
    return <div className={className}>{content}</div>;
  } else {
    // Comportamiento normal cuando no estás en /carrito
    return (
      <Link
        className={className}
        to={`/menu/${name}`}
        onClick={() => handleItemClick(name)}
      >
        {content}
      </Link>
    );
  }
};

export default Items;
