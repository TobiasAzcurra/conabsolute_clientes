import { ErrorMessage, useFormikContext } from "formik";

const MyRadioGroup = ({ name, options }) => {
	const { values, setFieldValue } = useFormikContext();

	return (
		<div className="flex flex-col w-full">
			<div className="flex flex-row">
				{options.map((option) => (
					<div
						key={option.value}
						className={`p-2 font-antonio text-xs  mb-2 md:w-6/12 w-full gap-1 ${
							values[name] === option.value ? "bg-red-main " : "bg-gray-300"
						}`}
						onClick={() => {
							setFieldValue(name, option.value);
						}}
					>
						<input
							type="radio"
							value={option.value}
							checked={option.value === option.value}
							id={option.value}
							name={name}
							className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 
  ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 hidden"
							onChange={(event) => form.setFieldValue(name, option.value)}
						/>
						<label
							htmlFor={option.value}
							className="w-full py-4  text-xs font-medium text-gray-900 text-black-500"
						>
							{option.label}
						</label>
					</div>
				))}
			</div>
			<ErrorMessage
				name={name}
				component="span"
				className=" text-sm text-red-main font-antonio font-light"
			/>
		</div>
	);
};
export default MyRadioGroup;
