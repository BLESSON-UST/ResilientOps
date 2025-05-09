// src/components/AuthGuard.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from './LoginApis';

const AuthGuard = ({ children }) => {
  const token = getToken();

  if (!token) {
    console.log('No token found. Redirecting to login.'); // Log if no token is found
    return <Navigate to="/login" />;
  }

  console.log('Token found. Authenticated.'); // Log if token is found

  return children;
};

export default AuthGuard;
