import axios from "axios";

// instancia a api
const api = axios.create({
    baseURL: 'http://localhost:9001/api/auth',
})
// https://payform-backend.onrender.com/api/auth
// pega o token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')

    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


export default api