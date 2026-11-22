import axios from "axios";

export const BASE_URL = import.meta.env.VITE_BASE_URL;
console.log('^^^^^^^^^^^^^^^', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 100000,
});

// 🔑 Attach token automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔑 Response interceptor (handle 401 invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response &&
            error.response.status === 401 &&
            error.response.data?.error === "Invalid token"
        ) {
            // Clear localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("permissions");

            // Optional: redirect to login page
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// 🔑 Unified call function
export async function callApiWithToken({
    url = "/",
    method = "GET",
    payload = null,
    signal,
}) {
    const response = await api.request({
        url,
        method,
        data: payload,
        signal,
    });
    return response.data;
}

export async function callApi({
    url = "/",
    method = "GET",
    payload = null,
    signal,
}) {
    const response = await axios.request({
        baseURL: BASE_URL,
        url,
        method,
        data: payload,
        signal,
    });
    return response.data;
}

export default api;
