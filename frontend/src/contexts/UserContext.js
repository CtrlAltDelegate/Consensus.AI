// frontend/src/contexts/UserContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiHelpers } from '../config/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const actionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
function userReducer(state, action) {
  switch (action.type) {
    case actionTypes.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case actionTypes.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case actionTypes.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };
    
    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user }
      };
    
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
}

// Create context
const UserContext = createContext();

// Context provider component
export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Check for existing auth on app load
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        // Verify token is still valid
        const response = await apiHelpers.verifyToken();
        
        if (response.data.success) {
          // Token is valid, restore user session
          dispatch({
            type: actionTypes.AUTH_SUCCESS,
            payload: {
              user: JSON.parse(userData),
              token: token
            }
          });
        } else {
          // Token invalid, clear storage
          clearAuthStorage();
          dispatch({
            type: actionTypes.AUTH_FAILURE,
            payload: { error: 'Session expired' }
          });
        }
      } else {
        // No stored auth
        dispatch({
          type: actionTypes.AUTH_FAILURE,
          payload: { error: null }
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthStorage();
      dispatch({
        type: actionTypes.AUTH_FAILURE,
        payload: { error: 'Authentication check failed' }
      });
    }
  };

  const clearAuthStorage = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  // Auth actions
  const login = async (credentials) => {
    dispatch({ type: actionTypes.AUTH_START });
    
    try {
      const response = await apiHelpers.login(credentials);
      
      if (response.data.success) {
        const { user, token, requiresBillingSetup, nextStep } = response.data;
        
        // Store in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        dispatch({
          type: actionTypes.AUTH_SUCCESS,
          payload: { user, token }
        });
        
        return { success: true, user, token, requiresBillingSetup, nextStep, needsPlanSelection: response.data.needsPlanSelection };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: actionTypes.AUTH_FAILURE,
        payload: { error: errorMessage }
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: actionTypes.AUTH_START });
    
    try {
      const response = await apiHelpers.register(userData);
      
      if (response.data.success) {
        const { user, token, requiresBillingSetup, nextStep, needsPlanSelection } = response.data;
        
        // Store in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        dispatch({
          type: actionTypes.AUTH_SUCCESS,
          payload: { user, token }
        });
        
        return { 
          success: true, 
          user, 
          token, 
          requiresBillingSetup,
          nextStep,
          needsPlanSelection
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({
        type: actionTypes.AUTH_FAILURE,
        payload: { error: errorMessage }
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiHelpers.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthStorage();
      dispatch({ type: actionTypes.LOGOUT });
    }
  };

  const updateUser = async (updates) => {
    try {
      const response = await apiHelpers.updateProfile(updates);
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        
        // Update localStorage
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        dispatch({
          type: actionTypes.UPDATE_USER,
          payload: { user: updatedUser }
        });
        
        return { success: true, user: updatedUser };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Update failed';
      return { success: false, error: errorMessage };
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await apiHelpers.getProfile();
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        
        // Update localStorage
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        dispatch({
          type: actionTypes.UPDATE_USER,
          payload: { user: updatedUser }
        });
        
        return updatedUser;
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Helper functions
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const isAdmin = () => {
    return hasRole('admin');
  };

  const getAvailableTokens = () => {
    return state.user?.availableTokens || 0;
  };

  const getSubscriptionTier = () => {
    return state.user?.subscription?.tier || 'Free';
  };

  const getSubscriptionStatus = () => {
    return state.user?.subscription?.status || 'inactive';
  };

  const contextValue = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshUserData,
    clearError,
    
    // Helper functions
    hasRole,
    isAdmin,
    getAvailableTokens,
    getSubscriptionTier,
    getSubscriptionStatus
  };

  return React.createElement(UserContext.Provider, {
    value: contextValue
  }, children);
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useUser();
    
    if (isLoading) {
      return React.createElement('div', {
        className: 'min-h-screen flex items-center justify-center'
      },
        React.createElement('div', {
          className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'
        })
      );
    }
    
    if (!isAuthenticated) {
      return React.createElement('div', {
        className: 'min-h-screen flex items-center justify-center bg-gray-50'
      },
        React.createElement('div', {
          className: 'text-center'
        },
          React.createElement('h2', {
            className: 'text-2xl font-bold text-gray-900 mb-4'
          }, 'Authentication Required'),
          React.createElement('p', {
            className: 'text-gray-600'
          }, 'Please log in to access this page.')
        )
      );
    }
    
    return React.createElement(Component, props);
  };
}

export default UserContext;
