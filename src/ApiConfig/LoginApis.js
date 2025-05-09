import axios from 'axios';
import BASE_URL from './apiConfig';
import { jwtDecode } from 'jwt-decode';
// import jwt from 'jsonwebtoken';

const api = axios.create({
    baseURL: BASE_URL+"/admin",
    headers: {
        'Content-Type': 'application/json'
    },
});

let features =[];
const SECRETKEY = 'jsfgfjguwrg8783wgbjs849h2fu3cnsvh8wyr8fhwfvi2g225';
const REFRESHKEY = '825y8i3hnfjmsbv7gwajbl7fobqrjfvbs7gbfj2q3bgh8f42';

export const login = async (email, password) => {
    try {
        const response = await api.post('/login', { email, password });
        const token = response.data;
    localStorage.setItem('authToken', token.accessToken);
     features=token.features;
     localStorage.setItem('features', JSON.stringify(features));
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await api.post('/forgot-password', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error sending email');
    }
};

export const resetPassword = async (newPassword, confirmPassword) => {
    try {
        const response = await api.post('/resetPassword', { newPassword, confirmPassword });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'PasswordReset Failed');
    }
};

export const verifyToken = async () => {
    try {
        const token = getToken();
        const response = await api.get('/verify-token',{headers: {
            Authorization: `Bearer ${token}`}
          });
          const decoded = response.data; // Adjust based on your API's response structure
          console.log(decoded);
        //   if (decoded && decoded.userId) {
        //     setUserId(decoded.userId);
        //   }
        } catch (error) {
          console.error('Invalid token', error);
        //   setError('Failed to verify token');
        }
};

export const getToken = () => {
    return localStorage.getItem('authToken');
  };

export const getUserId = () => {
    return localStorage.getItem('userId');
  };

export const getFeatures = ()=> {
    return localStorage.getItem('features');
}

 // Function to decode and verify the JWT
export const verifyTokenjwt = () =>{
    try {
        const token = getToken();
        const decoded = jwtDecode(token);
        console.log(decoded)
        localStorage.setItem('userId', decoded.userId);
        localStorage.setItem('name', decoded.name);

    } catch (error) {
      console.error('Invalid token', error);
    }
  };



// You can add more API calls here, e.g., for registration, fetching data, etc.
