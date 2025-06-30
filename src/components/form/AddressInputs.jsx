import { ErrorMessage, Field } from 'formik';
import MyTextInput from './MyTextInput';
import { MapDirection } from './MapDirection';
import AppleErrorMessage from './AppleErrorMessage';
import TimeSelector from './TimeSelector';


const AddressInputs = ({
  values,
  setFieldValue,
  setUrl,
  setValidarUbi,
  setNoEncontre,
}) => {
  return (
    <div className="w-full items-center rounded-3xl border-2 border-black transition-all duration-300 overflow-hidden">
      {values.deliveryMethod === 'delivery' && (
        <>
          {/* Mapa y dirección */}
          <MapDirection
            setUrl={setUrl}
            setValidarUbi={setValidarUbi}
            setNoEncontre={setNoEncontre}
            setFieldValue={setFieldValue}
          />
          <ErrorMessage name="address" component={AppleErrorMessage} />

          {/* Campo referencias */}
          <div className="flex flex-row border-t border-black border-opacity-20 gap-2 pl-3 h-10 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6"
            >
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
            </svg>
            <MyTextInput
              name="references"
              type="text"
              placeholder="¿Referencias sobre la dirección? Ej: Casa de portón negro"
              autoComplete="off"
              className="bg-transparent text-xs font-light px-0 h-10 text-opacity-20 outline-none w-full"
            />
          </div>
        </>
      )}

      {/* Aclaraciones */}
      <div className="flex flex-row justify-between px-3 h-auto items-start border-t border-black border-opacity-20">
        <div className="flex flex-row w-full items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6"
          >
            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
          </svg>
          <MyTextInput
            label="Aclaraciones"
            name="aclaraciones"
            type="text"
            placeholder="¿Aclaraciones sobre el pedido?"
            autoComplete="off"
            className="bg-transparent font-light text-xs px-0 h-10 text-opacity-20 outline-none w-full"
          />
        </div>
      </div>

      {/* Teléfono */}
      <div className="flex flex-col justify-between h-auto items-start border-t border-black border-opacity-20">
        <div className="flex flex-row items-center px-3 gap-2 w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6"
          >
            <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
            <path
              fillRule="evenodd"
              d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
              clipRule="evenodd"
            />
          </svg>
          <MyTextInput
            name="phone"
            type="text"
            placeholder="Tu número de teléfono"
            autoComplete="phone"
            className="bg-transparent text-xs font-light px-0 h-10 text-opacity-20 outline-none w-full"
          />
        </div>
        <div className="w-full">
          <ErrorMessage
            name="phone"
            render={(msg) => <AppleErrorMessage>{msg}</AppleErrorMessage>}
          />
        </div>
      </div>

      {/* Cupón de descuento */}
      <div className="flex flex-row border-t border-black border-opacity-20 gap-2 pl-3 h-10 items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6"
        >
          <path
            fillRule="evenodd"
            d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
            clipRule="evenodd"
          />
        </svg>
        <MyTextInput
          name="couponCode"
          type="text"
          placeholder="¿Tenés un código de descuento?"
          autoComplete="off"
          className="bg-transparent text-xs font-light px-0 h-10 text-opacity-20 outline-none w-full"
        />
      </div>

      {/* Selector de hora: ¿Quieres reservar para más tarde? */}
      {values.deliveryMethod === 'delivery' && (
        <div className="border-t border-black border-opacity-20 px-3">
          <TimeSelector
            selectedHora={values.hora}
            handleChange={() => {}}
            setFieldValue={setFieldValue}
          />
        </div>
      )}
    </div>
  );
};

export default AddressInputs;
