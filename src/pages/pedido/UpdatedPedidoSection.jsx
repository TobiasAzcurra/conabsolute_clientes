import React, { useEffect } from "react";
import Items from "../../pages/menu/Items";
import CartCard from "../../components/shopping/cart/CartCard";
import burgers from "../../assets/burgers-v1.json";
import papas from "../../assets/papas-v1.json";
import drinks from "../../assets/drinks-v1.json";
import box from "../../assets/box.png";
import fries from "../../assets/fries.png";

const UpdatedPedidoSection = ({
	currentOrder,
	showCancelButton,
	isDeleting,
	handleCancelClick,
}) => {
	// Preparar los arrays de productos
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

	// Función para obtener la imagen del producto basada en su nombre
	const getProductImage = (productName) => {
		const product = allProducts.find((p) => p.name === productName);
		return product?.img || null;
	};

	// Función para obtener la categoría del producto basada en su nombre
	const getProductCategory = (productName) => {
		const product = allProducts.find((p) => p.name === productName);
		return product?.category || "burger";
	};

	// Función para convertir los items del pedido al formato esperado por CartCard
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

	// Funciones dummy para mantener la interfaz de CartCard
	const decrementQuantity = () => {};
	const incrementQuantity = () => {};
	const deleteItem = () => {};

	return (
		<div className="flex flex-col font-coolvetica w-full">
			{/* Pedido Items Section */}
			<div className="flex justify-center flex-col mt-8 items-center w-full px-4">
				<p className="text-2xl font-bold">Tu pedido</p>
				<div
					className="flex flex-col md:flex-row gap-2 w-full mt-2 overflow-x-auto custom-scrollbar"
					style={{
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
					}}
				>
					<div className="flex flex-col md:flex-row gap-2 md:w-max">
						{currentOrder?.detallePedido?.map((item, index) => (
							<CartCard
								key={index}
								item={mapOrderItemToCartFormat(item)}
								index={index}
								getDefaultImage={getDefaultImage}
								decrementQuantity={decrementQuantity}
								incrementQuantity={incrementQuantity}
								deleteItem={deleteItem}
								readOnly={true}
							/>
						))}
					</div>
				</div>

				{/* Total Section */}
				{currentOrder && (
					<div className="w-full mt-4 bg-white rounded-xl p-4 shadow-lg">
						<div className="flex justify-between items-center">
							<span className="font-medium">Subtotal:</span>
							<span>${currentOrder.subTotal}</span>
						</div>
						<div className="flex justify-between items-center mt-2">
							<span className="font-medium">Envío:</span>
							<span>${currentOrder.envio}</span>
						</div>
						<div className="flex justify-between items-center mt-2 text-lg font-bold">
							<span>Total:</span>
							<span>${currentOrder.total}</span>
						</div>
					</div>
				)}
			</div>

			{/* Add More Items Section */}
			<div className="flex justify-center flex-col mt-6 items-start w-full px-4">
				<p className="text-2xl font-bold mx-auto mb-4">
					Agrega. Esto no es para tibios.
				</p>
				<div
					className="flex gap-2 overflow-x-auto overflow-y-hidden custom-scrollbar"
					style={{
						maxHeight: "300px",
						paddingBottom: "1rem",
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
						width: "100%",
					}}
				>
					<div className="flex gap-2" style={{ width: "max-content" }}>
						{allProducts
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
										console.log("🛍️ Producto seleccionado:", product);
									}}
									isCart={true}
									price={product.price}
								/>
							))}
					</div>
				</div>
			</div>

			<style>
				{`
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
