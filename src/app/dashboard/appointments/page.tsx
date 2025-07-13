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
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  UserCircleIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

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

// Event tipini güncelle
interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    capacity: number;
    isPast: boolean;
    isMultiDay: boolean;
    recurrence?: {
      enabled: boolean;
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      daysOfWeek: number[];
      endType: "never" | "after" | "on";
      endAfter?: number;
      endDate?: string;
    };
  };
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: {
    start: Date;
    end: Date;
  } | null;
  onSuccess: () => void;
  editMode?: boolean;
  eventToEdit?: Event | null;
}

const CreateEventModal = ({
  isOpen,
  onClose,
  selectedSlot,
  onSuccess,
  editMode = false,
  eventToEdit = null,
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
  const [nameError, setNameError] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
    setNameError(false);
  };

  // Düzenleme modunda form verilerini doldur
  useEffect(() => {
    if (editMode && eventToEdit) {
      setReservationName(eventToEdit.title);
      setReservationCount(eventToEdit.resource?.capacity || 1);
      setIsAllDay(eventToEdit.allDay || false);
      setIsMultiDay(eventToEdit.resource?.isMultiDay || false);
      setStartTime(eventToEdit.start);
      setEndTime(eventToEdit.end);

      // Tekrarlama ayarlarını doldur
      const recurrence = eventToEdit.resource?.recurrence;
      if (recurrence?.enabled) {
        setIsRecurring(true);
        setRecurringType(recurrence.type);
        setSelectedDays(recurrence.daysOfWeek || []);
        setRecurringEndType(recurrence.endType);
        if (recurrence.endType === "after") {
          setRecurringEndCount(recurrence.endAfter || 1);
        } else if (recurrence.endType === "on" && recurrence.endDate) {
          setRecurringEndDate(new Date(recurrence.endDate));
        }
      }
    }
  }, [editMode, eventToEdit]);

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

    // İsim alanı validasyonu
    if (!reservationName.trim()) {
      setNameError(true);
      toast.error("Lütfen rezervasyon adını giriniz");
      return;
    }

    try {
      // Rezervasyon verilerini hazırla
      const reservationData = {
        name: reservationName.trim(),
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

      if (editMode && eventToEdit?.id) {
        // Güncelleme işlemi
        console.log("Updating reservation with ID:", eventToEdit.id);
        console.log("Update data:", reservationData);
        await reservationService.update(eventToEdit.id, reservationData);
        toast.success("Rezervasyon başarıyla güncellendi");
      } else {
        // Yeni oluşturma işlemi
        await reservationService.create(reservationData);
        toast.success("Rezervasyon başarıyla oluşturuldu");
      }

      // Modal'ı kapat ve formu resetle
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Rezervasyon işlemi hatası:", error);
      if (error?.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error(
          editMode
            ? "Rezervasyon güncellenirken bir hata oluştu"
            : "Rezervasyon oluşturulurken bir hata oluştu"
        );
      }
    }
  };

  const handleDelete = async () => {
    if (!editMode || !eventToEdit?.id) return;

    try {
      await reservationService.delete(eventToEdit.id);
      toast.success("Rezervasyon başarıyla silindi");
      setIsDeleteConfirmOpen(false);
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Rezervasyon silme hatası:", error);
      if (error?.response?.status === 401) {
        router.push("/login");
      } else {
        toast.error("Rezervasyon silinirken bir hata oluştu");
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
    <>
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-xl p-6 w-[700px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-violet-600 uppercase tracking-wide">
                {editMode ? "REZERVASYON DÜZENLE" : "REZERVASYON OLUŞTUR"}
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
                    onChange={(e) => {
                      setReservationName(e.target.value);
                      setNameError(false);
                    }}
                    className={`w-full bg-white rounded-lg px-4 py-2 text-gray-900 shadow-sm ${
                      nameError
                        ? "border-2 border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-500">
                      Rezervasyon adı gereklidir
                    </p>
                  )}
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
              <div className="flex justify-end pt-2 gap-3">
                {editMode && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    Sil
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="bg-violet-600 text-white px-6 py-2.5 rounded-xl hover:bg-violet-700 transition-colors font-medium"
                >
                  {editMode ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Silme Onay Modalı */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        className="relative z-[60]"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Rezervasyonu Sil
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mb-6">
              Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </Dialog.Description>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                Hayır
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Evet
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
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

const DayHeader = ({ date, label }: { date: Date; label: string }) => {
  const isToday = isSameDay(date, new Date());
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <div className="flex flex-col items-center justify-center py-2 border-b border-gray-200">
      <div className="text-base font-medium">
        <span
          className={`${isWeekend ? "text-red-500" : "text-gray-900"} ${
            isToday ? "text-violet-600" : ""
          }`}
        >
          {format(date, "d MMMM yyyy", { locale: tr })}
        </span>
      </div>
      <div className="text-sm text-gray-500">
        {format(date, "EEEE", { locale: tr })}
      </div>
    </div>
  );
};

// Rezervasyonları formatla
const formatEvents = (reservations: any[]): Event[] => {
  console.log("Backend'den gelen rezervasyonlar:", reservations);
  return reservations.map((reservation) => {
    console.log(
      "Reservation raw ID:",
      reservation.id,
      "MongoDB _id:",
      reservation._id
    );
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    const isPast = end < new Date();

    const formattedEvent = {
      id: reservation.id || reservation._id, // Handle both possible ID fields
      title: reservation.name,
      start,
      end,
      allDay: reservation.isAllDay,
      resource: {
        capacity: reservation.capacity,
        isPast: isPast,
        isMultiDay: reservation.isMultiDay,
        recurrence: reservation.recurrence,
      },
    };
    console.log("Formatlanmış event:", formattedEvent);
    return formattedEvent;
  });
};

// Özel Event Komponenti
const CustomEvent = ({
  event,
  onEventUpdate,
}: {
  event: Event;
  onEventUpdate: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  return (
    <div className="relative h-full">
      <button
        className="absolute right-1 top-1 p-0.5 rounded hover:bg-black/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        <EllipsisHorizontalIcon className="w-3 h-3 text-inherit" />
      </button>
      <div
        className="px-2 py-1 h-full cursor-pointer"
        onClick={() => setIsDetailsModalOpen(true)}
      >
        <div className="text-sm font-medium">{event.title}</div>
      </div>

      {isModalOpen && (
        <CreateEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedSlot={{
            start: event.start,
            end: event.end,
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            onEventUpdate();
          }}
          editMode={true}
          eventToEdit={event}
        />
      )}

      {isDetailsModalOpen && (
        <ReservationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          event={event}
        />
      )}
    </div>
  );
};

// Yeni CustomerFieldsSettingsModal bileşeni
interface CustomerFields {
  name: boolean;
  surname: boolean;
  phone: boolean;
  personCount: boolean;
  notes: boolean;
}

const CustomerFieldsSettingsModal = ({
  isOpen,
  onClose,
  onSave,
  initialFields = {
    name: false,
    surname: false,
    phone: false,
    personCount: false,
    notes: false,
  },
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fields: CustomerFields) => void;
  initialFields?: CustomerFields;
}) => {
  const [fields, setFields] = useState<CustomerFields>(initialFields);

  const handleSave = () => {
    onSave(fields);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Müşteri Alanları
            </Dialog.Title>
            <button
              onClick={handleSave}
              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* İsim */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">İsim</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={fields.name}
                  onChange={() => setFields({ ...fields, name: !fields.name })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
            </label>

            {/* Soyad */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Soyad</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={fields.surname}
                  onChange={() =>
                    setFields({ ...fields, surname: !fields.surname })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
            </label>

            {/* Telefon */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Telefon No</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={fields.phone}
                  onChange={() =>
                    setFields({ ...fields, phone: !fields.phone })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
            </label>

            {/* Kişi Sayısı */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Kişi Sayısı</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={fields.personCount}
                  onChange={() =>
                    setFields({ ...fields, personCount: !fields.personCount })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
            </label>

            {/* Açıklama */}
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Açıklama</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={fields.notes}
                  onChange={() =>
                    setFields({ ...fields, notes: !fields.notes })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
            </label>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

// ReservationDetailsModal bileşenini güncelle
const ReservationDetailsModal = ({
  isOpen,
  onClose,
  event,
}: {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}) => {
  const [customers, setCustomers] = useState<number[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [customerFields, setCustomerFields] = useState<CustomerFields>({
    name: false,
    surname: false,
    phone: false,
    personCount: false,
    notes: false,
  });
  const capacity = event.resource?.capacity || 1;

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen && event.id) {
      const savedCustomers = localStorage.getItem(`customers-${event.id}`);
      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers));
      }

      // Load saved field settings
      const savedFields = localStorage.getItem(`customerFields-${event.id}`);
      if (savedFields) {
        setCustomerFields(JSON.parse(savedFields) as CustomerFields);
      }
    }
  }, [isOpen, event.id]);

  // Save customers to localStorage when they change
  useEffect(() => {
    if (event.id) {
      if (customers.length > 0) {
        localStorage.setItem(
          `customers-${event.id}`,
          JSON.stringify(customers)
        );
      } else {
        localStorage.removeItem(`customers-${event.id}`);
      }
    }
  }, [customers, event.id]);

  // Save field settings to localStorage when they change
  const handleFieldSettingsSave = (fields: CustomerFields) => {
    setCustomerFields(fields);
    if (event.id) {
      localStorage.setItem(
        `customerFields-${event.id}`,
        JSON.stringify(fields)
      );
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-lg p-8 w-[70%] max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-base font-medium text-gray-900">
              Rezervasyon Detayları
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Reservation Info Section */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-5 rounded-lg">
            {/* Reservation Name */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 mb-1">Rezervasyon Adı</div>
              <div className="text-sm font-medium text-gray-900">
                {event.title}
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 mb-1">Tarih ve Saat</div>
              <div className="text-sm font-medium text-gray-900">
                {format(event.start, "d MMMM yyyy • HH:mm", { locale: tr })} -{" "}
                {format(event.end, "HH:mm", { locale: tr })}
              </div>
            </div>

            {/* Capacity */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 mb-1">Kontenjan</div>
              <div className="text-sm font-medium text-gray-900">
                {customers.length}/{capacity}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-base font-medium text-gray-900">Notlar</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Add Note Button */}
              <button className="h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <svg
                    className="w-4 h-4 text-violet-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Not Ekle
                </span>
              </button>

              {/* Example Note 1 */}
              <div className="h-32 bg-yellow-50 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                <div className="h-full flex flex-col">
                  <div className="text-sm text-yellow-800 line-clamp-4">
                    Müşteri özel istekleri: Pencere kenarı tercih edilecek
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between text-xs text-yellow-600">
                    <span>14:30</span>
                    <button className="hover:text-yellow-800">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Example Note 2 */}
              <div className="h-32 bg-blue-50 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                <div className="h-full flex flex-col">
                  <div className="text-sm text-blue-800 line-clamp-4">
                    Doğum günü kutlaması için pasta siparişi verilecek
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between text-xs text-blue-600">
                    <span>15:45</span>
                    <button className="hover:text-blue-800">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customers Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-base font-medium text-gray-900">
                Müşteriler
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-900">1. Müşteri</div>
              <button className="px-6 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center w-60 gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Settings Modal */}
          <CustomerFieldsSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSave={handleFieldSettingsSave}
            initialFields={customerFields}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
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

  const CustomToolbar = ({ date, onNavigate, onView, view }: any) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = isSameDay(date, new Date());

    return (
      <div className="flex items-center justify-between mb-4 px-2">
        {/* Sol: Ay seçici ve navigasyon */}
        <div className="flex items-center gap-2 w-1/3">
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

        {/* Orta: Tarih gösterimi (sadece gün görünümünde) */}
        <div className="flex justify-center w-1/3">
          {view === "day" && (
            <div className="text-sm">
              <span
                className={`font-medium ${
                  isToday ? "text-violet-600" : "text-gray-900"
                }`}
              >
                {format(date, "d MMMM yyyy", { locale: tr })}
              </span>
              <span
                className={`ml-2 ${
                  isWeekend ? "text-red-500" : "text-gray-500"
                }`}
              >
                {format(date, "EEEE", { locale: tr })}
              </span>
            </div>
          )}
        </div>

        {/* Sağ: Görünüm seçenekleri */}
        <div className="flex justify-end w-1/3">
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
      </div>
    );
  };

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
      } else if (view === "month") {
        // Mevcut ayın günlerine tıklandığında hafta görünümüne geç
        setDate(selectedDay);
        setView("week");
      } else {
        // Hafta görünümünde randevu oluşturma modalını aç
        setSelectedSlot(slotInfo);
        setIsCreateModalOpen(true);
      }
    },
    [date, view]
  );

  const eventPropGetter = useCallback((event: Event) => {
    return {
      className: event.resource?.isPast ? "past-event" : "",
    };
  }, []);

  return (
    <div className="h-[calc(100vh-80px)] p-2 transition-all duration-300 ease-in-out">
      <Card className="bg-white rounded-3xl shadow-sm overflow-hidden h-full w-full">
        <div className="p-2 h-full flex flex-col">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%", width: "100%" }}
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
            eventPropGetter={eventPropGetter}
            components={{
              toolbar: CustomToolbar,
              week: {
                header: WeekHeader,
              },
              event: (props) => (
                <CustomEvent {...props} onEventUpdate={loadEvents} />
              ),
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
