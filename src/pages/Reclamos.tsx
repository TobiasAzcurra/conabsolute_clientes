import React, { useState } from 'react';

const Reclamos = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        pedido: '',
        descripcion: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí iría la lógica para enviar el reclamo
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="flex flex-col font-coolvetica overflow-x-hidden">
            <div className="flex justify-center flex-col mt-8 items-center w-full px-4">
                <p className="text-2xl font-bold mb-6">Formulario de Reclamos</p>

                {submitted && (
                    <div className="mb-6 w-full max-w-md bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <p className="font-bold">¡Reclamo enviado!</p>
                        <p>Nos contactaremos contigo pronto para resolver tu problema.</p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md space-y-4 bg-gray-50 p-6 rounded-lg shadow-md"
                >




                    <div className="flex flex-col space-y-2">
                        <label className="font-semibold">Teléfono</label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>


                    <div className="flex flex-col space-y-2">
                        <label className="font-semibold">Descripción del reclamo</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors duration-200"
                    >
                        Enviar Reclamo
                    </button>
                </form>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f3f4f6;
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #f3f4f6 #f3f4f6;
        }
      `}</style>
        </div>
    );
};

export default Reclamos;