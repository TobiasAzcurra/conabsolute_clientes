import { ErrorMessage, useField } from "formik";

const MyTextInput = ({ ...props }) => {
  const [field] = useField(props);
  // en el field se encuentra el valor del input, el name, el onChange, onBlur, etc
  //en el meta los errores

  return (
    <>
      <input {...field} {...props} />
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
