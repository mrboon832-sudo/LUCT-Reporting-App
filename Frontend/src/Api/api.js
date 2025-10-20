import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api", // change to your deployed URL later
})

api.interceptors.request.use(config => {
  let token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api;