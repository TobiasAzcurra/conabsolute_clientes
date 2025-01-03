import React, { useState, useEffect } from "react";

const Tooltip = () => {
	const [isVisible, setIsVisible] = useState(false);

	const showTooltip = () => {
		setIsVisible(true);

		const timer = setTimeout(() => {
			setIsVisible(false);
		}, 10000);

		return () => clearTimeout(timer);
	};

	return (
		<div className="relative inline-block">
			{/* Info Icon - Using a more Apple-style icon */}
			<div
				onClick={showTooltip}
				className="cursor-pointer  hover:bg-gray-100 rounded-full transition-colors duration-200"
			>
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
			<div
				className={`
        absolute z-50 w-72  
        transform -transla -translate-y-full
         -top-4
        transition-all duration-200 ease-out
        ${
					isVisible
						? "opacity-100 translate-y-0"
						: "opacity-0 translate-y-2 pointer-events-none"
				}
      `}
			>
				{/* Backdrop blur container */}
				<div
					className="relative bg-black bg-opacity-50 backdrop-blur-sm 
          rounded-2xl shadow-lg border border-gray-200
          overflow-hidden"
				>
					{/* Content */}
					<div className="px-4 py-3">
						<p className="text-xs text-gray-100 leading-relaxed">
							Si valoras la velocidad, esta opcion es para vos: Tu pedido pasa
							al frente de la fila en cocinarse y, en caso de delivery, tu
							cadete sale solo con tu pedido. Si valoras que sea accesible, sin
							marcar esta opcion tu entrega sigue siendo lo mas eficiente
							posible.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Tooltip;
