"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface ILoginResponse {
  message: string;
  token?: string;
  partner?: {
    id: string;
    companyName: string;
    email: string;
  };
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post<ILoginResponse>(
        "http://localhost:8080/api/partners/login",
        formData
      );

      if (response.data.token) {
        // Token'ı localStorage'a kaydet
        localStorage.setItem("token", response.data.token);
        toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
        router.push("/dashboard"); // Başarılı girişte dashboard'a yönlendir
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Giriş yapılırken bir hata oluştu"
      );
      toast.error("Giriş başarısız!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Logo ve Başlık */}
          <div className="text-center mb-8">
            <div className="inline-block bg-white p-4 rounded-xl shadow-sm mb-10">
              <div className="text-4xl logo-text">PlanVia</div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              İşletme Girişi
            </h2>
            <p className="text-gray-600">
              PlanVia işletme panelinize hoş geldiniz!
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="ornek@sirket.com"
              />
            </div>

            {/* Şifre */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Giriş Yap Butonu */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors duration-200 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>

            {/* Kayıt Ol Linki */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Henüz hesabınız yok mu?</span>{" "}
              <Link
                href="/register"
                className="text-violet-600 hover:text-violet-800 font-medium"
              >
                İşletmenizi Kaydedin
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
