// AppleModal.jsx
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
	orderProducts, // Array de productos en el pedido
}) => {
	const [ratings, setRatings] = useState({
		tiempo: 0,
		temperatura: 0,
		presentacion: 0,
		pagina: 0,
		comentario: "",
	});

	useEffect(() => {
		if (isOpen) {
			// Inicializar las calificaciones para cada producto
			const initialProductRatings = orderProducts.reduce((acc, product) => {
				acc[product.burger] = 0; // Usamos el nombre del producto como clave
				return acc;
			}, {});

			setRatings({
				tiempo: 0,
				temperatura: 0,
				presentacion: 0,
				pagina: 0,
				comentario: "",
				...initialProductRatings,
			});
		}
	}, [isOpen, orderProducts]);

	if (!isOpen) return null;

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

	const RatingSection = ({ label, category }) => (
		<div className="flex flex-col gap-2">
			<label className="block font-bold">{label}:</label>
			<StarRating
				rating={ratings[category]}
				onRatingChange={(value) =>
					setRatings((prev) => ({ ...prev, [category]: value }))
				}
			/>
		</div>
	);

	const ProductRatingSection = ({ productName }) => (
		<div className="flex flex-col gap-2">
			<label className="block font-bold">{productName}:</label>
			<StarRating
				rating={ratings[productName]}
				onRatingChange={(value) =>
					setRatings((prev) => ({ ...prev, [productName]: value }))
				}
			/>
		</div>
	);

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
						<div className="mt-4 space-y-4">
							{/* Secciones de Calificación Generales */}
							<RatingSection category="tiempo" label="Tiempo" />
							<RatingSection category="temperatura" label="Temperatura" />
							<RatingSection category="presentacion" label="Presentación" />
							<RatingSection category="pagina" label="Página" />

							{/* Secciones de Calificación por Producto */}
							{orderProducts.map((product, index) => (
								<ProductRatingSection
									key={index}
									productName={product.burger}
								/>
							))}

							{/* Comentario */}
							<div className="mb-4">
								<label className="block mb-2 font-bold">Comentario:</label>
								<textarea
									value={ratings.comentario}
									onChange={(e) =>
										setRatings((prev) => ({
											...prev,
											comentario: e.target.value,
										}))
									}
									className="w-full p-2 bg-white border-2 border-black rounded-xl"
									rows={4}
								/>
							</div>
						</div>
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
									onConfirm(ratings);
								} else {
									onClose();
								}
							}}
							className="w-full h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold"
							disabled={
								isRatingModal &&
								// Verificar que todas las calificaciones de productos estén completas
								orderProducts.some((product) => ratings[product.burger] === 0)
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
	orderProducts: PropTypes.array,
};

AppleModal.defaultProps = {
	title: "",
	twoOptions: false,
	onConfirm: () => {},
	isLoading: false,
	isRatingModal: false,
	orderProducts: [],
};

export default AppleModal;
