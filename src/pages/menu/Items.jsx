import { Link, useLocation } from "react-router-dom";
import QuickAddToCart from "../../components/shopping/card/quickAddToCart";
import { useState, useEffect } from "react";
import { listenToAltaDemanda } from "../../firebase/readConstants";

const Items = ({
  selectedItem,
  img,
  name,
  currentOrder,
  handleItemClick,
  isPedidoComponente = false,
  isCart = false,
}) => {
  const [priceFactor, setPriceFactor] = useState(1);
  const [itemsOut, setItemsOut] = useState({});
  const [imageError, setImageError] = useState(false);
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
    "2x1 Anhelo Classic": ["anhelo", "tomate", "lechuga"],
    "2x1 BCN Cheeseburger": ["anhelo", "bacon"],
    "2x1 BBQ BCN Cheeseburger": ["bacon", "bbq", "caramelizada"],
    "2x1 Easter Egg": ["anhelo", "huevo", "bacon"],
    "2x1 Anhelo Yummy": ["anhelo", "yummy"],
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
    const ingredients = productIngredients[selectedItem?.name || name] || [];
    if (
      ingredients.length === 0 ||
      (ingredients.length === 1 && ingredients[0] === "")
    ) {
      return false;
    }
    return ingredients.some(
      (ingredient) => ingredient !== "" && itemsOut[ingredient] === false
    );
  };

  const adjustedPrice = selectedItem?.price
    ? Math.ceil((selectedItem.price * priceFactor) / 100) * 100
    : 0;

  // Normalizar el producto para QuickAddToCart
  const adjustedProduct = {
    ...selectedItem,
    name: selectedItem?.name || name || "Producto sin nombre",
    price: adjustedPrice,
    img: img, // Ya viene procesada desde CartItems
    category: selectedItem?.category || selectedItem?.categoria || "default",
    type: selectedItem?.type || "regular",
    data: selectedItem?.data || selectedItem,
  };

  // Función para capitalizar cada palabra
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Verificaciones de estado
  const isCarrito = location.pathname === "/carrito";
  const isSelected = selectedItem === name;

  // Estilos condicionales
  const borderStyle = isSelected
    ? "border-2 border-black border-opacity-100"
    : "border border-black border-opacity-20";

  const className = `flex flex-col items-center ${borderStyle} rounded-3xl bg-gray-100 p-1 transition duration-300 text-black ${
    isCarrito || isPedidoComponente
      ? "w-[110px]"
      : "min-w-[110px] max-w-[200px]"
  }`;

  // 🔥 Función para manejar la URL de imagen correctamente
  const getImageSrc = () => {
    // Si img ya es una URL completa (Firebase Storage), usarla directamente
    if (img && img.startsWith("https://")) {
      console.log(`🖼️ Items usando Firebase Storage para ${name}:`, img);
      return img;
    }

    // Si img ya tiene el prefijo /menu/, usarla tal como está
    if (img && img.startsWith("/menu/")) {
      console.log(
        `📁 Items usando imagen local con prefijo para ${name}:`,
        img
      );
      return img;
    }

    // Si img no tiene prefijo pero no es URL de Firebase, agregarle /menu/
    if (img && !img.startsWith("https://") && !img.startsWith("/")) {
      const localImg = `/menu/${img}`;
      console.log(`📁 Items agregando prefijo local para ${name}:`, localImg);
      return localImg;
    }

    // Si img ya es una ruta absoluta local, usarla directamente
    if (img) {
      console.log(`📄 Items usando imagen como está para ${name}:`, img);
      return img;
    }

    // Fallback
    console.warn(`⚠️ Items: No hay imagen para ${name}, usando placeholder`);
    return "/placeholder-product.jpg";
  };

  const imageSrc = getImageSrc();

  const content = (
    <>
      <div className="h-[70px] w-full rounded-t-3xl overflow-hidden bg-gradient-to-b from-gray-100 via-gray-100 to-gray-300 relative flex justify-center">
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-300 z-10">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500 mx-auto mb-1"
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

        <img
          className={`object-cover absolute h-full w-full transition-opacity duration-300 ${
            imageError ? "opacity-0" : "opacity-100"
          }`}
          src={imageSrc}
          alt={name || "Producto"}
          onLoad={() => {
            console.log(`✅ Items: Imagen cargada para ${name}`);
            setImageError(false);
          }}
          onError={(e) => {
            console.error(
              `❌ Items: Error cargando imagen para ${name}:`,
              imageSrc
            );
            setImageError(true);
          }}
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
          {capitalizeWords(name || selectedItem?.name || "Producto")}
        </h5>

        {(isCarrito || isCart) && selectedItem && (
          <div className="pb-3">
            {hasUnavailableIngredients() ? (
              <div className="bg-red-main rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10 gap-2">
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
              <div className="bg-red-main rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10 gap-2">
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

  if (isCarrito || isPedidoComponente || isCart) {
    // Cuando estás en /carrito o es un item del carrito, renderizar como div
    return <div className={className}>{content}</div>;
  } else {
    // Comportamiento normal con Link
    return (
      <Link
        className={className}
        to={`/menu/${
          selectedItem?.categoria || selectedItem?.category || "productos"
        }/${selectedItem?.id || name}`}
        onClick={() => handleItemClick && handleItemClick(name)}
      >
        {content}
      </Link>
    );
  }
};

export default Items;
