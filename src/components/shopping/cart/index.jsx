import { useSelector, useDispatch } from "react-redux";
import { addOneItem, removeOneItem } from "../../../redux/cart/cartSlice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useClient } from "../../../contexts/ClientContext";
import Items from "../../../pages/menu/Items";
import CartCard from "./CartCard";
import FormCustom from "../../form";
import { getImageSrc } from "../../../helpers/getImageSrc";
import VideoSlider from "../detail/VideoSlider";

const CartItems = () => {
  const { cart, total } = useSelector((state) => state.cartState);
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const decrementQuantity = (index, quantity) => {
    if (quantity > 1) {
      dispatch(removeOneItem(index));
    }
  };

  const incrementQuantity = (index) => {
    dispatch(addOneItem(index));
  };

  const deleteItem = (index) => {
    dispatch(removeOneItem(index));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col font-coolvetica overflow-x-hidden">
      <div className="flex justify-center flex-col mt-8 items-center w-full">
        <div className="flex flex-row items-center gap-2">
          <svg
            onClick={handleGoBack}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          <p className="text-2xl font-bold">Tu pedido</p>
        </div>
        <div
          className="flex flex-col md:flex-row gap-1 w-full mt-2 px-4 overflow-x-auto custom-scrollbar"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex flex-col md:flex-row gap-1 md:w-max">
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

      <div className="flex justify-center flex-col mt-8 items-start w-full">
        <p className="text-2xl font-bold mx-auto mb-2">
          {clientAssets?.upsellsTitle || "Elegí lo que más te guste"}
        </p>

        <div className="w-full mb-4">
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
              <div className="flex gap-2" style={{ width: "max-content" }}>
                {productsSorted.map((product, index) => {
                  const productImg = getImageSrc(product);
                  return (
                    <Items
                      key={product.id || index}
                      selectedItem={product} // ✅ Pasar el objeto producto completo
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
              <p className="font-coolvetica text-gray-600 text-center">
                No hay productos destacados disponibles
              </p>
            </div>
          )}
        </div>
      </div>

      <FormCustom cart={cart} total={total} />

      {/* <div className="flex justify-center flex-col mt-[-10px] items-center relative w-full">
        <MovingRibbon angle={0} />
        <img src={carrusel} className="w-full md:hidden" alt="" />
      </div> */}
      <div className="mb-4 mt-12">
        <VideoSlider reels={reels} />
      </div>

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
