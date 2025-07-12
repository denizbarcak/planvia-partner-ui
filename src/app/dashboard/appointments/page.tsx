"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
  addDays,
  subDays,
  startOfMonth,
  getDate,
  getDaysInMonth,
  eachDayOfInterval,
  endOfWeek,
  isToday,
  setHours,
  setMinutes,
  endOfMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Card } from "@tremor/react";
import { Dialog } from "@headlessui/react";
import { reservationService } from "@/services/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: tr }),
  getDay,
  locales: { tr },
});

// Özel formatlayıcılar
const formats = {
  monthHeaderFormat: (date: Date) => format(date, "MMMM yyyy", { locale: tr }),
  dayHeaderFormat: (date: Date) =>
    format(date, "dd MMMM yyyy, EEEE", { locale: tr }),
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "dd", { locale: tr })} - ${format(end, "dd MMMM yyyy", {
      locale: tr,
    })}`,
  weekdayFormat: (date: Date) => format(date, "EEE", { locale: tr }),
  timeGutterFormat: (date: Date) => format(date, "HH:mm", { locale: tr }),
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm", { locale: tr })} - ${format(end, "HH:mm", {
      locale: tr,
    })}`,
  agendaTimeFormat: (date: Date) => format(date, "HH:mm", { locale: tr }),
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm", { locale: tr })} - ${format(end, "HH:mm", {
      locale: tr,
    })}`,
  dayFormat: "d",
};

const messages = {
  today: "Bugün",
  previous: "Önceki",
  next: "Sonraki",
  month: "Ay",
  week: "Hafta",
  day: "Gün",
  agenda: "Ajanda",
  date: "Tarih",
  time: "Saat",
  event: "Etkinlik",
  noEventsInRange: "Bu aralıkta randevu bulunmuyor.",
  showMore: (total: number) => `+${total} randevu daha`,
  allDay: "Tüm gün",
  work_week: "Hafta içi",
  yesterday: "Dün",
  tomorrow: "Yarın",
  open: "Aç",
  close: "Kapat",
};

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: {
    start: Date;
    end: Date;
  } | null;
  onSuccess: () => void; // Add onSuccess prop
}

const CreateEventModal = ({
  isOpen,
  onClose,
  selectedSlot,
  onSuccess,
}: CreateEventModalProps): JSX.Element | null => {
  const router = useRouter();
  const [reservationName, setReservationName] = useState("");
  const [reservationCount, setReservationCount] = useState(1);
  const [isAllDay, setIsAllDay] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >("weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurringEndType, setRecurringEndType] = useState<
    "never" | "after" | "on"
  >("never");
  const [recurringEndCount, setRecurringEndCount] = useState(1);
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);

  // Form resetleme fonksiyonu
  const resetForm = () => {
    setReservationName("");
    setReservationCount(1);
    setIsAllDay(false);
    setIsMultiDay(false);
    setStartTime(null);
    setEndTime(null);
    setIsRecurring(false);
    setRecurringType("weekly");
    setSelectedDays([]);
    setRecurringEndType("never");
    setRecurringEndCount(1);
    setRecurringEndDate(null);
  };

  // Modal kapanırken formu resetle
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Seçilen slot değiştiğinde başlangıç ve bitiş zamanlarını güncelle
  useEffect(() => {
    if (!selectedSlot) return;

    setStartTime(selectedSlot.start);
    setEndTime(selectedSlot.end);
    setSelectedDays([selectedSlot.start.getDay()]);

    return () => {
      resetForm();
    };
  }, [selectedSlot]);

  const handleSave = async () => {
    if (!selectedSlot || !startTime || !endTime) return;

    try {
      // Rezervasyon verilerini hazırla
      const reservationData = {
        name: reservationName,
        startDate: startTime,
        endDate: endTime,
        isAllDay,
        isMultiDay,
        capacity: reservationCount,
        ...(isRecurring && {
          recurrence: {
            enabled: true,
            type: recurringType,
            daysOfWeek: selectedDays,
            endType: recurringEndType,
            ...(recurringEndType === "after" && {
              endAfter: recurringEndCount,
            }),
            ...(recurringEndType === "on" &&
              recurringEndDate && { endDate: recurringEndDate }),
          },
        }),
      };

      // API'ye gönder
      await reservationService.create(reservationData);

      // Başarılı mesajı göster
      toast.success("Rezervasyon başarıyla oluşturuldu");

      // Modal'ı kapat ve formu resetle
      handleClose();
      onSuccess(); // Call onSuccess after successful creation
    } catch (error: any) {
      console.error("Rezervasyon oluşturma hatası:", error);
      if (error?.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Rezervasyon oluşturulurken bir hata oluştu");
      }
    }
  };

  const adjustEndTime = (minutes: number) => {
    if (endTime && !isAllDay && selectedSlot) {
      const newEndTime = new Date(endTime.getTime() + minutes * 60000);
      // Başlangıç saatinden önce olamaz
      if (newEndTime > selectedSlot.start) {
        setEndTime(newEndTime);
      } else {
        // Eğer başlangıç saatinden önceye düşecekse, başlangıç saatine eşitle
        setEndTime(new Date(selectedSlot.start.getTime() + 30 * 60000));
      }
    }
  };

  const weekDays = [
    { id: 1, name: "Pzt" },
    { id: 2, name: "Sal" },
    { id: 3, name: "Çar" },
    { id: 4, name: "Per" },
    { id: 5, name: "Cum" },
    { id: 6, name: "Cts" },
    { id: 0, name: "Paz" },
  ];

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  if (!selectedSlot || !startTime || !endTime) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl p-6 w-[700px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-violet-600 uppercase tracking-wide">
              REZERVASYON OLUŞTUR
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            Rezervasyon Planı
            <button className="text-gray-400 hover:text-yellow-500 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          </Dialog.Title>

          <div className="space-y-6">
            {/* Rezervasyon Adı */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="text-gray-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rezervasyon adı"
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                  className="w-full bg-white rounded-lg px-4 py-2 text-gray-900 shadow-sm"
                />
              </div>
            </div>

            {/* Tarih ve Saat Seçimi */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="text-gray-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {/* Tüm Gün ve Çoklu Gün Seçenekleri */}
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Tüm Gün
                    </span>
                  </label>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMultiDay}
                      onChange={(e) => setIsMultiDay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Birden Fazla Gün
                    </span>
                  </label>
                </div>

                {/* Tarih ve Saat */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white rounded-lg px-4 py-2 text-gray-900 shadow-sm">
                      {format(startTime, "d MMM EEE", { locale: tr })}
                    </div>
                    <input
                      type="time"
                      value={isAllDay ? "00:00" : format(startTime, "HH:mm")}
                      disabled={isAllDay}
                      onChange={(e) => {
                        if (!isAllDay && startTime) {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const newStartTime = new Date(startTime);
                          newStartTime.setHours(hours);
                          newStartTime.setMinutes(minutes);
                          setStartTime(newStartTime);
                        }
                      }}
                      className={`bg-white rounded-lg px-4 py-2 text-gray-900 w-24 shadow-sm ${
                        isAllDay ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="flex items-center gap-2">
                    {isMultiDay ? (
                      <input
                        type="date"
                        value={endTime ? format(endTime, "yyyy-MM-dd") : ""}
                        min={format(startTime, "yyyy-MM-dd")}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          if (newDate >= startTime) {
                            // Saati koruyarak tarihi güncelle
                            const newEndDate = new Date(newDate);
                            if (endTime) {
                              newEndDate.setHours(endTime.getHours());
                              newEndDate.setMinutes(endTime.getMinutes());
                            }
                            setEndTime(newEndDate);
                          }
                        }}
                        className="bg-white rounded-lg px-4 py-2 text-gray-900 shadow-sm"
                      />
                    ) : null}
                    <div className="flex items-center">
                      <input
                        type="time"
                        value={
                          isAllDay
                            ? "23:59"
                            : endTime
                            ? format(endTime, "HH:mm")
                            : ""
                        }
                        onChange={(e) => {
                          if (!isAllDay && selectedSlot) {
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);

                            // Bitiş tarihi seçiliyse onu kullan, değilse başlangıç tarihini kullan
                            const baseDate =
                              isMultiDay && endTime ? endTime : startTime;
                            const newEndTime = new Date(baseDate);
                            newEndTime.setHours(hours);
                            newEndTime.setMinutes(minutes);

                            // Çoklu gün seçili değilse başlangıç saati kontrolü yap
                            if (!isMultiDay) {
                              if (newEndTime > startTime) {
                                setEndTime(newEndTime);
                              } else {
                                const defaultEndTime = new Date(
                                  startTime.getTime() + 30 * 60000
                                );
                                setEndTime(defaultEndTime);
                              }
                            } else {
                              setEndTime(newEndTime);
                            }
                          }
                        }}
                        min={
                          !isMultiDay && selectedSlot
                            ? format(startTime, "HH:mm")
                            : undefined
                        }
                        disabled={isAllDay}
                        className={`bg-white rounded-lg px-4 py-2 text-gray-900 w-24 shadow-sm ${
                          isAllDay ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                      {!isAllDay && (
                        <div className="flex flex-col ml-1">
                          <button
                            onClick={() => adjustEndTime(30)}
                            disabled={isAllDay}
                            className="p-1 hover:bg-white rounded-lg shadow-sm disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => adjustEndTime(-30)}
                            disabled={isAllDay}
                            className="p-1 hover:bg-white rounded-lg shadow-sm disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kontenjan Sayısı */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="text-gray-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={reservationCount}
                    onChange={(e) =>
                      setReservationCount(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="bg-white rounded-lg px-4 py-2 text-gray-900 shadow-sm w-24"
                  />
                  <span className="text-gray-700">kontenjan</span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  İşletme türüne göre masa, kişi veya seans sayısı
                </div>
              </div>
            </div>

            {/* Tekrarlama Seçenekleri */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="text-gray-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Rezervasyonu Tekrarla
                    </span>
                  </label>

                  {/* Bilgi İkonu ve Tooltip */}
                  <div className="relative group">
                    <svg
                      className="w-5 h-5 text-gray-400 cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg py-2 px-3 w-72 right-0 top-6 shadow-lg">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">Her Hafta:</p>
                          <p className="text-gray-300 text-xs">
                            Cumartesi ve Pazar seçildiğinde, bir ay için:
                          </p>
                          <ul className="text-gray-300 text-xs mt-1 list-disc list-inside">
                            <li>17-18 Şubat</li>
                            <li>24-25 Şubat</li>
                            <li>2-3 Mart</li>
                            <li>9-10 Mart</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-medium">Her Ay:</p>
                          <p className="text-gray-300 text-xs">
                            17-18 Şubat seçildiğinde, 4 ay için:
                          </p>
                          <ul className="text-gray-300 text-xs mt-1 list-disc list-inside">
                            <li>17-18 Şubat</li>
                            <li>17-18 Mart</li>
                            <li>17-18 Nisan</li>
                            <li>17-18 Mayıs</li>
                          </ul>
                        </div>

                        <p className="text-xs text-gray-400 border-t border-gray-700 pt-2">
                          Not: Tarihler seçtiğiniz başlangıç gününe göre
                          değişecektir
                        </p>
                      </div>
                      <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -top-1 right-6"></div>
                    </div>
                  </div>
                </div>

                {isRecurring && (
                  <div className="mt-4 space-y-4">
                    {/* Tekrarlama Tipi */}
                    <div className="flex items-center gap-3">
                      <select
                        value={recurringType}
                        onChange={(e) =>
                          setRecurringType(e.target.value as any)
                        }
                        className="bg-white rounded-lg px-4 py-2 text-gray-900 shadow-sm"
                      >
                        <option value="daily">Her gün</option>
                        <option value="weekly">Her hafta</option>
                        <option value="monthly">Her ay</option>
                        <option value="yearly">Her yıl</option>
                        <option value="custom">Özel</option>
                      </select>
                    </div>

                    {/* Haftalık tekrar için gün seçimi */}
                    {recurringType === "weekly" && (
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => (
                          <button
                            key={day.id}
                            onClick={() => toggleDay(day.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedDays.includes(day.id)
                                ? "bg-violet-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {day.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tekrarlama Bitiş Seçenekleri */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Tekrarlama Sonu
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="never"
                          checked={recurringEndType === "never"}
                          onChange={() => setRecurringEndType("never")}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <label
                          htmlFor="never"
                          className="text-sm text-gray-700"
                        >
                          Süresiz
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="after"
                          checked={recurringEndType === "after"}
                          onChange={() => setRecurringEndType("after")}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <label
                          htmlFor="after"
                          className="text-sm text-gray-700"
                        >
                          Tekrar sayısı:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={recurringEndCount}
                          onChange={(e) =>
                            setRecurringEndCount(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          disabled={recurringEndType !== "after"}
                          className={`bg-white rounded-lg px-3 py-1 text-gray-900 shadow-sm w-20 text-sm ${
                            recurringEndType !== "after" ? "opacity-50" : ""
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="on"
                          checked={recurringEndType === "on"}
                          onChange={() => setRecurringEndType("on")}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <label htmlFor="on" className="text-sm text-gray-700">
                          Tarihte:
                        </label>
                        <input
                          type="date"
                          value={
                            recurringEndDate
                              ? format(recurringEndDate, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) =>
                            setRecurringEndDate(new Date(e.target.value))
                          }
                          disabled={recurringEndType !== "on"}
                          className={`bg-white rounded-lg px-3 py-1 text-gray-900 shadow-sm text-sm ${
                            recurringEndType !== "on" ? "opacity-50" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                className="bg-violet-600 text-white px-6 py-2.5 rounded-xl hover:bg-violet-700 transition-colors font-medium"
              >
                Kaydet
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const WeekHeader = ({ date }: { date: Date }) => {
  const isToday = isSameDay(date, new Date());
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <div className="rbc-header-content">
      <span
        className={`rbc-date ${isWeekend ? "text-red-500" : ""} ${
          isToday ? "text-violet-600" : ""
        }`}
      >
        {format(date, "d")}
      </span>
      <span className="rbc-day-name">
        {format(date, "EEEE", { locale: tr })}
      </span>
    </div>
  );
};

const formatEvents = (reservations: any[]): Event[] => {
  return (reservations || []).map((reservation: any) => {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);

    return {
      id: reservation._id,
      title: reservation.name,
      start: start,
      end: end,
      allDay: reservation.isAllDay,
      resource: {
        isMultiDay: reservation.isMultiDay,
        capacity: reservation.capacity,
      },
    };
  });
};

export default function Appointments() {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(new Date());

  const CustomToolbar = ({ date, onNavigate, onView, view }: any) => (
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDatePickerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{format(date, "MMMM yyyy", { locale: tr })}</span>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onNavigate("PREV")}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => onNavigate("TODAY")}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Bugün
          </button>

          <button
            onClick={() => onNavigate("NEXT")}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onView("month")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            view === "month"
              ? "bg-violet-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Ay
        </button>
        <button
          onClick={() => onView("week")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            view === "week"
              ? "bg-violet-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Hafta
        </button>
        <button
          onClick={() => onView("day")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            view === "day"
              ? "bg-violet-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Gün
        </button>
      </div>
    </div>
  );

  // Randevuları yükle
  const loadEvents = useCallback(async () => {
    try {
      const start = startOfMonth(date);
      const end = addMonths(start, 1);

      const reservations = await reservationService.getAll(start, end);
      setEvents(formatEvents(reservations));
    } catch (error: any) {
      console.error("Randevular yüklenirken hata oluştu:", error);
      if (error?.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Randevular yüklenirken bir hata oluştu");
        setEvents([]);
      }
    }
  }, [date, router]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, date, view]);

  const handleCreateSuccess = useCallback(() => {
    loadEvents();
    setIsCreateModalOpen(false);
    setSelectedSlot(null);
  }, [loadEvents]);

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      const selectedDay = startOfDay(slotInfo.start);
      const currentMonth = date.getMonth();
      const selectedMonth = selectedDay.getMonth();

      // Eğer seçilen gün mevcut ayın dışındaysa
      if (selectedMonth !== currentMonth) {
        // Seçilen güne göre ay değişimi yap
        setDate(selectedDay);
      } else {
        // Mevcut ayın günlerine tıklandığında randevu oluşturma modalını aç
        setSelectedSlot(slotInfo);
        setIsCreateModalOpen(true);
      }
    },
    [date]
  );

  return (
    <div className="h-[calc(100vh-80px)] p-2">
      <Card className="bg-white rounded-3xl shadow-sm overflow-hidden h-full">
        <div className="p-2 h-full flex flex-col">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            formats={formats}
            messages={messages}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            selectable
            onSelectSlot={handleSelectSlot}
            defaultView="month"
            popup
            className="custom-calendar"
            components={{
              toolbar: CustomToolbar,
              week: {
                header: WeekHeader,
              },
            }}
          />
        </div>
      </Card>

      {/* Tarih Seçici Modal */}
      <Dialog
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-[320px]">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setDatePickerMonth(subMonths(datePickerMonth, 1))
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-medium text-gray-900">
                {format(datePickerMonth, "MMMM yyyy", { locale: tr })}
              </h2>
              <button
                onClick={() =>
                  setDatePickerMonth(addMonths(datePickerMonth, 1))
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(datePickerMonth), {
                  locale: tr,
                }),
                end: endOfWeek(endOfMonth(datePickerMonth), { locale: tr }),
              }).map((day, index) => {
                const isSelected = isSameDay(day, date);
                const isCurrentMonth =
                  day.getMonth() === datePickerMonth.getMonth();
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setDate(day);
                      setIsDatePickerOpen(false);
                    }}
                    className={`
                      p-2 text-sm rounded-lg transition-colors
                      ${isSelected ? "bg-violet-600 text-white" : ""}
                      ${
                        !isSelected && isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                      }
                      ${!isSelected && isTodayDate ? "bg-violet-50" : ""}
                      ${!isSelected ? "hover:bg-gray-100" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {isCreateModalOpen && selectedSlot && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedSlot(null);
          }}
          selectedSlot={selectedSlot}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
