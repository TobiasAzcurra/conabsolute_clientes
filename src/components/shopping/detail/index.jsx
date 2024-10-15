import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import toppings from "../../../assets/toppings-v1.json";
import { addItem } from "../../../redux/cart/cartSlice";
import currencyFormat from "../../../helpers/currencyFormat";
import ArrowBack from "../../back";
import logo from "../../../assets/anheloTMwhite.png";
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

	const [product] = products.filter((p) => p.id === id);

	// Función para capitalizar cada palabra con solo la primera letra en mayúscula
	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [window]);

	const handleToppingChange = (event) => {
		const toppingName = event.target.value;
		const isChecked = event.target.checked;

		const selectedTopping = toppingsArray.find((t) => t.name === toppingName);

		if (selectedTopping) {
			if (isChecked) {
				setDataTopping([...dataTopping, selectedTopping]);
			} else {
				setDataTopping(dataTopping.filter((item) => item !== selectedTopping));
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
		setQuantity(quantity + 1);
	};

	const decrementQuantity = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1);
		}
	};

	console.log(product);

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
						<div className="flex flex-col items-center">
							{toppingsArray.map((topping) => (
								<label key={topping.name} className="flex items-center mb-1">
									<input
										type="checkbox"
										value={topping.name}
										onChange={handleToppingChange}
										className="mr-2 bg-black"
									/>
									<p className="font-bold font-coolvetica">
										{capitalizeWords(topping.name)}:{" "}
										{currencyFormat(topping.price)}
									</p>
								</label>
							))}
						</div>
					)}
					<div className="w-full h-[400px] mt-8 flex items-center justify-center">
						<img
							className="w-full max-w-[1000px] h-[400px] object-cover object-center"
							src={`/menu/${product.img}`}
							alt="imagen"
						/>
					</div>
					<div className="flex flex-col items-center mb-8 mt-8 gap-2">
						{/* Pasa el producto al QuickAddToCart */}
						<QuickAddToCart product={product} />
						<p className="mt-4 px-4 text-center font-coolvetica text-xs text-black">
							Por <strong>{currencyFormat(product.price)}</strong>.{" "}
							{product.type === "satisfyer"
								? "La versión accesible de Anhelo, para que puedas pedir más en todo momento."
								: product.type === "originals"
								? "Anhelo creado por vos."
								: product.type === "our"
								? "Nuestras mejores combinaciones."
								: ""}
						</p>
					</div>
				</div>
				<div className="bg-black ">
					<p className="text-2xl mt-8 pl-4 pr-12 mb-4 text-left font-coolvetica text-gray-100 font-bold">
						<span className="opacity-50">Por que todos quedan</span> pidiendo
						mas:
					</p>

					<VideoSlider />
					<div className="flex flex-col mt-32 items-center mx-auto mb-16 justify-center">
						<img src={logo} className="h-6 mb-1" alt="" />
						<p className="text-gray-100 font-bold text-xs font-coolvetica">
							Vas a pedir más.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DetailCard;
