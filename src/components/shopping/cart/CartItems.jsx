// components/shopping/cart/CartItems.js - MIGRADO
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useClient } from "../../../contexts/ClientContext";
import { useCart } from "../../../contexts/CartContext"; // ← NUEVO: Reemplaza Redux
import Items from "../../../pages/menu/Items";
import CartCard from "./CartCard";
import FormCustom from "../../form/FormCustom";
import { getImageSrc } from "../../../helpers/getImageSrc";
import VideoSlider from "../detail/VideoSlider";

const CartItems = () => {
  // ← CAMBIO: Reemplazar Redux con Context
  // OLD: const { cart, total } = useSelector((state) => state.cartState);
  // OLD: const dispatch = useDispatch();
  const { cart, total, removeOneItem, addOneItem, removeItem } = useCart(); // ← NUEVO

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    products,
    productsSorted,
    slugEmpresa,
    slugSucursal,
    clientAssets,
    categories,
    productsByCategory,
  } = useClient();
  const reels = clientAssets?.reels || [];

  const findCategoryWithProducts = () => {
    if (!categories || !productsByCategory) return "default";

    for (const category of categories) {
      const categoryProducts = productsByCategory[category.id];
      if (categoryProducts && categoryProducts.length > 0) {
        return category.id;
      }
    }

    return categories[0]?.id || "default";
  };

  useEffect(() => {
    if (cart.length <= 0 && pathname.includes("/carrito")) {
      const categoryWithProducts = findCategoryWithProducts();
      navigate(`/${slugEmpresa}/${slugSucursal}/menu/${categoryWithProducts}`);
    }
  }, [
    cart.length,
    pathname,
    navigate,
    slugEmpresa,
    slugSucursal,
    categories,
    productsByCategory,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ← CAMBIO: Simplificar funciones (Context las maneja internamente)
  const decrementQuantity = (index, quantity) => {
    if (quantity > 1) {
      removeOneItem(index); // ← Misma función que antes
    }
  };

  const incrementQuantity = (index) => {
    addOneItem(index); // ← Misma función que antes
  };

  const deleteItem = (index) => {
    removeItem(index); // ← Misma función que antes
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col  font-primary  mb-4 overflow-x-hidden">
      <div className="flex flex-col mt-8  w-full">
        {/* header */}
        <div className="flex flex-row items-center px-4  w-fit">
          <svg
            onClick={handleGoBack}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 text-blue-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          <p className="text-xs text-blue-700 font-light ">Volver</p>
        </div>
        <div
          className="flex flex-col md:flex-row gap-1 w-full mt-4 px-4 overflow-x-auto custom-scrollbar"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex flex-col md:flex-row gap-1 pb-4 md:w-max">
            {cart.map((item, index) => (
              <CartCard
                key={item.id || index}
                item={item}
                index={index}
                decrementQuantity={decrementQuantity}
                incrementQuantity={incrementQuantity}
                deleteItem={deleteItem}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Productos destacados */}
      <div className="flex  flex-col  mb-8  w-full">
        <div className="w-full ">
          {productsSorted.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto overflow-y-hidden pl-4 pr-4 custom-scrollbar"
              style={{
                maxHeight: "220px",
                paddingBottom: "1rem",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                width: "100%",
              }}
            >
              <div className="flex gap-1" style={{ width: "max-content" }}>
                {productsSorted.map((product, index) => {
                  const productImg = getImageSrc(product);
                  return (
                    <Items
                      key={product.id || index}
                      selectedItem={product}
                      img={productImg}
                      name={product.name}
                      handleItemClick={() => {}}
                      isCart={true}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center w-full h-20">
              <p className=" font-primary  text-gray-600 text-center">
                No hay productos destacados disponibles
              </p>
            </div>
          )}
          <p className=" font-light border-b border-gray-300 pb-2 ml-4 text-xs text-gray-400 pr-4 ">
            {clientAssets?.upsellsTitle || "Elegí lo que más te guste"}
          </p>
        </div>
      </div>

      {/* ← CAMBIO: cart y total ahora vienen del Context */}
      <FormCustom cart={cart} total={total} />

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6; /* bg-gray-50  */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f3f4f6; /* bg-gray-50  */
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .custom-scrollbar {
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: #f3f4f6 #f3f4f6; /* Firefox */
          }
        `}
      </style>
    </div>
  );
};

export default CartItems;
