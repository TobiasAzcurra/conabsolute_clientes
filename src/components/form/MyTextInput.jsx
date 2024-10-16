import { ErrorMessage, useField } from "formik";

const MyTextInput = ({ ...props }) => {
	const [field] = useField(props);
	// en el field se encuentra el valor del input, el name, el onChange, onBlur, etc
	//en el meta los errores

	return (
		<div className="rounded-r-3xl rounded-3xl w-full">
			<input {...field} {...props} />

			{/* se puede pasar el className en el ErrorMessage */}
		</div>
	);
};

export default MyTextInput;
