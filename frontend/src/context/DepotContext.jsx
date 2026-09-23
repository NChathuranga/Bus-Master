import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const DepotContext = createContext();

export const DepotProvider = ({ children }) => {
  const [depots, setDepots] = useState([]);
  const [activeDepot, setActiveDepotState] = useState(() => {
    return localStorage.getItem('activeDepotId') || 'all';
  });

  const fetchDepots = async () => {
    try {
      const { data } = await api.get('/depots');
      setDepots(data);
    } catch (err) {
      console.error('Failed to load depots into context:', err);
    }
  };

  useEffect(() => {
    fetchDepots();
  }, []);

  const setActiveDepot = (depotId) => {
    setActiveDepotState(depotId);
    localStorage.setItem('activeDepotId', depotId);
  };

  const getActiveDepotObj = () => {
    if (activeDepot === 'all') return null;
    return depots.find(d => String(d._id) === String(activeDepot)) || null;
  };

  return (
    <DepotContext.Provider value={{
      activeDepot,
      setActiveDepot,
      depots,
      fetchDepots,
      activeDepotObj: getActiveDepotObj()
    }}>
      {children}
    </DepotContext.Provider>
  );
};

export const useDepot = () => useContext(DepotContext);
