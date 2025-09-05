import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import QuickAddToCart from '../../components/shopping/card/quickAddToCart';
import { useState } from 'react';
import { useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const Items = ({
  img,
  name,
  currentOrder,
  isPedidoComponente = false,
  handleItemClick,
  selectedItem,
}) => {
  const { slugEmpresa, slugSucursal } = useClient();

  const { category: selectedItemParam } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  const isCarrito = location.pathname.includes('/carrito');
  const isSelected = selectedItemParam === name;

  const borderStyle = isSelected
    ? "border-2 border-black border-opacity-100"
    : "border border-black border-opacity-20";

  const className = `flex flex-col items-center ${borderStyle} rounded-3xl bg-gray-50  p-1 transition duration-300 text-black ${
    isCarrito || isPedidoComponente
      ? "w-[110px]"
      : "min-w-[110px] max-w-[200px]"
  }`;

  let imageSrc = img;
  if (isCarrito) {
    imageSrc =
      img.startsWith("/menu/") || img.startsWith("http") ? img : `/menu/${img}`;
  }

  // Console.log para ver la imagen que se va a mostrar
  console.log("Image Source:", imageSrc);

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
            ? "flex flex-col items-center justify-between h-[43px]"
            : "h-[50px]"
        }`}
      >
        <h5 className="mt-1 text-xs font-medium tracking-tight">
          {capitalizeWords(name)}
        </h5>

        {isCarrito && selectedItemParam && (
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
        {isPedidoComponente && selectedItemParam && (
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

  // ✅ Lógica de redirección inteligente
  if (isCarrito || isPedidoComponente) {
    const smartHandleClick = handleItemClick
      ? () => {
          if (isCarrito) {
            const productCategory = selectedItem?.category || 'general';
            const productId =
              selectedItem?.id || selectedItem?.productId || name;
            const productUrl = `/${slugEmpresa}/${slugSucursal}/menu/${productCategory}/${productId}`;
            navigate(productUrl);
          } else {
            handleItemClick();
          }
        }
      : handleItemClick;

    return (
      <div
        className={className + (smartHandleClick ? ' cursor-pointer' : '')}
        onClick={smartHandleClick}
      >
        {content}
      </div>
    );
  } else {
    const category = selectedItem?.category || name;
    const redirectUrl = `/${slugEmpresa}/${slugSucursal}/menu/${category}`;
    return (
      <Link className={className} to={redirectUrl}>
        {content}
      </Link>
    );
  }
};

export default Items;
