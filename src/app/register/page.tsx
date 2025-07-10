"use client";

import { useState, Fragment } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// İşletme kategorileri
const businessCategories = [
  { id: "restaurant", name: "Restaurant & Cafe" },
  { id: "hairdresser", name: "Kuaför & Güzellik" },
  { id: "gym", name: "Spor Salonu" },
];

// Türkiye şehirleri
const cities = [
  "Adana",
  "Ankara",
  "Antalya",
  "Bursa",
  "İstanbul",
  "İzmir",
  "Konya",
  "Mersin",
  "Trabzon",
  "Diğer",
].map((city) => ({ id: city.toLowerCase(), name: city }));

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    city: cities[0].name,
    business_type: businessCategories[0].name,
    tax_number: "",
    contact_person: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    businessCategories[0]
  );
  const [selectedCity, setSelectedCity] = useState(cities[0]);

  // Telefon numarası formatlama
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8)
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(
        6
      )}`;
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(
      6,
      8
    )} ${numbers.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 10) {
      setPhoneNumber(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Form validasyonu
    if (!formData.password || formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setLoading(false);
      return;
    }

    const requestData = {
      companyName: formData.company_name,
      email: formData.email,
      password: formData.password,
      phoneNumber: phoneNumber.replace(/\s/g, ""),
      address: formData.address,
      city: selectedCity.name,
      businessType: selectedCategory.name,
      taxNumber: formData.tax_number,
      contactPerson: formData.contact_person,
    };

    // Form verilerini detaylı loglama
    console.log("Form state:", formData);
    console.log("Selected category:", selectedCategory);
    console.log("Phone number:", phoneNumber);
    console.log("Gönderilen veri:", requestData);
    console.log("Password length:", formData.password?.length || 0);

    try {
      const response = await fetch(
        "http://localhost:8080/api/partners/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();
      console.log("Backend yanıtı:", data);

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          throw new Error(data.details.join("\n"));
        }
        throw new Error(
          data.error || data.message || "Kayıt işlemi başarısız oldu"
        );
      }

      // Başarılı kayıt bildirimi ve yönlendirme
      toast.success(
        "Kayıt işlemi başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz..."
      );

      // 2 saniye bekleyip yönlendirme yap
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Hata detayı:", err);
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Form input değişikliklerini izleme
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    console.log(`Input değişti - ${id}:`, value);
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Kategori değişikliğini izleme
  const handleCategoryChange = (category: (typeof businessCategories)[0]) => {
    console.log("Kategori değişti:", category);
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Logo ve Başlık */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              İşletme Kaydı
            </h2>
            <p className="text-gray-600">
              PlanVia'ya hoş geldiniz! Hemen işletmenizi kaydedin.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 font-medium mb-1">Hata:</div>
              {error.split("\n").map((line, i) => (
                <div key={i} className="text-red-600 text-sm">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İşletme İsmi */}
            <div>
              <label
                htmlFor="company_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                İşletme İsmi
              </label>
              <input
                type="text"
                id="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="İşletmenizin adını girin"
              />
            </div>

            {/* E-posta */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-posta Adresi
              </label>
              <input
                type="email"
                id="email"
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
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="En az 6 karakter olmalı"
              />
            </div>

            {/* Yetkili Adı Soyadı */}
            <div>
              <label
                htmlFor="contact_person"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Yetkili Adı Soyadı
              </label>
              <input
                type="text"
                id="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="Yetkili kişinin adı ve soyadı"
              />
            </div>

            {/* Vergi Numarası */}
            <div>
              <label
                htmlFor="tax_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vergi Numarası
              </label>
              <input
                type="text"
                id="tax_number"
                value={formData.tax_number}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="Vergi numaranızı girin"
              />
            </div>

            {/* İşletme Kategorisi */}
            <div>
              <Listbox value={selectedCategory} onChange={handleCategoryChange}>
                <div className="relative">
                  <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                    İşletme Kategorisi
                  </Listbox.Label>
                  <Listbox.Button className="relative w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200">
                    <span className="block truncate">
                      {selectedCategory.name}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {businessCategories.map((category) => (
                        <Listbox.Option
                          key={category.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                              active
                                ? "bg-violet-100 text-violet-900"
                                : "text-gray-900"
                            }`
                          }
                          value={category}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? "font-medium" : "font-normal"
                                }`}
                              >
                                {category.name}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-violet-600">
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Telefon Numarası */}
            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telefon Numarası
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-500">+90</span>
                <input
                  type="text"
                  id="phone_number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                  placeholder="539 483 23 22"
                />
              </div>
            </div>

            {/* Adres Bilgileri */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Listbox value="TR" onChange={() => {}}>
                  <div className="relative">
                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                      Ülke
                    </Listbox.Label>
                    <Listbox.Button className="relative w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200">
                      <span className="block truncate">Türkiye</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>
                  </div>
                </Listbox>
              </div>
              <div>
                <Listbox value={selectedCity} onChange={setSelectedCity}>
                  <div className="relative">
                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir
                    </Listbox.Label>
                    <Listbox.Button className="relative w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200">
                      <span className="block truncate">
                        {selectedCity.name}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {cities.map((city) => (
                          <Listbox.Option
                            key={city.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-violet-100 text-violet-900"
                                  : "text-gray-900"
                              }`
                            }
                            value={city}
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? "font-medium" : "font-normal"
                                  }`}
                                >
                                  {city.name}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-violet-600">
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>

            {/* Açık Adres */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Açık Adres
              </label>
              <textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                placeholder="İşletmenizin açık adresini girin"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all duration-200 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Kaydediliyor..." : "İşletme Kaydını Tamamla"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
