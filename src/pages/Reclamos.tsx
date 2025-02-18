import React, { useState } from 'react';
import { searchOrdersByPhone } from '../firebase/getPedido';
import { getFirestore, doc, runTransaction } from "firebase/firestore";
import currencyFormat from '../helpers/currencyFormat';
import arrow from '../assets/arrowIcon.png'
import logo from '../assets/anheloTMblack.png'
import LoadingPoints from '../components/LoadingPoints';

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
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <div className='px-4 h-10  items-center mt-1 flex rounded-full text-sm text-red-main bg-red-200'>
                    <p >Reclamo en curso</p>
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
                <div className="flex flex-col  px-4 mb-2">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-600  absolute top-4 w-min left-4 flex flex-row items-center gap-1  text-left hover:text-gray-800"
                    >
                        <img src={arrow} className='h-2 rotate-180 opacity-60' alt="" />
                        Volver
                    </button>
                    <h3 className={`font-coolvetica text-sm text-center  ${selectedOrder ? 'mt-2' : 'mt-2'}`}>
                        {selectedOrder ? 'Pedido seleccionado:' : 'Selecciona el pedido fallido:'}
                    </h3>
                </div>
                {ordersToShow.map((order) => (
                    <div
                        key={order.id}
                        className={`bg-gray-100 p-4 rounded-3xl mx-4 border relative ${selectedOrder?.id === order.id ? 'border-black border-2 ' : 'border border-black border-opacity-30'
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
                            <div className={`${order.canceled ? 'text-red-main bg-red-200' : 'text-green-500 bg-green-200'
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

    if (submitted) {
        return (
            <div className="bg-gray-100 px-4 min-h-screen justify-center font-coolvetica flex flex-col items-center">
                <p className="text-2xl text-center font-bold">Reclamo enviado con exito!</p>
                <p className=" text-sm text-center text-gray-600">Damos lo mejor de nosotros pero a veces hay cosas que escapan de nuestro control y nos responsabilizamos cuando ocurre! Es nuestro deber con la gente que nos elige ❤️‍🩹
                    <br />En breve te transfieren la compensacion y aca van unos regalos! Esperamos volver a verte!
                </p>
                <div className='text-4xl w-full z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-20 font-bold'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 mr-2">
                        <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
                    </svg>
                    Regalo

                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 py-4 min-h-screen justify-center font-coolvetica flex flex-col">
            <div className={`w-full flex flex-col justify-center items-center mb-4 ${selectedOrder ? '' : 'mt-12'}`}>

                <img
                    src={logo}
                    className={`w-2/3 flex mx-auto `}
                    alt=""
                />
                <p className='font-bold text-xs'>RECLAMOS</p>
            </div>
            <div className="flex items-center flex-col">
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    {isSearchMode && (
                        <div className=" border-2 border-black  h-10 flex items-center z-50 rounded-full mx-4 ">

                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                required
                                placeholder="Busca tu pedido con tu telefono ej: 3585168275"
                                className="px-4 h-10 rounded-l-full outline-none bg-transparent w-full flex justify-center  text-xs"
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={searching || formData.telefono.length < 8}
                                className=" h-10 w-20 flex items-center justify-center border-l border-black rounded-r-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5">
                                    <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {renderOrdersSection()}

                    {selectedOrder && (
                        <div className="flex flex-col px-4 mt-2">
                            <input
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Que paso con tu pedido?"
                                className="px-4 h-10 rounded-full outline-none bg-gray-100 border-2  flex justify-center  border-black text-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading || !selectedOrder}
                                className={`w-full bg-black text-gray-100 font-coolvetica text-2xl h-20 rounded-3xl font-bold 
                                ${(loading || !selectedOrder) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'} 
                                transition-colors duration-200 mt-8 flex items-center justify-center gap-2`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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