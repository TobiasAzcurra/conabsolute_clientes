import { ErrorMessage, useField } from "formik";

const MyTextInput = ({ ...props }) => {
  const [field] = useField(props);
  // en el field se encuentra el valor del input, el name, el onChange, onBlur, etc
  //en el meta los errores

  return (
    <>
      <input {...field} {...props} />

      {/* se puede pasar el className en el ErrorMessage */}
    </>
  );
};

export default MyTextInput;
