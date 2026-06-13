import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ScopeContext = createContext();

export function ScopeProvider({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [scope, setScope] = useState(() => {
        return localStorage.getItem('appScope') || 'global'; // 'global' | 'country'
    });

    const [activeCountry, setActiveCountry] = useState(() => {
        return localStorage.getItem('appActiveCountry') || null; // 'usa' | null
    });

    // Sync to local storage
    useEffect(() => {
        localStorage.setItem('appScope', scope);
    }, [scope]);

    useEffect(() => {
        if (activeCountry) {
            localStorage.setItem('appActiveCountry', activeCountry);
        } else {
            localStorage.removeItem('appActiveCountry');
        }
    }, [activeCountry]);

    // Handle scope changes and routing updates
    const changeScope = (newScope, country = null) => {
        setScope(newScope);
        if (country) {
            setActiveCountry(country);
        }

        if (newScope === 'global') {
            navigate('/global');
        } else if (newScope === 'country' && country) {
            navigate(`/country/${country}`);
        }
    };

    return (
        <ScopeContext.Provider value={{ scope, activeCountry, changeScope }}>
            {children}
        </ScopeContext.Provider>
    );
}

export function useScope() {
    return useContext(ScopeContext);
}
