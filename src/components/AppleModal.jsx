import React, { useState } from "react";
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
}) => {
	const [feedback, setFeedback] = useState("");

	if (!isOpen) return null;

	const ratingDescriptions = [
		"Selecciona una calificación",
		"Muy malo",
		"Malo",
		"Regular",
		"Bueno",
		"Excelente",
	];

	const StarRating = () => {
		return (
			<div className="mt-4">
				<p className="text-lg text-center font-bold mb-2">
					{ratingDescriptions[currentRating]}
				</p>
				<div className="flex justify-center space-x-2">
					{[1, 2, 3, 4, 5].map((star) => (
						<svg
							key={star}
							xmlns="http://www.w3.org/2000/svg"
							className={`h-10 w-10 cursor-pointer ${
								star <= currentRating ? "text-black" : "text-gray-300"
							}`}
							fill="currentColor"
							viewBox="0 0 24 24"
							stroke="currentColor"
							onClick={() => setCurrentRating(star)}
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
			</div>
		);
	};

	const FeedbackButtons = () => {
		const options =
			currentRating >= 4
				? ["Buen tiempo de entrega", "Buen producto", "Otros"]
				: ["Mal tiempo de entrega", "Mal producto", "Otros"];

		return (
			<div className="mt-14">
				<p className="text-lg font-bold mb-2 text-center">
					{currentRating >= 4 ? "¿Qué salió bien?" : "¿Qué salió mal?"}
				</p>
				<div className="flex flex-col space-y-2">
					{options.map((option) => (
						<button
							key={option}
							onClick={() => setFeedback(option)}
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
				<div className="w-full px-4">
					<div className="text-black mt-2 text-center">{children}</div>
					{isRatingModal && (
						<>
							<StarRating />
							{currentRating > 0 && <FeedbackButtons />}
						</>
					)}
				</div>

				<div className="w-full px-4 ">
					{twoOptions ? (
						<div className="flex justify-center gap-2 mt-8">
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
									onConfirm({ rating: currentRating, feedback });
								} else {
									onClose();
								}
							}}
							className="mt-8 w-full h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold"
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
};

AppleModal.defaultProps = {
	title: "",
	twoOptions: false,
	onConfirm: () => {},
	isLoading: false,
	isRatingModal: false,
	currentRating: 0,
	setCurrentRating: () => {},
};

export default AppleModal;
