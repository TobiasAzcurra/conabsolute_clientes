import React from "react";

const Toggle = ({ isOn, onToggle }) => {
	const handleClick = (e) => {
		e.preventDefault();
		e.stopPropagation();
		// console.log("Toggle clicked in component");
		onToggle();
	};

	return (
		<button
			type="button"
			className={`w-16 h-10 flex items-center rounded-full p-1 ${isOn ? "bg-black" : "bg-gray-300"
				}`}
			onClick={handleClick}
		>
			<div
				className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? "translate-x-6" : ""
					}`}
			/>
		</button>
	);
};

export default Toggle;
