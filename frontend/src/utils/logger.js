import axios from 'axios';

// Ensure baseURL is set for this utility or reuse the global one if set in App.js
// Ideally, we should have a centralized API client, but for now we follow the existing pattern.

const BASE_URL = 'http://localhost:8000';

export const remoteLog = async (msg, context = 'FRONTEND') => {
    // 1. Log to Browser Console
    console.log(`%c[${context}]`, 'color: orange; font-weight: bold;', msg);

    // 2. Log to Backend Console
    try {
        await axios.post(`${BASE_URL}/api/debug_log/`, { msg, context });
    } catch (err) {
        console.error("Failed to send remote log", err);
    }
};
