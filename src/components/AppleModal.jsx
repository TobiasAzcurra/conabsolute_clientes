import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import LoadingPoints from "./LoadingPoints";

const AppleModal = ({
	isOpen,
	onClose,
	title,
	children,
	twoOptions,
	onConfirm,
	isLoading,
	isRatingModal,
	currentRating,
	setCurrentRating,
	orderProducts,
}) => {
	const [feedback, setFeedback] = useState("");
	const [showProductRatings, setShowProductRatings] = useState(false);
	const [productRatings, setProductRatings] = useState({});
	const [customNote, setCustomNote] = useState(""); // Estado para la nota personalizada

	useEffect(() => {
		if (orderProducts && Array.isArray(orderProducts)) {
			const initialRatings = {};
			orderProducts.forEach((product, index) => {
				initialRatings[index] = 0;
			});
			setProductRatings(initialRatings);
		}
	}, [orderProducts]);

	useEffect(() => {
		// Reset states when modal is opened
		if (isOpen) {
			setFeedback("");
			setShowProductRatings(false);
			setProductRatings({});
			setCustomNote(""); // Resetear la nota personalizada
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const ratingDescriptions = [
		"Buscamos mejorar constantemente. Danos una calificacion general:",
		"Muy malo",
		"Malo",
		"Regular",
		"Bueno",
		"Excelente",
	];

	const StarRating = ({ rating, onRatingChange }) => {
		return (
			<div className="flex space-x-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<svg
						key={star}
						xmlns="http://www.w3.org/2000/svg"
						className={`h-6 w-6 cursor-pointer ${
							star <= rating ? "text-black" : "text-gray-300"
						}`}
						fill="currentColor"
						viewBox="0 0 24 24"
						stroke="currentColor"
						onClick={() => onRatingChange(star)}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
						/>
					</svg>
				))}
			</div>
		);
	};

	const FeedbackButtons = () => {
		const options = [
			"Tiempo y Temperatura",
			"Sabor",
			"Presentacion",
			"Página",
			"Otros",
		];

		return (
			<div className="mt-6 ">
				<p className="text-lg font-bold mb-2 text-center">
					{currentRating >= 4 ? "¿Que salió bien?" : "¿Que salió mal?"}
				</p>
				<div className="flex justify-center gap-2 flex-wrap">
					{options.map((option) => (
						<button
							key={option}
							onClick={() => {
								setFeedback(option);
								setShowProductRatings(true); // Mostrar calificaciones de productos
								if (option !== "Otros") {
									setCustomNote(""); // Resetear la nota si no es "Otros"
								}
							}}
							className={`px-4 h-10 rounded-full ${
								feedback === option
									? "bg-black text-white"
									: "bg-gray-200 text-black"
							}`}
						>
							{option}
						</button>
					))}
				</div>
				{feedback === "Otros" && (
					<div className="mt-4">
						<input
							type="text"
							value={customNote}
							onChange={(e) => setCustomNote(e.target.value)}
							placeholder="Escribi tu nota aca..."
							className="w-full p-2 bg-gray-100 border-black border-2 rounded-3xl h-10 px-4"
						/>
					</div>
				)}
			</div>
		);
	};

	const ProductRatings = () => {
		if (!showProductRatings || !orderProducts || !Array.isArray(orderProducts))
			return null;

		return (
			<div className="mt-6">
				<p className="text-lg font-bold mb- text-center">
					Califica los productos
				</p>
				<div className="space-y-4 max-h-60 overflow-y-auto">
					{orderProducts.map((product, index) => (
						<div key={index} className="flex justify-between items-center">
							<span className="text-black font-coolvetica">
								{product.burger}
							</span>
							<StarRating
								rating={productRatings[index] || 0}
								onRatingChange={(rating) =>
									setProductRatings((prev) => ({
										...prev,
										[index]: rating,
									}))
								}
							/>
						</div>
					))}
				</div>
			</div>
		);
	};

	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
			<div className="bg-gray-100 flex flex-col items-center justify-center rounded-3xl shadow-xl w-full max-w-md font-coolvetica pb-4 pt-2 relative">
				{title && (
					<h2 className="text-2xl font-bold px-4 text-black pt-2 border-b border-black border-opacity-20 w-full text-center pb-4">
						{title}
					</h2>
				)}
				<div className="w-full px-4 max-h-[80vh] overflow-y-auto">
					<div className="text-black mt-2 text-center">{children}</div>
					{isRatingModal && (
						<>
							<div className="mt-4">
								<p className="text-lg leading-6 font-bold mb-2 text-center">
									{ratingDescriptions[currentRating]}
								</p>
								<div className="flex justify-center space-x-2">
									<StarRating
										rating={currentRating}
										onRatingChange={setCurrentRating}
									/>
								</div>
							</div>
							{currentRating > 0 && <FeedbackButtons />}
							<ProductRatings />
						</>
					)}
				</div>

				<div className="w-full px-4 mt-6">
					{twoOptions ? (
						<div className="flex justify-center gap-2">
							<button
								onClick={onConfirm}
								className={`w-1/2 h-20 text-2xl flex items-center justify-center bg-black text-gray-100 rounded-3xl font-bold ${
									isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
								}`}
								disabled={isLoading}
							>
								{isLoading ? <LoadingPoints className="h-6 w-6" /> : "Sí"}
							</button>

							<button
								onClick={onClose}
								className="w-1/2 h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold cursor-pointer"
							>
								No
							</button>
						</div>
					) : (
						<button
							onClick={() => {
								if (isRatingModal) {
									onConfirm({
										rating: currentRating,
										feedback,
										productRatings,
										note: customNote, // Incluir la nota personalizada si existe
									});
								} else {
									onClose();
								}
							}}
							className="w-full h-20 text-2xl mt-6 bg-black text-gray-100 rounded-3xl font-bold"
							disabled={
								isRatingModal && (currentRating === 0 || feedback === "")
							}
						>
							{isRatingModal ? "Enviar" : "Entendido"}
						</button>
					)}
				</div>
			</div>
		</div>,
		document.getElementById("modal-root")
	);
};

AppleModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string,
	children: PropTypes.node.isRequired,
	twoOptions: PropTypes.bool,
	onConfirm: PropTypes.func,
	isLoading: PropTypes.bool,
	isRatingModal: PropTypes.bool,
	currentRating: PropTypes.number,
	setCurrentRating: PropTypes.func,
	orderProducts: PropTypes.array,
};

AppleModal.defaultProps = {
	title: "",
	twoOptions: false,
	onConfirm: () => {},
	isLoading: false,
	isRatingModal: false,
	currentRating: 0,
	setCurrentRating: () => {},
	orderProducts: [],
};

export default AppleModal;
