import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI, userAPI } from '../services/api';

// Create the Authentication Context
const AuthContext = createContext();

// Auth Provider Component to wrap the application
export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage for saved user and token on initial load, then verify with backend
  useEffect(() => {
    const verifySession = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          // Hydrate immediately from localStorage so UI is responsive
          try {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          } catch (parseErr) {}

          // Verify token validity in background against live backend
          try {
            const profileRes = await userAPI.getProfile();
            if (profileRes.data && profileRes.data.user) {
              setToken(savedToken);
              setUser(profileRes.data.user);
              localStorage.setItem('user', JSON.stringify(profileRes.data.user));
            }
          } catch (verifyErr) {
            // Only invalidate if the backend explicitly reports 401 Unauthorized
            if (verifyErr.response && verifyErr.response.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
            // Network errors or 500 server errors do NOT wipe user login
          }
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading saved auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // 1. Login user with backend
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      // Save to localStorage
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      // Update React state
      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true, user: receivedUser };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Login failed. Please check your credentials and try again.';
      return { success: false, message };
    }
  };

  // 2. Register user with backend
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: receivedToken, user: receivedUser } = response.data;

      // Save to localStorage
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      // Update React state
      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true, user: receivedUser };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Registration failed. Please verify your details.';
      return { success: false, message };
    }
  };

  // 3. Logout user
  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      console.error(e);
    }
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  // 4. Update cached user in context and localStorage (e.g. after profile edit)
  const updateUser = (updatedUserData) => {
    const mergedUser = { ...user, ...updatedUserData };
    setUser(mergedUser);
    localStorage.setItem('user', JSON.stringify(mergedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user ? user.role : 'guest',
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for simple access to auth state across pages and components
export function useAuth() {
  return useContext(AuthContext);
}
