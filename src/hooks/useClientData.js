import { useEffect, useState } from 'react';
import { getClientData } from '../firebase/clients/getClientData';

const useClientData = (slug) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);
      const data = await getClientData(slug);
      setClientData(data);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  return { clientData, loading };
};

export default useClientData;
