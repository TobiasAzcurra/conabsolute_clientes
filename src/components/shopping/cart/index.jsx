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
import ArrowBack from "../../back";
import Swal from "sweetalert2";
import fire from "../../../assets/icon-fire.gif";
import OrderForm from "../../../pages/order";

const CartItems = () => {
	const { cart, total } = useSelector((state) => state.cartState);
	const navigate = useNavigate();

	const dispatch = useDispatch();

	const deleteItem = (i) => {
		Swal.fire({
			html: ` 
      <div>
        <span style="color: black;  display: block; font-size: 1.5rem; margin-bottom: 0.5rem "> ¿ESTÁS SEGURO? </span>
        <span style="color: black;  display: block">ESTA ACCIÓN ELIMINARÁ EL ELEMENTO DEL CARRITO.</span>
      </div>
      
      `,
			icon: "warning",
			buttonsStyling: false,
			showCancelButton: true,
			iconColor: "#ff0000",
			customClass: {
				title: "font-antonio text-black",
				confirmButton: " text-white bg-red-main p-3 font-antonio",
				cancelButton: " text-white bg-black p-3 m-3 font-antonio",
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
			html: ` 
      <div>
        <span style="color: black;  display: block; font-size: 1.5rem; margin-bottom: 0.5rem "> ¿ESTÁS SEGURO? </span>
        <span style="color: black;  display: block">ESTA ACCIÓN VACIARÁ TODO EL CARRITO.</span>
      </div>
      
      `,
			icon: "warning",
			buttonsStyling: false,
			showCancelButton: true,
			iconColor: "#ff0000",
			customClass: {
				title: "font-antonio text-black",
				confirmButton: " text-white bg-red-main p-3 font-antonio",
				cancelButton: " text-white bg-black p-3 m-3 font-antonio",
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

	return (
		<div className="grid grid-cols-1  ml-4 mr-4 mb-4 sm:grid-cols-2 gap-4 min-h-screen">
			<div className="mt-2">
				<div className="flex  flex-col">
					<ArrowBack />
					<div className="flex flex-col  items-baseline">
						<div className="flex flex-row items-baseline">
							<h2 className="font-antonio font-bold text-6xl text-black text-left ">
								TU PEDIDO
							</h2>
							<a className="font-antonio font-bold text-black text-lg">
								: {currencyFormat(total)}
							</a>
						</div>
						<div className="flex flex-row items-baseline ">
							<h2 className="font-antonio font-bold text-lg text-black  ">
								+ ENVIO
							</h2>
							<a className="font-antonio font-bold text-black text-lg">
								: $2000
							</a>
						</div>
					</div>
					<button
						className="w-full flex flex-row md:w-10/12 justify-center mt-4 py-4 text-white font-bold font-kotch text-xl bg-red-main focus:outline-none hover:bg-black hover:text-red-main  gap-1"
						onClick={() => navigate("/order")}
					>
						continuar
						<img src={fire} className="h-6" />
					</button>
					<button
						onClick={() => clearAll()}
						className="mt-4 flex flex-row items-baseline focus:outline-none"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							className="mr-2"
						>
							<path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z" />
						</svg>
						<h2 className=" text-xs text-black font-bold font-antonio">
							VACIAR
						</h2>
					</button>
				</div>
			</div>
			<div className="mt-4">
				{cart.length > 0 ? (
					<div>
						<div className="flex flex-col gap-4 font-antonio">
							{cart.map((item, i) => (
								<div
									key={i}
									className="flex items-center p-4 gap-4 flex-row  bg-red-main  text-white w-full"
								>
									<img
										className="h-20 mr-4"
										src={`/menu/${item.img}`}
										alt={item.name}
									/>
									<div className="w-full">
										<p className="font-bold mb-2 text-2xl">
											{item.name.toUpperCase()}
										</p>
										{item.toppings.length > 0 ? (
											<div className="toppings-container">
												{item.toppings.map((topping) => (
													<p
														className="text-white mb-2 text-xs"
														key={topping.id}
													>
														{topping.name}
													</p>
												))}
											</div>
										) : (
											<p></p>
										)}
										<p className="text-white font-bold mt-1">
											{currencyFormat(
												(item.price +
													item.toppings.reduce(
														(total, topping) => total + topping.price,
														0
													)) *
													item.quantity
											)}
										</p>
										<div className="ml-auto flex mt-8 justify-between w-full">
											<div>
												<button
													onClick={() => decrementQuantity(i, item.quantity)}
													className="bg-white text-red-main font-bold h-7 w-7"
												>
													-
												</button>
												<span className="font-antonio font-bold mx-4">
													{item.quantity}
												</span>
												<button
													onClick={() => incrementQuantity(i)}
													className="bg-white text-red-main font-bold h-7 w-7"
												>
													+
												</button>
											</div>
											<button
												onClick={() => deleteItem(i)}
												className="text-white hover:text-black focus:outline-none font-mono mr-3"
											>
												X
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<p className="h-screen bg-red-main">Carrito Vacio</p>
				)}
			</div>
			<OrderForm />
		</div>
	);
};

export default CartItems;
