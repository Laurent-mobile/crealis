//crealis-mobile/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAuthToken } from '../api/client';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setTokenState] = useState(null);

    useEffect(() => {
        setLoading(false);
    }, []);

    const setToken = (newToken) => {
        setTokenState(newToken);
        setAuthToken(newToken);
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            setToken(token);
            setUser(user);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Erreur de connexion'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            const { token, user } = response.data;

            setToken(token);
            setUser(user);

            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                error: error.response?.data?.message || "Erreur d'inscription"
            };
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
