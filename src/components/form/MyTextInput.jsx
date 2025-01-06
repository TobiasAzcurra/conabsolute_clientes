import { ErrorMessage, useField } from "formik";

const MyTextInput = ({ ...props }) => {
	const [field, meta] = useField(props);
	// Obtenemos meta para poder verificar si hay error y si el campo fue tocado

	return (
		<div className="rounded-r-3xl rounded-3xl w-full">
			<input
				{...field}
				{...props}
				className={`${props.className} transition-all duration-300 ${
					meta.error && meta.touched ? "h-12" : "h-10"
				}`}
			/>
		</div>
	);
};

export default MyTextInput;
