// src/components/AppleModal.jsx
import React from "react";
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
}) => {
	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
			<div className="bg-gray-100 flex flex-col items-center justify-center rounded-3xl shadow-xl w-full max-w-md font-coolvetica pb-4 pt-2 relative">
				{/* Título del Modal */}
				{title && (
					<h2 className="text-2xl font-bold px-4 text-black pt-2 border-b border-black border-opacity-20 w-full text-center pb-4">
						{title}
					</h2>
				)}
				<div className="w-full px-4">
					{/* Contenido del Modal */}
					<div className="text-black mt-2 text-center">{children}</div>
				</div>

				{/* Botones de acción */}
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
							onClick={onClose}
							className="mt-8 w-full h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold"
						>
							Entendido
						</button>
					)}
				</div>
			</div>
		</div>,
		document.getElementById("modal-root") // Asegúrate de tener este div en tu index.html
	);
};

AppleModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string,
	children: PropTypes.node.isRequired,
	twoOptions: PropTypes.bool,
	onConfirm: PropTypes.func,
	isLoading: PropTypes.bool, // Nueva prop para el estado de carga
};

AppleModal.defaultProps = {
	title: "",
	twoOptions: false,
	onConfirm: () => {},
	isLoading: false,
};

export default AppleModal;
