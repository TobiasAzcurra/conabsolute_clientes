import React from "react";

const Toggle = ({ isOn = false, onToggle }) => {
	return (
		<div
			className={`w-16 h-10 flex items-center rounded-full p-1 cursor-pointer ${
				isOn ? "bg-black" : "bg-gray-300"
			}`}
			onClick={onToggle}
		>
			<div
				className={`bg-gray-100 w-8 h-8 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
					isOn ? "translate-x-6" : ""
				}`}
			/>
		</div>
	);
};

const DemoContainer = () => {
	const [isEnabled, setIsEnabled] = React.useState(false);

	return (
		<div className="p-4">
			<Toggle isOn={isEnabled} onToggle={() => setIsEnabled(!isEnabled)} />
		</div>
	);
};

export default DemoContainer;
