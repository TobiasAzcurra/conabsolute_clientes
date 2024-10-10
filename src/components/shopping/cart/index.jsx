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
		Swal.fire({
			html: (
				<div>
					<span
						style={{
							color: "black",
							display: "block",
							fontSize: "1.5rem",
							marginBottom: "0.5rem",
						}}
					>
						¿ESTÁS SEGURO?
					</span>
					<span style={{ color: "black", display: "block" }}>
						ESTA ACCIÓN ELIMINARÁ EL ELEMENTO DEL CARRITO.
					</span>
				</div>
			),
			icon: "warning",
			buttonsStyling: false,
			showCancelButton: true,
			iconColor: "#ff0000",
			customClass: {
				title: "font-antonio text-black",
				confirmButton: "text-white bg-red-main p-3 font-antonio",
				cancelButton: "text-white bg-black p-3 m-3 font-antonio",
				container: "font-antonio border-0 rounded-none font-antonio",
			},
			confirmButtonText: "SÍ, ELIMINAR",
			cancelButtonText: "CANCELAR",
		}).then((result) => {
			if (result.isConfirmed) {
				dispatch(removeItem(i));
			}
		});
	};

	const clearAll = () => {
		Swal.fire({
			html: (
				<div>
					<span
						style={{
							color: "black",
							display: "block",
							fontSize: "1.5rem",
							marginBottom: "0.5rem",
						}}
					>
						¿ESTÁS SEGURO?
					</span>
					<span style={{ color: "black", display: "block" }}>
						ESTA ACCIÓN VACIARÁ TODO EL CARRITO.
					</span>
				</div>
			),
			icon: "warning",
			buttonsStyling: false,
			showCancelButton: true,
			iconColor: "#ff0000",
			customClass: {
				title: "font-antonio text-black",
				confirmButton: "text-white bg-red-main p-3 font-antonio",
				cancelButton: "text-white bg-black p-3 m-3 font-antonio",
				container: "font-antonio",
			},
			confirmButtonText: "SÍ, VACIAR",
			cancelButtonText: "CANCELAR",
		}).then((result) => {
			if (result.isConfirmed) {
				dispatch(clearCart());
			}
		});
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
							img={product.img || getDefaultImage(product)}
							name={product.name}
							handleItemClick={() => {}}
							isCart
						/>
					))}
				</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Detalle de la entrega</p>
				<div>Mapa + form</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Método de pago</p>
				<div>Form</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Resumen</p>
				<div>Detalle</div>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Pedir</p>
			</div>
			<div className="flex justify-center flex-col mt-6 items-center">
				<p className="text-2xl font-bold">Imagen</p>
			</div>
		</div>
	);
};

export default CartItems;
