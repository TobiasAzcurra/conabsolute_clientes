import { useState } from 'react';
import MyTextInput from './MyTextInput';
import { MapDirection } from './MapDirection';
const accessToken = import.meta.env.VITE_ACCESS_TOKEN;

const DeliveryDetails = ({ getFieldProps, envio, setAddressValue }) => {
  return (
    <>
      <hr className="my-6 border border-black border-opacity-50 md:w-6/12" />

      <a className="font-antonio mb-2 font-bold text-2xl">DIRECCIÓN:</a>
      <MyTextInput
        label="Dirección"
        name="address"
        type="text"
        placeholder="CALLE Y NÚMERO"
        autoComplete="address-line1"
      />

      {/* <AddressAutofill accessToken={accessToken ?? ''}>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="address"
            className="font-antonio mb-2 font-bold text-2xl"
          >
            DIRECCIÓN:
          </label>
          <input
            className="font-antonio focus:border-none focus:outline-none  bg-gray-300 text-xs p-2 mb-2 text-black md:w-6/12"
            type="text" // Cambiado de "address" a "text"
            id="address"
            name="address"
            onChange={(e) => setAddressValue(e.target.value)} // Actualizar el estado cuando cambia el valor del input
          />
        </div>
      </AddressAutofill> */}
    </>
  );
};

export default DeliveryDetails;
