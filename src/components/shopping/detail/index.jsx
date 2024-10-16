import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toppings from "../../../assets/toppings-v1.json";
import { addItem } from "../../../redux/cart/cartSlice";
import currencyFormat from "../../../helpers/currencyFormat";
import ArrowBack from "../../back";
import logo from "../../../assets/anheloTMwhite.png";
import satisfyerPic from "../../../assets/satisfyerPic.png";
import masterpiecesPic from "../../../assets/djPic.png";
import originalsPic from "../../../assets/masterpiecesPic.png";
import friesPic from "../../../assets/friesPic.png";
import QuickAddToCart from "../card/quickAddToCart";
import VideoSlider from "./VideoSlider";

const toppingPrice = 300;
const toppingsArray = Object.values(toppings);
const toppingsFree = toppingsArray.filter((t) => t.price === 0);
const toppings100 = toppingsArray.filter((t) => t.price === toppingPrice);

const DetailCard = ({ products, type }) => {
	const { id } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [disable, setDisable] = useState(false);
	const [dataTopping, setDataTopping] = useState([]);
	const [quantity, setQuantity] = useState(1);
	const cart = useSelector((state) => state.cartState.cart);

	const product = products.find((p) => p.id === id);

	if (!product) {
		return <div>Producto no encontrado.</div>;
	}

	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []); // Arreglo de dependencias vacío

	const handleToppingChange = (event) => {
		const toppingName = event.target.value;
		const isChecked = event.target.checked;

		const selectedTopping = toppingsArray.find((t) => t.name === toppingName);

		if (selectedTopping) {
			if (isChecked) {
				setDataTopping((prevToppings) => [...prevToppings, selectedTopping]);
			} else {
				setDataTopping((prevToppings) =>
					prevToppings.filter((item) => item.name !== selectedTopping.name)
				);
			}
		}
	};

	const addToCart = (name, price, img, category) => {
		setDisable(true);

		const burgerObject = {
			name,
			price,
			img,
			toppings: dataTopping,
			quantity,
			category,
		};

		dispatch(addItem(burgerObject));
		navigate(-1);
	};

	const incrementQuantity = () => {
		setQuantity((prevQuantity) => prevQuantity + 1);
	};

	const decrementQuantity = () => {
		setQuantity((prevQuantity) =>
			prevQuantity > 1 ? prevQuantity - 1 : prevQuantity
		);
	};

	// Calcula el precio total incluyendo toppings pagados
	const totalPrice = useMemo(() => {
		const toppingsCost = dataTopping
			.filter((t) => t.price > 0)
			.reduce((acc, t) => acc + t.price, 0);
		return product.price + toppingsCost;
	}, [product.price, dataTopping]);

	const getImageForType = (type) => {
		switch (type) {
			case "satisfyer":
				return satisfyerPic;
			case "our":
				return masterpiecesPic;
			case "originals":
				return originalsPic;
			case "papas":
				return friesPic;
			default:
				return masterpiecesPic;
		}
	};

	const getObjectPositionForType = (type) => {
		return type === "originals" ? "object-top" : "object-bottom";
	};

	console.log(cart);

	return (
		<div>
			<div className="flex flex-col mx-auto max-w-screen-lg lg:px-0 min-h-screen">
				<ArrowBack />
				<div className="flex flex-col pt-16 justify-items-center items-center ">
					<h4 className="font-coolvetica font-bold text-4xl sm:text-6xl text-black text-center px-4 leading-9 ">
						{capitalizeWords(product.name)}
					</h4>
					<p className="font-coolvetica px-4 text-xs w-full mt-1 text-black text-center">
						{product.description}
					</p>
					{/* Select para elegir toppings */}
					{product.type === "originals" && (
						<div className="flex flex-col mt-2 items-center">
							{toppingsArray.map((topping) => (
								<label
									key={topping.name}
									className="flex items-center mb-2 cursor-pointer"
								>
									{/* Checkbox oculto */}
									<input
										type="checkbox"
										value={topping.name}
										onChange={handleToppingChange}
										className="hidden peer"
										checked={dataTopping.some((t) => t.name === topping.name)}
									/>
									{/* Checkbox personalizado */}
									<span
										className="relative w-6 h-6 mr-3 border border-gray-400 rounded-full flex-shrink-0 
                                               peer-checked:bg-black peer-checked:border-transparent 
                                               transition-colors duration-200 ease-in-out
                                               
                                               
                                               flex items-center justify-center"
									>
										{/* Icono de check, visible solo cuando está seleccionado */}
										{dataTopping.some((t) => t.name === topping.name) && (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="w-4 h-4 text-gray-100"
											>
												<path
													fillRule="evenodd"
													d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
													clipRule="evenodd"
												/>
											</svg>
										)}
									</span>
									{/* Texto del topping */}
									<p className="font-bold font-coolvetica text-black text-xs">
										{capitalizeWords(topping.name)}:{" "}
										{topping.price === 0
											? "Gratis"
											: currencyFormat(topping.price)}
									</p>
								</label>
							))}
						</div>
					)}

					<div className="w-full h-[300px] mt-8 flex items-center justify-center">
						<img
							className="w-full max-w-[1000px] h-[300px] object-cover object-center"
							src={`/menu/${product.img}`}
							alt={product.name}
						/>
					</div>
					<div className="flex flex-col items-center mb-8 mt-8 gap-2">
						{/* Pasa el producto al QuickAddToCart */}
						<QuickAddToCart product={product} toppings={dataTopping} />
						<p className="mt-4 px-4 text-center font-coolvetica text-xs text-black">
							Por <strong>{currencyFormat(totalPrice)}</strong>.{" "}
							{product.type === "satisfyer"
								? "La versión accesible de Anhelo, para que puedas pedir más en todo momento."
								: product.type === "originals"
								? "Anhelo, creado por vos. Tu burger ideal."
								: product.type === "our"
								? "Nuestras mejores combinaciones. Obras de arte."
								: ""}
						</p>
					</div>
					<div className="relative w-full h-[300px] overflow-hidden">
						<img
							src={getImageForType(
								product.type ? product.type : product.category
							)}
							className={`w-full h-full object-cover ${getObjectPositionForType(
								product.type ? product.type : product.category
							)}`}
							alt=""
						/>
						<div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent"></div>
					</div>
				</div>
				<div className="bg-black ">
					<p className="text-end text-gray-100/50 text-xs font-coolvetica pt-2 pr-4">
						Si esta <span className="text-gray-100">dedicacion</span> ponemos en
						la pagina,
						<br />
						imaginate en las <span className="text-gray-100">burgers</span>.
					</p>

					<p className="text-2xl mt-6 pl-4 pr-12 mb-4 text-left font-coolvetica text-gray-100 font-bold">
						<span className="opacity-50">Por que todos quedan</span> pidiendo
						más:
					</p>

					<VideoSlider />
					<div className="flex flex-col mt-32 items-center mx-auto mb-16 justify-center">
						<img src={logo} className="h-6 mb-1" alt="Logo de Anhelo" />
						<p className="text-gray-100 font-bold text-xs font-coolvetica">
							Vas a pedir más.
						</p>
					</div>
				</div>
			</div>
			{cart.length > 0 && <div className="w-full h-20 bg-black"></div>}
		</div>
	);
};

export default DetailCard;
