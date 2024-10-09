import { ErrorMessage, useField } from "formik";

const MyTextInput = ({ ...props }) => {
	const [field] = useField(props);
	// en el field se encuentra el valor del input, el name, el onChange, onBlur, etc
	//en el meta los errores

	return (
		<>
			<input
				className="font-antonio focus:border-none focus:outline-none  bg-gray-300 text-xs p-2 mb-2 text-black md:w-6/12 w-full"
				{...field}
				{...props}
			/>
			<ErrorMessage
				name={props.name}
				component="span"
				className=" text-sm text-red-main font-antonio font-light"
			/>
			{/* se puede pasar el className en el ErrorMessage */}
		</>
	);
};

export default MyTextInput;
