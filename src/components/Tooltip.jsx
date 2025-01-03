import React, { useState } from "react";

const Tooltip = () => {
	const [isVisible, setIsVisible] = useState(false);

	const showTooltip = () => {
		setIsVisible(true);

		// Hide tooltip after 3 seconds
		const timer = setTimeout(() => {
			setIsVisible(false);
		}, 3000);

		return () => clearTimeout(timer);
	};

	return (
		<div className="relative inline-block">
			{/* Info Icon */}
			<div onClick={showTooltip} className="cursor-pointer">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					className="h-4 text-black"
				>
					<path
						fillRule="evenodd"
						d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
						clipRule="evenodd"
					/>
				</svg>
			</div>

			{/* Tooltip */}
			{isVisible && (
				<div className="absolute z-50 w-64 px-4 py-2 text-sm text-white bg-black rounded-lg shadow-lg -left-4 -top-16">
					Tu pedido pasa al frente de la fila en cocinarse y tu cadete sale solo
					con tu pedido.
					{/* Arrow */}
					<div className="absolute w-2 h-2 bg-black rotate-45 -bottom-1 left-5"></div>
				</div>
			)}
		</div>
	);
};

export default Tooltip;
