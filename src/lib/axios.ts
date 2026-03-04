import axios from "axios"

const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  // withCredentials: true,
  headers: {
    common: {
      Accept: "application/json",
    },
    "Access-Control-Allow-Origin": "*",
  },
})

export default axiosApi
