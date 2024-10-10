import { useSelector, useDispatch } from "react-redux";
import currencyFormat from "../../../helpers/currencyFormat";
import {
	addOneItem,
	removeOneItem,
	clearCart,
	removeItem,
} from "../../../redux/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Swal from "sweetalert2";
import Items from "../../../pages/menu/Items";
import box from "../../../assets/box.png";
import fries from "../../../assets/fries.png";
import burgers from "../../../assets/burgers-v1.json";
import combos from "../../../assets/combos.json";
import papas from "../../../assets/papas-v1.json";
import drinks from "../../../assets/drinks-v1.json";

// Agregar la categoría a cada producto
const burgersArray = Object.values(burgers).map((product) => ({
	...product,
	category: "burgers",
}));
const combosArray = Object.values(combos).map((product) => ({
	...product,
	category: "combos",
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
const allProducts = [
	...burgersArray,
	...combosArray,
	...papasArray,
	...drinksArray,
];

export const items = {
	burgers: "burgers",
	combos: "combos",
	papas: "papas",
	bebidas: "bebidas",
};

const CartItems = () => {
	const { cart, total } = useSelector((state) => state.cartState);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	// Hacer console.log de todos los productos disponibles
	useEffect(() => {
		console.log("Todos los productos disponibles:", allProducts);
	}, []);

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
		<div className="flex flex-col font-coolvetica">
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Tu carrito</p>
				<div>Card del carrito</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Agrega. Esto no es para tibios.</p>
				<div className="flex flex-wrap gap-4 justify-center">
					{allProducts.map((product, index) => (
						<Items
							key={product.id || index}
							selectedItem={product}
							img={
								product.img ? `/menu/${product.img}` : getDefaultImage(product)
							}
							name={product.name}
							handleItemClick={() => {}}
							isCart
						/>
					))}
				</div>
			</div>
			{/* ... el resto de tu componente */}
		</div>
	);
};

export default CartItems;
