import { Link, useLocation, useParams } from 'react-router-dom';
import QuickAddToCart from '../../components/shopping/card/quickAddToCart';
import { useState } from 'react';
import { listenToAltaDemanda } from '../../firebase/constants/altaDemanda';
import { useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const Items = ({ img, name, currentOrder, isPedidoComponente = false }) => {
  const [priceFactor, setPriceFactor] = useState(1);
  const [itemsOut, setItemsOut] = useState({});

  const { slugEmpresa, slugSucursal } = useClient();

  const { category: selectedItem } = useParams();

  const location = useLocation();

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemanda) => {
      setPriceFactor(altaDemanda.priceFactor);
      setItemsOut(altaDemanda.itemsOut);
    });

    return () => unsubscribe();
  }, []);

  const isCarrito = location.pathname === '/carrito';
  const isSelected = selectedItem === name;

  const borderStyle = isSelected
    ? 'border-2 border-black border-opacity-100'
    : 'border border-black border-opacity-20';

  const className = `flex flex-col items-center ${borderStyle} rounded-3xl bg-gray-50  p-1 transition duration-300 text-black ${
    isCarrito || isPedidoComponente
      ? 'w-[110px]'
      : 'min-w-[110px] max-w-[200px]'
  }`;

  let imageSrc = img;
  if (isCarrito) {
    imageSrc =
      img.startsWith('/menu/') || img.startsWith('http') ? img : `/menu/${img}`;
  }

  const content = (
    <>
      <div className="h-[70px] w-full rounded-t-[20px] overflow-hidden bg-gradient-to-b from-gray-100 via-gray-100 to-gray-300 relative flex justify-center">
        <img
          className="object-cover absolute  h-full w-full"
          src={imageSrc}
          alt={name}
        />
      </div>
      <div
        className={`font-coolvetica text-center ${
          isCarrito || isPedidoComponente
            ? 'flex flex-col items-center justify-between h-[93px]'
            : 'h-[50px]'
        }`}
      >
        <h5 className="mt-1 text-xs font-medium tracking-tight">
          {capitalizeWords(name)}
        </h5>

        {isCarrito && selectedItem && (
          <div className="pb-3">
            {hasUnavailableIngredients() ? (
              <div className="bg-red-500 rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10  gap-2 ">
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
              <div className="bg-red-500 rounded-full w-fit text-white text-xs text-center items-center flex px-4 h-10  gap-2 ">
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
    return <div className={className}>{content}</div>;
  } else {
    return (
      <Link
        className={className}
        to={`/${slugEmpresa}/${slugSucursal}/menu/${name}`}
      >
        {content}
      </Link>
    );
  }
};

export default Items;

// TO DO REVISAR
// const hasUnavailableIngredients = () => {
//     const ingredients = productIngredients[selectedItem.name] || []; // Cambiar name por product.name
//     if (
//       ingredients.length === 0 ||
//       (ingredients.length === 1 && ingredients[0] === '')
//     ) {
//       return false;
//     }
//     return ingredients.some(
//       (ingredient) => ingredient !== '' && itemsOut[ingredient] === false
//     );
//   };

//   const adjustedPrice =
//     Math.ceil((selectedItem?.price * priceFactor) / 100) * 100;

//   // Cuando pasamos el producto a QuickAddToCart, incluimos el precio ajustado
//   const adjustedProduct = {
//     ...selectedItem,
//     price: adjustedPrice,
//   };
