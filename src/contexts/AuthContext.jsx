import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Failed to get current user:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const subscription = onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const { session: newSession } = await signIn(email, password);
      setSession(newSession);
      setUser(newSession?.user || null);
      return newSession;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, password) => {
    try {
      setError(null);
      const { user: newUser } = await signUp(email, password);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
