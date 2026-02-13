import React from 'react';
import Absolute from '../assets/isologoAbsolte.png';

const PcBlock = () => (
 <div className="bg-black  font-primary  flex items-center justify-center flex-col h-screen w-screen">
    <img className="h-56" src={Absolute} alt="" />
    <div className="flex flex-col">
      <div className="flex flex-row gap-1">
        <p className="text-gray-50 opacity-50 font-light text-xs">
          Interfaz web
        </p>
        <p className="text-gray-50 font-light text-xs">proximamente,</p>
      </div>
      <p className="text-gray-50 opacity-50 font-light text-xs">
        ingresa por tu celular.
      </p>
    </div>
  </div>
);

export default PcBlock;
