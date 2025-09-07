import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'ops' | 'technician' | 'auditor' | 'employee';
  phone?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      
      console.log('Full login response:', data);
  
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      // ✅ YOUR BACKEND RETURNS DIFFERENT STRUCTURE:
      // { success: true, data: { accessToken: "...", user: {...} } }
      const authToken = data.data.accessToken;
      const userData = data.data.user;
      
      if (!authToken) {
        throw new Error('No authentication token received from server');
      }
  
      setToken(authToken);
      setUser(userData);
      
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      console.log('Stored auth_token:', localStorage.getItem('auth_token'));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // ✅ Get the token directly from localStorage instead of state
      const currentToken = localStorage.getItem('auth_token');
      
      if (currentToken) {
        await fetch('http://localhost:3000/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`, // Use currentToken
          },
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // ✅ Always clear the data, even if logout API call fails
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};