import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const DEMO_USERS = {
  business: { email: "demo@cleoyards.com", password: "CY2026demo!", name: "Francisco G.", company: "GreenPro Landscaping", role: "business" },
  client: { email: "client@cleoyards.com", password: "CY2026client!", name: "John Smith", address: "742 Evergreen Terrace", role: "client" },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password, portal) => {
    const demo = DEMO_USERS[portal];
    if (demo && email === demo.email && password === demo.password) {
      setUser(demo);
      return { success: true, redirect: portal === "business" ? "/app" : "/client" };
    }
    return { success: false, error: "Invalid credentials" };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
