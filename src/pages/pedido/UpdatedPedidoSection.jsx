import React, { useEffect } from "react";
import Items from "../../pages/menu/Items";
import burgers from "../../assets/burgers-v1.json";
import papas from "../../assets/papas-v1.json";
import drinks from "../../assets/drinks-v1.json";

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

	// Concatenar todos los productos
	const allProducts = [...burgersArray, ...papasArray, ...drinksArray];

	// Function to get default image based on category
	const getDefaultImage = (product) => {
		if (product.category === "burger") {
			return "/path/to/box.png";
		} else if (product.category === "papas") {
			return "/path/to/fries.png";
		} else if (product.category === "drinks") {
			return "/menu/coca.png";
		}
		return "/path/to/default.png";
	};

	useEffect(() => {
		console.log("🔄 Detalles del pedido actual:", currentOrder?.detallePedido);
		console.log("💰 Total del pedido:", currentOrder?.total);
		console.log("📦 Productos disponibles:", allProducts);
		console.log(
			"🔄 Productos en el pedido:",
			allProducts.filter(
				(product) =>
					!currentOrder?.detallePedido?.some(
						(item) => item.burger === product.name
					)
			)
		);
	}, [currentOrder]);

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
					{currentOrder?.detallePedido?.length > 0 ? (
						currentOrder.detallePedido.map((item, index) => (
							<div
								key={index}
								className="flex flex-col bg-white rounded-lg p-4 shadow-md min-w-[280px]"
							>
								<div className="flex items-center justify-between mb-2">
									<h3 className="font-bold text-lg">{item.burger}</h3>
								</div>
								<div className="flex items-center justify-between mt-2">
									<div className="flex items-center space-x-2">
										<span className="font-medium">
											Cantidad: {item.quantity}
										</span>
									</div>
									<span className="font-bold">${item.subTotal}</span>
								</div>
								{item.toppings && item.toppings.length > 0 && (
									<div className="mt-2 text-sm text-gray-600">
										<p>Toppings:</p>
										<ul className="list-disc pl-4">
											{item.toppings.map((topping, idx) => (
												<li key={idx}>{topping}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						))
					) : (
						<p className="text-gray-500 text-center w-full py-4">
							No hay items en el pedido
						</p>
					)}
				</div>

				{/* Total Section */}
				{currentOrder && (
					<div className="w-full mt-4 bg-white rounded-lg p-4 shadow-md">
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
