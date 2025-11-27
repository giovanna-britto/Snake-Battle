// src/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000", // backend Nest
  timeout: 10000,
});
