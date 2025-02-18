import React, { useState } from 'react';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';
import LoadingPoints from '../LoadingPoints';

const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

const generateVouchersAndUpdateOrder = async (orderData) => {
    console.log("Starting voucher generation with order data:", orderData);

    if (!orderData || !orderData.id || !orderData.fecha) {
        console.error("Invalid order data:", orderData);
        throw new Error("Datos del pedido incompletos - Necesario: ID y fecha");
    }

    const firestore = getFirestore();
    const vouchersDocRef = doc(firestore, "vouchers", "Compensaciones");
    const [day, month, year] = orderData.fecha.split("/");
    const ordersDocRef = doc(firestore, "pedidos", year, month, day);

    console.log(`Processing order from date: ${year}/${month}/${day}`);

    try {
        const result = await runTransaction(firestore, async (transaction) => {
            console.log("Starting transaction...");

            // Check vouchers document
            const voucherSnapshot = await transaction.get(vouchersDocRef);
            if (!voucherSnapshot.exists()) {
                console.error("Voucher document not found");
                throw new Error("El documento de compensaciones no existe. Path: vouchers/Compensaciones");
            }
            console.log("Voucher document found");

            const currentData = voucherSnapshot.data();
            console.log("Current voucher data:", {
                currentCodigos: (currentData.codigos || []).length,
                currentUsados: currentData.usados,
                currentCreados: currentData.creados
            });

            // Generate new vouchers
            const newVouchers = Array.from({ length: 5 }, (_, index) => ({
                codigo: generateRandomCode(),
                estado: "disponible",
                num: (currentData.creados || 0) + index + 1
            }));
            console.log("Generated new vouchers:", newVouchers.map(v => v.codigo));

            // Check order document
            const orderSnapshot = await transaction.get(ordersDocRef);
            if (!orderSnapshot.exists()) {
                console.error("Order document not found:", `pedidos/${year}/${month}/${day}`);
                throw new Error(`No existen pedidos para la fecha ${day}/${month}/${year}`);
            }
            console.log("Order document found");

            const pedidosDelDia = orderSnapshot.data()?.pedidos || [];
            const pedidoIndex = pedidosDelDia.findIndex(pedido => pedido.id === orderData.id);

            if (pedidoIndex === -1) {
                console.error("Order not found in document. Order ID:", orderData.id);
                throw new Error("Pedido no encontrado en los pedidos del día");
            }
            console.log("Found order at index:", pedidoIndex);

            // Prepare updates
            const pedidosActualizados = [...pedidosDelDia];
            const currentReclamo = pedidosActualizados[pedidoIndex].reclamo || {};

            pedidosActualizados[pedidoIndex] = {
                ...pedidosActualizados[pedidoIndex],
                reclamo: {
                    ...currentReclamo,
                    gift: newVouchers.map(v => v.codigo)
                }
            };

            // Perform updates
            console.log("Updating vouchers document...");
            transaction.update(vouchersDocRef, {
                codigos: [...(currentData.codigos || []), ...newVouchers],
                creados: (currentData.creados || 0) + 5,
                usados: currentData.usados || 0,
                fecha: new Date().toISOString().split('T')[0],
                titulo: "Compensaciones"
            });

            console.log("Updating order document...");
            transaction.update(ordersDocRef, {
                pedidos: pedidosActualizados
            });

            return { success: true, vouchers: newVouchers };
        });

        console.log("Transaction completed successfully:", result);
        return result;
    } catch (error) {
        console.error("Transaction failed with error:", error);
        throw error;
    }
};

const GiftButton = ({ orderData }) => {
    const [loading, setLoading] = useState(false);

    const handleGiftClick = async () => {
        if (!orderData) {
            alert('No hay datos del pedido disponibles');
            return;
        }

        console.log("Gift button clicked with order data:", orderData);
        setLoading(true);

        try {
            const result = await generateVouchersAndUpdateOrder(orderData);
            console.log("Voucher generation successful:", result);
            alert('¡Vouchers generados con éxito!');
        } catch (error) {
            console.error('Error detallado:', error);
            alert(`Error al generar los vouchers: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGiftClick}
            disabled={loading}
            className='text-4xl w-full z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-20 font-bold'
        >
            {loading ? (
                <LoadingPoints color='text-gray-100' />
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 mr-2">
                        <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
                    </svg>
                    Regalo
                </>
            )}
        </button>
    );
};

export default GiftButton;