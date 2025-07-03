import React, { useEffect, useState } from "react";
import Items from "../../pages/menu/Items";
import CartCard from "../../components/shopping/cart/CartCard";
import burgers from "../../assets/burgers-v1.json";
import papas from "../../assets/papas-v1.json";
import drinks from "../../assets/drinks-v1.json";
import box from "../../assets/box.png";
import fries from "../../assets/fries.png";
import arrow from "../../assets/arrowIcon.png";
import LoadingPoints from "../../components/LoadingPoints";

const UpdatedPedidoSection = ({
  currentOrder,
  showCancelButton,
  isDeleting,
  handleCancelClick,
}) => {
  const [isModifyOrderExpanded, setIsModifyOrderExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const burgersArray = Object.values(burgers).map((product) => ({
    ...product,
    category: "burger",
  }));

  const papasArray = Object.values(papas).map((product) => ({
    ...product,
    category: "papas",
  }));

  const drinksArray = Object.values(drinks).map((product) => ({
    ...product,
    category: "drinks",
  }));

  const allProducts = [...burgersArray, ...papasArray, ...drinksArray];

  const getDefaultImage = (product) => {
    if (product.category === "burger") {
      return box;
    } else if (product.category === "papas") {
      return fries;
    } else if (product.category === "drinks") {
      return "/menu/coca.png";
    }
    return "/ruta/a/imagen/default.png";
  };

  const getProductImage = (productName) => {
    const product = allProducts.find((p) => p.name === productName);
    return product?.img || null;
  };

  const getProductCategory = (productName) => {
    const product = allProducts.find((p) => p.name === productName);
    return product?.category || "burger";
  };

  const mapOrderItemToCartFormat = (orderItem) => {
    const category = getProductCategory(orderItem.burger);
    const img = getProductImage(orderItem.burger);

    return {
      name: orderItem.burger,
      price: orderItem.priceBurger,
      quantity: orderItem.quantity,
      toppings: orderItem.toppings || [],
      category: category,
      img: img,
      costoBurger: orderItem.costoBurger,
      subTotal: orderItem.subTotal,
      extra: orderItem.extra,
      isConfirmed: orderItem.isConfirmed,
    };
  };

  useEffect(() => {
    // console.log("🧾 Detalle del pedido original:", currentOrder?.detallePedido);
    if (currentOrder?.detallePedido) {
      const mappedItems = currentOrder.detallePedido.map((item) => {
        const mapped = mapOrderItemToCartFormat(item);
        // console.log(`📦 Item mapeado - ${mapped.name}:`, {
        // 	original: item,
        // 	mapped: mapped,
        // });
        return mapped;
      });
      // console.log("✅ Todos los items mapeados:", mappedItems);
    }
  }, [currentOrder]);

  const decrementQuantity = () => {};
  const incrementQuantity = () => {};
  const deleteItem = () => {};

  const toggleModifyOrder = () => {
    setIsModifyOrderExpanded(!isModifyOrderExpanded);
  };

  const onConfirmChanges = async () => {
    setIsConfirming(true);
    try {
      await handleConfirmChanges(currentOrder.id);
      // console.log("✅ Cambios confirmados exitosamente");
    } catch (error) {
      console.error("❌ Error al confirmar los cambios:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center font-coolvetica w-full">
      {/* Pregunta */}
      <div
        className="w-full mt-11 flex-col px-4 flex cursor-pointer"
        onClick={toggleModifyOrder}
      >
        <div className="flex flex-col justify-center items-center">
          <p className="font-bold text-2xl text-center">
            ¡Podes agregar productos!
            <br />
            <p className="text-xs font-medium">
              Por logistica las modificaciones son limitadas y cuando se cocine{" "}
              <br /> esta opcion desaparece.
            </p>
            <br />
          </p>
        </div>
      </div>

      <img
        src={arrow}
        className={`h-2 w-1.5 transform ${
          isModifyOrderExpanded ? "-rotate-90" : "arrow-bounce"
        }`}
        alt=""
      />

      {/* Expanded content */}
      {isModifyOrderExpanded && (
        <>
          <div
            className="flex flex-col md:flex-row gap-2 w-full mt-12 overflow-x-auto custom-scrollbar"
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex flex-col md:flex-row px-4 gap-2 md:w-max">
              <p className="text-xl px-4 font-bold text-center mx-auto mb-2">
                Tu pedido:
              </p>
              {currentOrder?.detallePedido?.map((item, index) => (
                <CartCard
                  key={index}
                  item={mapOrderItemToCartFormat(item)}
                  index={index}
                  getDefaultImage={getDefaultImage}
                  decrementQuantity={decrementQuantity}
                  isPedidoComponente={true}
                  incrementQuantity={incrementQuantity}
                  deleteItem={deleteItem}
                  currentOrder={currentOrder}
                  readOnly={false}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center flex-col mt-6 items-start w-full ">
            {currentOrder?.detallePedido?.some((item) => item.extra) ? (
              <p className="text-xl px-4 font-bold text-center mx-auto mb-4">
                ¿Algo más? Jajaj
              </p>
            ) : (
              <p className="text-xl px-4 font-bold text-center mx-auto mb-4">
                Enorgullece a Anhelo. Agrega algo:
              </p>
            )}

            <div
              className="flex gap-2 pl-4 pr-4 overflow-x-auto overflow-y-hidden custom-scrollbar"
              style={{
                maxHeight: "300px",
                paddingBottom: "1rem",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                width: "100%",
              }}
            >
              <div className="flex gap-2" style={{ width: "max-content" }}>
                {[...papasArray, ...drinksArray, ...burgersArray]
                  .filter(
                    (product) =>
                      !currentOrder?.detallePedido?.some(
                        (item) => item.burger === product.name
                      )
                  )
                  .map((product, index) => (
                    <Items
                      key={product.id || index}
                      selectedItem={product}
                      img={
                        product.img
                          ? `/menu/${product.img}`
                          : getDefaultImage(product)
                      }
                      name={product.name}
                      handleItemClick={() => {
                        // console.log("🛍️ Selected product:", product);
                      }}
                      isCart={false}
                      price={product.price}
                      isPedidoComponente={true}
                      currentOrder={currentOrder}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Confirm Changes Button
					{currentOrder?.onEditByUser && (
						<div className="fixed bottom-0 w-full px-4 p-4 border-t border-opacity-20 border-black  bg-gray-50 ">
							<div
								onClick={onConfirmChanges}
								className={`bg-green-500 w-full text-gray-100 font-coolvetica text-center justify-center h-20 flex items-center text-2xl rounded-3xl font-bold shadow-lg ${
									isConfirming
										? "opacity-50 cursor-not-allowed"
										: "cursor-pointer"
								}`}
							>
								{isConfirming ? (
									<LoadingPoints color="text-gray-100" />
								) : (
									<div className="flex gap-2 items-center">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="h-6"
										>
											<path
												fillRule="evenodd"
												d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
												clipRule="evenodd"
											/>
										</svg>
										Confirmar extras
									</div>
								)}
							</div>
						</div>
					)} */}
        </>
      )}

      <style>
        {`
					@keyframes bounce {
						0%, 100% {
							transform: translateY(0) rotate(90deg);
						}
						50% {
							transform: translateY(3px) rotate(90deg);
						}
					}

					.arrow-bounce {
						animation: bounce 1.5s ease-in-out infinite;
					}

					.custom-scrollbar::-webkit-scrollbar {
						height: 8px;
					}
					.custom-scrollbar::-webkit-scrollbar-track {
						background: #f3f4f6;
					}
					.custom-scrollbar::-webkit-scrollbar-thumb {
						background: #f3f4f6;
						border-radius: 10px;
						border: 2px solid transparent;
						background-clip: padding-box;
					}
					.custom-scrollbar {
						scrollbar-width: thin;
						scrollbar-color: #f3f4f6 #f3f4f6;
					}
				`}
      </style>
    </div>
  );
};

export default UpdatedPedidoSection;
