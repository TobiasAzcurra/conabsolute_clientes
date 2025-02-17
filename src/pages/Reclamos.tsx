import React, { useState } from 'react';
import { searchOrdersByPhone } from '../firebase/getPedido';
import { getFirestore, doc, runTransaction } from "firebase/firestore";

const Reclamos = () => {
    const [formData, setFormData] = useState({
        telefono: '',
        descripcion: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const updateOrderWithComplaint = async (orderId, fecha, descripcionReclamo) => {
        const firestore = getFirestore();
        const [day, month, year] = fecha.split("/");

        // Referencia al documento del día
        const ordersDocRef = doc(firestore, "pedidos", year, month, day);

        console.log(`📝 Iniciando actualización del reclamo para el pedido ID ${orderId} en la fecha ${fecha}`);

        try {
            await runTransaction(firestore, async (transaction) => {
                // 1. Obtener el documento actual
                const docSnapshot = await transaction.get(ordersDocRef);
                if (!docSnapshot.exists()) {
                    throw new Error("No existen pedidos para la fecha especificada.");
                }

                // 2. Encontrar el pedido específico
                const pedidosDelDia = docSnapshot.data()?.pedidos || [];
                const pedidoIndex = pedidosDelDia.findIndex(pedido => pedido.id === orderId);

                if (pedidoIndex === -1) {
                    throw new Error("Pedido no encontrado en los pedidos del día.");
                }

                // 3. Crear el array actualizado de pedidos con la nueva estructura de reclamo
                const pedidosActualizados = [...pedidosDelDia];
                pedidosActualizados[pedidoIndex] = {
                    ...pedidosActualizados[pedidoIndex],
                    reclamo: {
                        descripcion: descripcionReclamo,
                        resuelto: false,
                        fecha: new Date().toISOString()
                    }
                };

                // 4. Actualizar el documento
                transaction.update(ordersDocRef, {
                    pedidos: pedidosActualizados
                });

                console.log(`✅ Reclamo registrado exitosamente para el pedido ID ${orderId}`);
            });

            return true;
        } catch (error) {
            console.error("❌ Error al registrar el reclamo:", error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrder) {
            alert('Por favor selecciona un pedido');
            return;
        }

        setLoading(true);

        try {
            await updateOrderWithComplaint(
                selectedOrder.id,
                selectedOrder.fecha,
                formData.descripcion
            );

            setSubmitted(true);
            setFormData({ telefono: '', descripcion: '' });
            setSelectedOrder(null);
            setSearchResults([]);

            setTimeout(() => setSubmitted(false), 3000);
        } catch (error) {
            console.error('Error al enviar el reclamo:', error);
            alert('Error al enviar el reclamo. Por favor intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = async () => {
        if (formData.telefono.length < 8) return;

        setSearching(true);
        try {
            const orders = await searchOrdersByPhone(formData.telefono);
            setSearchResults(orders);
        } catch (error) {
            console.error("Error al buscar pedidos:", error);
        } finally {
            setSearching(false);
        }
    };

    // Función para mostrar el estado del reclamo si existe
    const renderReclamoStatus = (order) => {
        if (order.reclamo) {
            return (
                <div className="mt-8 p-2 bg-red-50 rounded-lg">
                    <p className="text-red-700"><strong>Reclamo existente:</strong></p>
                    <p className="text-sm text-red-600">{order.reclamo.descripcion}</p>
                    <p className="text-xs text-red-500">
                        Estado: {order.reclamo.resuelto ? 'Resuelto' : 'Pendiente'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-100 py-4 justify-center font-coolvetica flex flex-col">
            <div className="flex items-center flex-col pt-16 px-4">
                {submitted && (
                    <div className="w-full max-w-md bg-black text-white font-coolvetica rounded-3xl p-4 mb-6 text-center">
                        <p className="text-xl">¡Reclamo enviado!</p>
                        <p className="mt-2">Nos contactaremos contigo pronto.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                    <div className="flex flex-col space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                required
                                placeholder="Ingresa tu número de teléfono"
                                className="p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 font-coolvetica flex-1"
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={searching || formData.telefono.length < 8}
                                className="px-4 bg-gray-800 text-white rounded-2xl hover:bg-gray-700 disabled:opacity-50"
                            >
                                {searching ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-coolvetica text-xl text-center">Selecciona el pedido para el reclamo:</h3>
                            {searchResults.map((order) => (
                                <div
                                    key={order.id}
                                    className={`bg-white rounded-lg shadow-md p-4 border relative ${selectedOrder?.id === order.id ? 'border-black' : 'border-gray-200'
                                        } cursor-pointer transition-all`}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <p className='text-4xl font-bold '> ${order.total}</p>
                                    <p className='text-sm mt-1 font-medium  '>En {order.metodoPago} el {order.fecha} a {order.direccion}</p>
                                    <div className={`${order.canceled ? 'bg-red-500' : 'bg-green-500'} w-min text-white px-4 h-10 items-center mt-1 flex rounded-full text-sm`}>
                                        {order.canceled ? 'Cancelado' : 'Entregado'}
                                    </div>
                                    <div className='mt-6'>
                                        <ul className="flex justify-center flex-col items-center">
                                            {order.detallePedido.map((item, index) => (
                                                <li key={index} className='font-medium text-sm'>
                                                    {item.quantity}x {item.burger}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {renderReclamoStatus(order)}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col space-y-2">
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
                        disabled={loading || !selectedOrder}
                        className={`w-full bg-black text-white font-coolvetica text-2xl h-20 rounded-3xl font-bold 
                            ${(loading || !selectedOrder) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'} 
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
            </div >
        </div >
    );
};

export default Reclamos;