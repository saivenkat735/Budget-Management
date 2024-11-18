import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                if (window.location.pathname === '/login') {
                    navigate('/dashboard');
                }
            } catch (error) {
                localStorage.removeItem('authToken');
            }
        }
        setLoading(false);
    }, [navigate]);

    const login = (token) => {
        localStorage.setItem('authToken', token);
        const decoded = jwtDecode(token);
        setUser(decoded);
        const requestedRoute = localStorage.getItem('requestedRoute');
        if (requestedRoute) {
            navigate(requestedRoute);
            localStorage.removeItem('requestedRoute');
        } else {
            navigate('/dashboard');
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        navigate('/');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 