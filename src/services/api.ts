import axios from "axios";

const API_URL = "http://localhost:8080/api";

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // 'token' yerine 'accessToken' kullanıyoruz
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hatası durumunda error'u fırlat
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 hatası durumunda component seviyesinde yönlendirme yapılacak
    return Promise.reject(error);
  }
);

// Rezervasyon servisleri
export const reservationService = {
  // Yeni rezervasyon oluştur
  create: async (reservationData: {
    name: string;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    isMultiDay: boolean;
    capacity: number;
    recurrence?: {
      enabled: boolean;
      type?: string;
      daysOfWeek?: number[];
      endType?: string;
      endAfter?: number;
      endDate?: Date;
    };
  }) => {
    try {
      const response = await api.post("/reservations", {
        ...reservationData,
        startDate: reservationData.startDate.toISOString(),
        endDate: reservationData.endDate.toISOString(),
        recurrence: reservationData.recurrence?.enabled
          ? {
              ...reservationData.recurrence,
              endDate: reservationData.recurrence.endDate?.toISOString(),
            }
          : undefined,
      });
      return response.data;
    } catch (error) {
      console.error("Rezervasyon oluşturma hatası:", error);
      throw error;
    }
  },

  // Rezervasyonları getir
  getAll: async (start: Date, end: Date) => {
    try {
      const response = await api.get("/reservations", {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Rezervasyonları getirme hatası:", error);
      throw error;
    }
  },
};

export default api;
