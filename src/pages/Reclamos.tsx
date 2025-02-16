import React, { useState } from 'react';
import logo from "../assets/anheloTMblack.png";

const Reclamos = () => {
    const [formData, setFormData] = useState({
        telefono: '',
        descripcion: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
            setLoading(false);
            setFormData({ telefono: '', descripcion: '' });
            setTimeout(() => setSubmitted(false), 3000);
        }, 1000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            <div className="flex items-center flex-col pt-16 px-4">
                <img src={logo} className="w-2/3 mb-8" alt="Logo" />

                {submitted && (
                    <div className="w-full max-w-md bg-black text-white font-coolvetica rounded-3xl p-4 mb-6 text-center">
                        <p className="text-xl">¡Reclamo enviado!</p>
                        <p className="mt-2">Nos contactaremos contigo pronto.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                            </svg>
                            <label className="font-coolvetica text-lg">Teléfono</label>
                        </div>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa tu número de teléfono"
                            className="p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 font-coolvetica"
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
                            </svg>
                            <label className="font-coolvetica text-lg">Descripción del reclamo</label>
                        </div>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Describe tu problema aquí"
                            className="p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 font-coolvetica resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-black text-white font-coolvetica text-2xl h-20 rounded-3xl font-bold 
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'} 
                            transition-colors duration-200 mt-8 flex items-center justify-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                                Enviar Reclamo
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Reclamos;