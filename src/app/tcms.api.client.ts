import axios from 'axios';

export const tcmsApiClient = axios.create({
    baseURL: import.meta.env.VITE_TCMS_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
