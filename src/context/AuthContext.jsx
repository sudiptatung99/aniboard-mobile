
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState('');
    const [userDetails, setUserDetails] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const StoreToken = (user) => {
        try {
            const parsedUser = typeof user === "string" ? JSON.parse(user) : user;
            sessionStorage.setItem("user", JSON.stringify(parsedUser));
            setUserDetails(parsedUser);
            setIsLoggedIn(true);
        } catch (err) {
            console.error("Error storing user:", err);
        }
    };



    //Logout from Dashboard
    const Logout = () => {
        sessionStorage.removeItem("user");
        setUserDetails({});
        setIsLoggedIn(false);
    };


    useEffect(() => {
        setIsLoggedIn(true);
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserDetails(parsedUser);
            //setToken(parsedUser?.token || "");
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600">
                Loading...
            </div>
        );
    }




    return <AuthContext.Provider value={{ StoreToken, isLoggedIn,userDetails,isLoading, setIsLoading, Logout }}>
        {children}
    </AuthContext.Provider>
}
export const UserAuth = () => {
    const authCOntextValue = useContext(AuthContext);
    if (!authCOntextValue) {
        throw new Error("useAuth used outside of the provider")
    }
    return authCOntextValue;
}