// src/components/AppleModal.jsx
import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

const AppleModal = ({ isOpen, onClose, title, children }) => {
	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
			<div className="bg-gray-100 flex flex-col items-center justify-center rounded-3xl shadow-xl w-full font-coolvetica   pb-4 pt-2 relative">
				{/* Título del Modal */}
				{title && (
					<h2 className="text-2xl font-bold px-4 text-black pt-2 border-b border-black border-opacity-20 w-full text-center pb-4">
						{title}
					</h2>
				)}
				<div className="w-full px-4">
					{/* Contenido del Modal */}
					<div className="text-black mt-2 text-center  ">{children}</div>
				</div>

				{/* Botón de confirmación */}
				<div className="w-full px-4">
					<button
						onClick={onClose}
						className=" mt-8 w-full h-20 text-2xl  bg-black text-gray-100 rounded-3xl font-bold "
					>
						Entendido
					</button>
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
};

AppleModal.defaultProps = {
	title: "",
};

export default AppleModal;
