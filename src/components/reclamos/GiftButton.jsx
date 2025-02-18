import React, { useState } from 'react';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';

const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

const generateVouchers = async () => {
    const firestore = getFirestore();
    const vouchersDocRef = doc(firestore, "vouchers", "Compensaciones");

    try {
        await runTransaction(firestore, async (transaction) => {
            const docSnapshot = await transaction.get(vouchersDocRef);

            if (!docSnapshot.exists()) {
                throw new Error("El documento de compensaciones no existe");
            }

            const currentData = docSnapshot.data();
            const currentCodigos = currentData.codigos || [];
            const currentUsados = currentData.usados || 0;
            const currentCreados = currentData.creados || 0;

            // Generate 5 new voucher codes
            const newVouchers = Array.from({ length: 5 }, (_, index) => ({
                codigo: generateRandomCode(),
                estado: "disponible",
                [`num`]: currentCreados + index + 1
            }));

            // Update the document
            transaction.update(vouchersDocRef, {
                codigos: [...currentCodigos, ...newVouchers],
                creados: currentCreados + 5,
                usados: currentUsados,
                fecha: new Date().toISOString().split('T')[0],
                titulo: "Compensaciones"
            });
        });

        return true;
    } catch (error) {
        console.error("Error al generar los vouchers:", error);
        throw error;
    }
};

const GiftButton = () => {
    const [loading, setLoading] = useState(false);

    const handleGiftClick = async () => {
        setLoading(true);
        try {
            await generateVouchers();
            alert('¡Vouchers generados con éxito!');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar los vouchers. Por favor intenta nuevamente.');
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
                <div className="flex items-center">
                    <span className="mr-2">Generando...</span>
                </div>
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