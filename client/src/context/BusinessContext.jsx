import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../api/client.js';

const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/businesses/current')
        .then(res => { setBusiness(res.data.business); setRole(res.data.role); })
        .catch(() => { setBusiness(null); setRole(null); });
    }
  }, [user]);

  return (
    <BusinessContext.Provider value={{ business, role }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
