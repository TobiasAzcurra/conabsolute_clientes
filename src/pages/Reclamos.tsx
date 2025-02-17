import React, { useState } from 'react';
import { searchOrdersByPhone } from '../firebase/getPedido';
import { getFirestore, doc, runTransaction } from "firebase/firestore";
import currencyFormat from '../helpers/currencyFormat';
import arrow from '../assets/arrowIcon.png'

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
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [isSearchMode, setIsSearchMode] = useState(true);

    const toggleOrderDetails = (orderId, event) => {
        event.stopPropagation();
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleOrderSelect = (order) => {
        if (selectedOrder?.id === order.id) {
            setSelectedOrder(null);
        } else {
            setSelectedOrder(order);
        }
    };

    const updateOrderWithComplaint = async (orderId, fecha, descripcionReclamo) => {
        const firestore = getFirestore();
        const [day, month, year] = fecha.split("/");
        const ordersDocRef = doc(firestore, "pedidos", year, month, day);

        try {
            await runTransaction(firestore, async (transaction) => {
                const docSnapshot = await transaction.get(ordersDocRef);
                if (!docSnapshot.exists()) {
                    throw new Error("No existen pedidos para la fecha especificada.");
                }

                const pedidosDelDia = docSnapshot.data()?.pedidos || [];
                const pedidoIndex = pedidosDelDia.findIndex(pedido => pedido.id === orderId);

                if (pedidoIndex === -1) {
                    throw new Error("Pedido no encontrado en los pedidos del día.");
                }

                const pedidosActualizados = [...pedidosDelDia];
                pedidosActualizados[pedidoIndex] = {
                    ...pedidosActualizados[pedidoIndex],
                    reclamo: {
                        descripcion: descripcionReclamo,
                        resuelto: false,
                        fecha: new Date().toISOString()
                    }
                };

                transaction.update(ordersDocRef, {
                    pedidos: pedidosActualizados
                });
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
            setExpandedOrders(new Set());
            setIsSearchMode(true);

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
            setSelectedOrder(null);
            setIsSearchMode(false);
        } catch (error) {
            console.error("Error al buscar pedidos:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleReset = () => {
        setIsSearchMode(true);
        setSearchResults([]);
        setSelectedOrder(null);
        setFormData({ telefono: '', descripcion: '' });
        setExpandedOrders(new Set());
    };

    const renderReclamoStatus = (order) => {
        if (order.reclamo) {
            return (
                <div className='px-4 h-10 bg-gray-200 items-center mt-1 flex rounded-full text-sm bg-red-100'>
                    <p className="text-red-700">Reclamo en curso</p>
                </div>
            );
        }
        return null;
    };

    const renderOrdersSection = () => {
        if (!searchResults.length) return null;

        const ordersToShow = selectedOrder ? [selectedOrder] : searchResults;

        return (
            <div className="space-y-2">
                <div className="flex flex-col  px-4 mb-4">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-600 flex flex-row items-center gap-1  text-left hover:text-gray-800"
                    >
                        <img src={arrow} className='h-2 rotate-180 opacity-60' alt="" />
                        Volver
                    </button>
                    <h3 className="font-coolvetica text-sm mt-4 text-center">
                        {selectedOrder ? 'Pedido seleccionado:' : 'Selecciona el pedido fallido:'}
                    </h3>
                </div>
                {ordersToShow.map((order) => (
                    <div
                        key={order.id}
                        className={`bg-gray-100 p-4 rounded-3xl mx-4 border relative ${selectedOrder?.id === order.id ? 'border-black border-2 shadow-md' : 'border border-black border-opacity-30'
                            } cursor-pointer transition-all`}
                        onClick={() => handleOrderSelect(order)}
                    >
                        <p className='text-4xl font-bold'>{currencyFormat(order.total)}</p>
                        <p className='text-sm text-gray-600 font-medium'>
                            En {order.metodoPago} el {order.fecha} para {
                                order.direccion
                                    ? `enviar a ${order.direccion}`
                                    : 'retirar por Buenos Aires 618, X5800 Río Cuarto, Córdoba, Argentina'
                            }
                        </p>
                        <div className='flex flex-row gap-2'>
                            <div className={`${order.canceled ? 'text-red-500 bg-red-200' : 'text-green-500 bg-green-200'
                                } w-min px-4 h-10 bg-gray-200 items-center mt-1 flex rounded-full text-sm`}>
                                {order.canceled ? 'Cancelado' : 'Entregado'}
                            </div>
                            {renderReclamoStatus(order)}
                        </div>
                        <div className='mt-6'>
                            <button
                                type="button"
                                onClick={(e) => toggleOrderDetails(order.id, e)}
                                className="text-sm text-gray-600 flex flex-row gap-1 font-medium items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4">
                                    <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
                                </svg>
                                <p>Pedido</p>
                                <img
                                    src={arrow}
                                    alt=""
                                    className={`h-2 opacity-70 ml-2 ${expandedOrders.has(order.id) ? '-rotate-90' : 'rotate-90'}`}
                                />
                            </button>
                            {expandedOrders.has(order.id) && (
                                <ul className="flex justify-center flex-col items-left mt-2">
                                    {order.detallePedido.map((item, index) => (
                                        <li key={index} className='font-medium text-sm'>
                                            {item.quantity}x {item.burger}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-100 py-4 min-h-screen justify-center font-coolvetica flex flex-col">
            <div className="flex items-center flex-col">
                {submitted && (
                    <div className="w-full px-4 max-w-md bg-black text-white font-coolvetica rounded-3xl p-4 mb-6 text-center">
                        <p className="text-xl">¡Reclamo enviado!</p>
                        <p className="mt-2">Nos contactaremos contigo pronto.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8">
                    {isSearchMode && (
                        <div className="flex flex-col px-4 space-y-2">
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
                    )}

                    {renderOrdersSection()}

                    {selectedOrder && (
                        <div className="flex flex-col px-4 space-y-2">
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Describe tu problema aquí"
                                className="p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200 font-coolvetica resize-none"
                            />
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
                                    'Enviar'
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Reclamos;