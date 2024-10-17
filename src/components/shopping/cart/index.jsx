import { useSelector, useDispatch } from "react-redux";
import {
	addOneItem,
	removeOneItem,
	clearCart,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Items from "../../../pages/menu/Items";
import box from "../../../assets/box.png";
import fries from "../../../assets/fries.png";
import burgers from "../../../assets/burgers-v1.json";
import papas from "../../../assets/papas-v1.json";
import drinks from "../../../assets/drinks-v1.json";
import CartCard from "./CartCard";
import arrow from "../../../assets/arrowIcon.png";
import carrusel from "../../../assets/carrusel3.jpg";
import logo from "../../../assets/anheloTMwhite.png";
import { MapDirection } from "../../form/MapDirection";
import ArrowBack from "../../back";
import MovingRibbon from "../MovingRibbon";
import FormCustom from "../../form";

// Agregar la categoría a cada producto
const burgersArray = Object.values(burgers).map((product) => ({
	...product,
	category: "burgers",
}));

const papasArray = Object.values(papas).map((product) => ({
	...product,
	category: "papas",
}));
const drinksArray = Object.values(drinks).map((product) => ({
	...product,
	category: "bebidas",
}));

// Concatenar todos los productos en un solo array
const allProducts = [...papasArray, ...drinksArray, ...burgersArray];

export const items = {
	burgers: "burgers",
	papas: "papas",
	bebidas: "bebidas",
};

const CartItems = () => {
	const { cart, total } = useSelector((state) => state.cartState);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const deleteItem = (i) => {
		// ... código de Swal.fire para eliminar ítems
	};

	const clearAll = () => {
		// ... código de Swal.fire para vaciar el carrito
	};

	useEffect(() => {
		if (cart.length <= 0) {
			return navigate("/menu");
		}
	}, [cart, navigate]);

	// Desplazar al inicio cuando el componente se monta
	useEffect(() => {
		window.scrollTo({
			top: 0,
			behavior: "smooth", // Opcional: para un desplazamiento suave
		});
	}, []);

	// Agregar  para mostrar el carrito completo
	useEffect(() => {
		console.log("Current cart state:", cart);
	}, [cart]);

	const decrementQuantity = (index, quantity) => {
		if (quantity > 1) {
			dispatch(removeOneItem(index));
		}
	};

	const incrementQuantity = (index) => {
		dispatch(addOneItem(index));
	};

	// Función para obtener la imagen predeterminada basada en la categoría
	const getDefaultImage = (product) => {
		if (product.category === "burgers") {
			return box;
		} else if (product.category === "papas") {
			return fries;
		} else if (product.category === "bebidas") {
			return "/menu/coca.png";
		} else {
			return "/ruta/a/imagen/default.png";
		}
	};

	return (
		<div className="flex flex-col font-coolvetica overflow-x-hidden">
			<div className="flex justify-center flex-col mt-8 items-center w-full">
				<p className="text-2xl font-bold">Tu pedido</p>
				<div
					className="flex flex-col md:flex-row gap-2 w-full mt-2 px-4 overflow-x-auto custom-scrollbar"
					style={{
						scrollBehavior: "smooth",
						WebkitOverflowScrolling: "touch",
					}}
				>
					<div className="flex flex-col md:flex-row gap-2 md:w-max">
						{cart.map((item, index) => (
							<CartCard
								key={item.id || index}
								item={item}
								index={index}
								getDefaultImage={getDefaultImage}
								decrementQuantity={decrementQuantity}
								incrementQuantity={incrementQuantity}
								deleteItem={deleteItem}
							/>
						))}
					</div>
				</div>
			</div>

			<div className="flex justify-center flex-col mt-6 items-start w-full">
				<p className="text-2xl font-bold mx-auto mb-2">
					Agrega. Esto no es para tibios.
				</p>
				<div
					className="flex gap-2 overflow-x-auto overflow-y-hidden pl-4 pr-4 custom-scrollbar"
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
									!cart.some((cartItem) => cartItem.name === product.name)
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
									handleItemClick={() => {}}
									isCart
								/>
							))}
					</div>
				</div>
			</div>

			<FormCustom cart={cart} total={total} />

			<div className="flex justify-center flex-col mt-[-10px] items-center relative w-full">
				<MovingRibbon angle={0} />
				<img src={carrusel} className="w-full mt-28 md:hidden" alt="" />
			</div>

			<style>
				{`
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6; /* bg-gray-100 */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f3f4f6; /* bg-gray-100 */
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
