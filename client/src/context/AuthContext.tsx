'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import api from '@/lib/api';

import {
  User,
  LoginCredentials,
  RegisterData,
  ManagerSetupData,
  AuthResponse
} from '@/types';


interface LoginData extends LoginCredentials {
  society_code?: string;
}


interface SocietyInfo {
  _id: string;
  name: string;
  society_code: string;
}


interface AuthUser extends User {
  society?: SocietyInfo;
  society_name?: string;
}


interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    credentials: LoginData
  ) => Promise<AuthResponse>;

  register: (
    data: RegisterData
  ) => Promise<AuthResponse>;

  managerSetup: (
    data: ManagerSetupData
  ) => Promise<AuthResponse>;

  logout: () => Promise<void>;

  checkAuth: () => Promise<void>;
}


const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );


export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] =
    useState<AuthUser | null>(null);


  const [loading, setLoading] =
    useState(true);


  // ============================================================
  // CREATE COMPLETE USER OBJECT
  // ============================================================

  const buildUserWithSociety = (
    userData: User,
    societyData?: SocietyInfo | null
  ): AuthUser => {

    const completeUser: AuthUser = {
      ...userData
    };


    if (societyData) {

      completeUser.society =
        societyData;

      completeUser.society_name =
        societyData.name;

    }
    else if (
      (userData as AuthUser).society
    ) {

      completeUser.society =
        (userData as AuthUser).society;

      completeUser.society_name =
        (userData as AuthUser)
          .society?.name;

    }
    else if (
      (userData as AuthUser).society_name
    ) {

      completeUser.society_name =
        (userData as AuthUser)
          .society_name;

    }


    return completeUser;
  };


  // ============================================================
  // CHECK AUTHENTICATION
  // ============================================================

  const checkAuth = useCallback(
    async () => {

      try {

        setLoading(true);


        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('token')
            : null;


        if (!token) {

          setUser(null);

          setLoading(false);

          return;

        }


        const response =
          await api.get(
            `/auth/me?_t=${Date.now()}`
          );


        if (
          response.data.success &&
          response.data.data?.user
        ) {

          const userData =
            response.data.data.user;


          const societyData =
            response.data.data.society ||
            userData.society ||
            null;


          const completeUser =
            buildUserWithSociety(
              userData,
              societyData
            );


          setUser(
            completeUser
          );

        }
        else {

          localStorage.removeItem(
            'token'
          );

          setUser(null);

        }

      } catch (_error) {

        if (
          typeof window !== 'undefined'
        ) {

          localStorage.removeItem(
            'token'
          );

        }


        setUser(null);

      } finally {

        setLoading(false);

      }

    },
    []
  );


  useEffect(() => {

    checkAuth();

  }, [
    checkAuth
  ]);


  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (
    credentials: LoginData
  ): Promise<AuthResponse> => {

    try {

      const response =
        await api.post(
          '/auth/login',
          credentials
        );


      if (
        response.data.success &&
        response.data.data?.user
      ) {

        if (
          response.data.data.token
        ) {

          localStorage.setItem(
            'token',
            response.data.data.token
          );

        }


        const userData =
          response.data.data.user;


        /*
         * Backend login response:
         *
         * data.user
         * data.society
         *
         * Society information is merged
         * into the logged-in user object.
         */

        const societyData =
          response.data.data.society ||
          userData.society ||
          null;


        const loggedInUser =
          buildUserWithSociety(
            userData,
            societyData
          );


        setUser(
          loggedInUser
        );


        return {

          success: true,

          message:
            response.data.message,

          user:
            loggedInUser

        };

      }


      return {

        success: false,

        message:
          response.data.message ||
          'Login failed'

      };

    } catch (error: unknown) {

      const axiosError =
        error as {
          response?: {
            data?: {
              message?: string
            }
          }
        };


      const message =
        axiosError.response?.data
          ?.message ||
        'Login failed. Please try again.';


      return {

        success: false,

        message

      };

    }

  };


  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (
    data: RegisterData
  ): Promise<AuthResponse> => {

    try {

      const response =
        await api.post(
          '/auth/register',
          data
        );


      if (
        response.data.success
      ) {

        return {

          success: true,

          message:
            response.data.message

        };

      }


      return {

        success: false,

        message:
          response.data.message ||
          'Registration failed'

      };

    } catch (error: unknown) {

      const axiosError =
        error as {
          response?: {
            data?: {
              message?: string
            }
          }
        };


      const message =
        axiosError.response?.data
          ?.message ||
        'Registration failed. Please try again.';


      return {

        success: false,

        message

      };

    }

  };


  // ============================================================
  // MANAGER SETUP
  // ============================================================

  const managerSetup = async (
    data: ManagerSetupData
  ): Promise<AuthResponse> => {

    try {

      const response =
        await api.post(
          '/auth/manager-setup',
          data
        );


      if (
        response.data.success &&
        response.data.data?.user
      ) {

        if (
          response.data.data.token
        ) {

          localStorage.setItem(
            'token',
            response.data.data.token
          );

        }


        const userData =
          response.data.data.user;


        const societyData =
          response.data.data.society ||
          userData.society ||
          null;


        const managerUser =
          buildUserWithSociety(
            userData,
            societyData
          );


        setUser(
          managerUser
        );


        return {

          success: true,

          message:
            response.data.message,

          user:
            managerUser

        };

      }


      return {

        success: false,

        message:
          response.data.message ||
          'Setup failed'

      };

    } catch (error: unknown) {

      const axiosError =
        error as {
          response?: {
            data?: {
              message?: string
            }
          }
        };


      const message =
        axiosError.response?.data
          ?.message ||
        'Manager setup failed. Please try again.';


      return {

        success: false,

        message

      };

    }

  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = async (): Promise<void> => {

    try {

      await api.post(
        '/auth/logout'
      );

    } catch (error) {

      console.error(
        'Logout error:',
        error
      );

    } finally {

      if (
        typeof window !== 'undefined'
      ) {

        localStorage.removeItem(
          'token'
        );

      }


      setUser(null);

    }

  };


  const value = {

    user,

    loading,

    isAuthenticated:
      !!user,

    login,

    register,

    managerSetup,

    logout,

    checkAuth

  };


  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  );

}


export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (
    context === undefined
  ) {

    throw new Error(
      'useAuth must be used within an AuthProvider'
    );

  }


  return context;

}


export default AuthContext;