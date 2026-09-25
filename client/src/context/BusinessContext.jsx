import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../api/client.js';

const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (user && user.roleGlobal !== 'superadmin') {
      api.get('/businesses/current')
        .then(res => {
          if (!cancelled) { setBusiness(res.business); setRole(res.role); }
        })
        .catch(() => {
          if (!cancelled) { setBusiness(null); setRole(null); }
        });
    } else {
      setBusiness(null);
      setRole(null);
    }
    return () => { cancelled = true; };
  }, [user]);

  const refreshBusiness = async () => {
    const result = await api.get('/businesses/current');
    setBusiness(result.business);
    setRole(result.role);
  };

  return (
    <BusinessContext.Provider value={{ business, role, refreshBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
