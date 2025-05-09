import axios from 'axios';
import BASE_URL from './apiConfig';
import { getUserId } from './LoginApis';

const api = axios.create({
    baseURL: BASE_URL+"/admin",
    headers: {
        'Content-Type': 'application/json'
    },
});

export const fetchDashboardHistory = async () => {
    try {
        const userId = getUserId()
        const response = await api.get('/history?userId='+userId);
        const history = response.data;
        return history;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Retrieving History failed.');
    }
};

export const fetchHistory = async (group,itemName) => {
    try {
        const userId = getUserId()
        const response = await api.get('/history?userId='+userId+'&group='+group+'&itemName='+itemName);
        const history = response.data;
        return history;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Retrieving History failed.');
    }
};