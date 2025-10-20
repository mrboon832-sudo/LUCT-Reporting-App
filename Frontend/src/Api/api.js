import axios from "axios"

const api = axios.create({
  baseURL: "https://luct-reporting-app-p7o9.onrender.com", // change to your deployed URL later
})

api.interceptors.request.use(config => {
  let token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api;