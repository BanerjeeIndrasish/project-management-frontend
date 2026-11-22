import React, { createContext, useContext, useState, useEffect } from "react";
import { callApi } from "../api/callApi";


const getNameInitial = (name) => {
    const nameChunks = name?.split(' ')?.slice(0, 1) ?? [];
    const [first, second] = nameChunks;
    const initials = second ? `${first?.[0]?.toUpperCase()}${second?.[0]?.toUpperCase()}` : `${first?.[0]?.toUpperCase()}${first?.[1]?.toUpperCase()}`;

    return initials;
}

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [permissions, setPermissions] = useState(() => {
        const storedPermissions = localStorage.getItem("permissions");

        return storedPermissions
            ? JSON.parse(storedPermissions)
            : {};
    });

    useEffect(() => {
        // Restore from localStorage
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);



    const login = async (email, password) => {
        const res = await callApi({
            url: "/login",
            method: "POST",
            payload: { email, password },
        });

        if (!res.status) throw new Error("Login failed");
        console.log('Response...', res, res.permissions);

        setToken(res.token);
        setUser(res.user);
        setPermissions(res.permissions);

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem(
            "permissions",
            JSON.stringify(res.permissions)
        );
    };

    const guestLogin = async () => {
        const res = await callApi({
            url: "/guest-login",
        });

        console.log('Response...', res);

        if (!res.status) throw new Error("Login failed");

        setToken(res.token);
        setUser(res.user);
        setPermissions(res.permissions);

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem(
            "permissions",
            JSON.stringify(res.permissions)
        );
    };

    // Check permission
    const hasPermission = (module, action) => {
        return permissions?.[module]?.includes(action) || false;
    };

    // Check any permission
    const hasAnyPermission = (module, actions = []) => {
        return actions.some((action) =>
            hasPermission(module, action)
        );
    };

    // Check all permissions
    const hasAllPermissions = (module, actions = []) => {
        return actions.every((action) =>
            hasPermission(module, action)
        );
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setPermissions(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
        window.location.href = '/login'
    };

    return (
        <AuthContext.Provider value={{
            user,
            nameInitials: getNameInitial(user?.name),
            token,
            login,
            guestLogin,
            logout,
            isAdmin: user?.role_code == 'ADMN',
            permissions,
            hasPermission,
            hasAllPermissions,
            hasAnyPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
