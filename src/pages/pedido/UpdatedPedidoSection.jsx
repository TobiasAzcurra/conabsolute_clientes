import React, { useEffect, useState } from "react";
import Items from "../../pages/menu/Items";
import CartCard from "../../components/shopping/cart/CartCard";
import burgers from "../../assets/burgers-v1.json";
import papas from "../../assets/papas-v1.json";
import drinks from "../../assets/drinks-v1.json";
import box from "../../assets/box.png";
import fries from "../../assets/fries.png";
import arrow from "../../assets/arrowIcon.png";

const UpdatedPedidoSection = ({
	currentOrder,
	showCancelButton,
	isDeleting,
	handleCancelClick,
}) => {
	const [isModifyOrderExpanded, setIsModifyOrderExpanded] = useState(false);

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
			extra: orderItem.extra, // Agregamos la propiedad extra aquí
		};
	};

	useEffect(() => {
		console.log("Detalle del pedido:", currentOrder?.detallePedido);
		if (currentOrder?.detallePedido) {
			const mappedItems = currentOrder.detallePedido.map(
				mapOrderItemToCartFormat
			);
			console.log("Items mapeados:", mappedItems);
		}
	}, [currentOrder]);

	const decrementQuantity = () => {};
	const incrementQuantity = () => {};
	const deleteItem = () => {};

	const toggleModifyOrder = () => {
		setIsModifyOrderExpanded(!isModifyOrderExpanded);
	};

	return (
		<div className="flex flex-col justify-center  items-center font-coolvetica w-full">
			{/* Pregunta */}
			<div
				className="w-full mt-11 flex-col  px-4 flex cursor-pointer"
				onClick={toggleModifyOrder}
			>
				<div className="flex flex-col justify-center items-center">
					{/* <svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 "
					>
						<path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
						<path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
					</svg> */}
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
				className={`h-2 w-1.5  transform ${
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

					<div className="flex justify-center flex-col mt-6 items-start w-full">
						<p className="text-xl px-4 font-bold text-center mx-auto mb-4">
							Enorgullese a Anhelo. Agrega algo:
						</p>
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
												console.log("🛍️ Selected product:", product);
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
