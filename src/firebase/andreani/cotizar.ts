import axios from 'axios';

export const cotizarEnvio = async (
  clientConfig: any,
  postalCode: string,
  weight: number,
  volume: number
): Promise<any> => {
  try {
    if (!clientConfig || !postalCode || !weight || !volume) {
      throw new Error(
        'Missing required parameters: clientConfig, postalCode, weight, or volume'
      );
    }

    const logisticConfig = clientConfig.logistics;

    const params = {
      cpDestino: postalCode,
      contrato: logisticConfig.CONTRATO_DOMICILIO,
      cliente: logisticConfig.CODIGO_CLIENTE,
      sucursalOrigen: 'SUCURSAL_ORIGEN',
      'bultos[0][volumen]': volume,
      'bultos[0][kilos]': weight,
    };

    const url =
      process.env.NODE_ENV === 'production'
        ? 'https://apis.andreani.com/v1/tarifas'
        : 'https://apisqa.andreani.com/v1/tarifas';

    const response = await axios.get(url, { params });

    return response.data;
  } catch (error) {
    console.error('Error al cotizar el envío:', error);
    throw error;
  }
};
