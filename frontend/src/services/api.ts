import axios from 'axios';

const api = axios.create({
    baseURL: "https://localhost:8000" // This URL can be changed later
})

export default api;