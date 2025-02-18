import React, { useState } from 'react';
import { searchOrdersByPhone } from '../firebase/getPedido';
import { getFirestore, doc, runTransaction } from "firebase/firestore";
import currencyFormat from '../helpers/currencyFormat';
import arrow from '../assets/arrowIcon.png';
import logo from '../assets/anheloTMblack.png';
import LoadingPoints from '../components/LoadingPoints';
import GiftButton from '../components/reclamos/GiftButton';
import AppleModal from '../components/AppleModal';
import PhoneAutosuggest from '../components/reclamos/PhoneAutosuggest';

const Reclamos = () => {
    const [formData, setFormData] = useState({
        telefono: '',
        descripcion: '',
        alias: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [submittedOrder, setSubmittedOrder] = useState(null);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [isSearchMode, setIsSearchMode] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

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
        if (order.reclamo) {
            setIsModalOpen(true);
            return;
        }

        setError('');
        if (selectedOrder?.id === order.id) {
            setSelectedOrder(null);
        } else {
            setSelectedOrder(order);
        }
    };

    const updateOrderWithComplaint = async (orderId, fecha, descripcionReclamo, alias) => {
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

                if (pedidosDelDia[pedidoIndex].reclamo) {
                    throw new Error("Este pedido ya tiene un reclamo en curso.");
                }

                const pedidosActualizados = [...pedidosDelDia];
                pedidosActualizados[pedidoIndex] = {
                    ...pedidosActualizados[pedidoIndex],
                    reclamo: {
                        descripcion: descripcionReclamo,
                        alias: alias,
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
            setError('Por favor selecciona un pedido');
            return;
        }

        if (selectedOrder.reclamo) {
            setError('Este pedido ya tiene un reclamo en curso');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await updateOrderWithComplaint(
                selectedOrder.id,
                selectedOrder.fecha,
                formData.descripcion,
                formData.alias
            );

            setSubmittedOrder(selectedOrder);
            setSubmitted(true);
            setFormData({ telefono: '', descripcion: '', alias: '' });
            setSelectedOrder(null);
            setSearchResults([]);
            setExpandedOrders(new Set());
            setIsSearchMode(true);
        } catch (error) {
            setError(error.message || 'Error al enviar el reclamo. Por favor intenta nuevamente.');
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
        setError('');
        setHasSearched(true);
        try {
            const orders = await searchOrdersByPhone(formData.telefono);
            setSearchResults(orders);
            setSelectedOrder(null);
            setIsSearchMode(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Error al buscar pedidos:", error);
            setError('Error al buscar pedidos. Por favor intenta nuevamente.');
        } finally {
            setSearching(false);
        }
    };

    const handleReset = () => {
        setIsSearchMode(true);
        setSearchResults([]);
        setSelectedOrder(null);
        setFormData({ telefono: '', descripcion: '', alias: '' });
        setExpandedOrders(new Set());
        setError('');
        setHasSearched(false);
    };

    const renderReclamoStatus = (order) => {
        if (order.reclamo) {
            return (
                <div className='px-4 h-10 items-center mt-1 flex rounded-full text-sm text-red-main bg-red-200'>
                    <p>Reclamo en curso</p>
                </div>
            );
        }
        return null;
    };

    const renderOrdersSection = () => {
        if (!searchResults.length && hasSearched) {
            return (
                <p className="text-black text-center text-xs">No se encontraron pedidos en los últimos 3 días.</p>
            );
        }

        if (!searchResults.length) return null;

        const ordersToShow = selectedOrder ? [selectedOrder] : searchResults;

        return (
            <div className="space-y-2">
                <div className="flex flex-col px-4 mb-2">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-600 absolute top-4 w-min left-4 flex flex-row items-center gap-1 text-left hover:text-gray-800"
                    >
                        <img src={arrow} className="h-2 rotate-180 opacity-60" alt="" />
                        Volver
                    </button>
                    <h3 className={`font-coolvetica text-sm text-center ${selectedOrder ? 'mt-2' : 'mt-2'}`}>
                        {selectedOrder ? 'Pedido seleccionado:' : 'Selecciona el pedido fallido:'}
                    </h3>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mx-4 mb-2">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {ordersToShow.map((order) => (
                    <div
                        key={order.id}
                        className={`bg-gray-100 p-4 rounded-3xl mx-4 border relative 
                            ${selectedOrder?.id === order.id ? 'border-black border-2' : 'border border-black border-opacity-30'}
                            ${order.reclamo ? 'opacity-50' : ''}
                            cursor-pointer transition-all`}
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
                            <div className={`${order.canceled ? 'text-red-main bg-red-200' : 'text-green-500 bg-green-200'}
                                w-min px-4 h-10 bg-gray-200 items-center mt-1 flex rounded-full text-sm`}>
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
                <p className="text-sm text-center text-gray-600">
                    Damos lo mejor de nosotros pero a veces hay cosas que escapan de nuestro control
                    y nos responsabilizamos cuando ocurre! Es nuestro deber con la gente que nos elige ❤️‍🩹
                    <br />En breve te transfieren la compensacion y aca van unos regalos! Esperamos volver a verte!
                </p>
                <GiftButton orderData={submittedOrder} />
            </div>
        );
    }

    console.log('LocalStorage:', localStorage);

    return (
        <div className="bg-gray-100 py-4 min-h-screen justify-center font-coolvetica flex flex-col">
            <div className={`w-full flex flex-col justify-center items-center mb-4 ${selectedOrder ? '' : 'mt-12'}`}>
                <img
                    src={logo}
                    className="w-2/3 flex mx-auto"
                    alt=""
                />
                <p className='font-bold text-xs'>RECLAMOS</p>
            </div>
            <div className="flex items-center flex-col">
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    {isSearchMode && (
                        <div className="mx-4">
                            <PhoneAutosuggest
                                value={formData.telefono}
                                onChange={handleChange}
                                onSearch={handleSearch}
                                searching={searching}
                            />
                        </div>
                    )}


                    {renderOrdersSection()}

                    {selectedOrder && (
                        <div className="flex flex-col px-4 mt-2">
                            <div className="flex flex-row items-center pl-3 border-2 h-10 border-black rounded-full gap-2 w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
                                </svg>

                                <input
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    placeholder="Que paso con tu pedido?"
                                    className="w-full rounded-full outline-none bg-transparent h-10 flex justify-center text-sm"
                                />
                            </div>
                            <div className="flex flex-row mt-2 items-center pl-3 border-2 h-10 border-black rounded-full gap-2 w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6">
                                    <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                                    <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                                    <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                                </svg>

                                <input
                                    name="alias"
                                    value={formData.alias}
                                    onChange={handleChange}
                                    required
                                    placeholder="Un alias por si hay que transferir"
                                    className="w-full rounded-full outline-none bg-transparent h-10 flex justify-center text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedOrder}
                                className={`w-full bg-black text-gray-100 font-coolvetica text-2xl h-20 rounded-3xl font-bold 
                                    ${(loading || !selectedOrder) ? 'opacity-50 cursor-not-allowed' : ''} 
                                    transition-colors duration-200 mt-8 flex items-center justify-center gap-2`}
                            >
                                {loading ? (
                                    <LoadingPoints color="text-gray-100" />
                                ) : (
                                    'Enviar'
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
            <AppleModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setError('');
                }}
                title="Reclamo en curso"
            >
                <p className="text-center">
                    Este pedido ya tiene un reclamo en curso. Por favor, espera a que se resuelva.
                </p>
            </AppleModal>
        </div>
    );
};

export default Reclamos;