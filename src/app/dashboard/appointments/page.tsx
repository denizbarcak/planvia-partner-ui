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
} from "date-fns";
import { tr } from "date-fns/locale";
import { Card } from "@tremor/react";
import { Dialog } from "@headlessui/react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: tr }),
  getDay,
  locales: { tr },
});

// Özel formatlayıcılar
const formats = {
  dayFormat: "d",
  dayHeaderFormat: "d",
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "d", { locale: tr })} - ${format(end, "d", {
      locale: tr,
    })}`,
  weekdayFormat: "EEE",
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
}

const CreateEventModal = ({
  isOpen,
  onClose,
  selectedSlot,
}: CreateEventModalProps) => {
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedSlot) {
      setEndTime(selectedSlot.end);
    }
  }, [selectedSlot]);

  const adjustEndTime = (minutes: number) => {
    if (endTime) {
      const newEndTime = new Date(endTime.getTime() + minutes * 60000);
      setEndTime(newEndTime);
    }
  };

  if (!selectedSlot) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl p-6 w-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-violet-600 uppercase tracking-wide">
              FOCUS SÜRESİ
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

          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6">
            Focus süresi
          </Dialog.Title>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900">
                  {format(selectedSlot.start, "d MMM EEE", { locale: tr })}
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900">
                  {format(selectedSlot.start, "HH:mm")}
                </div>
                <span className="text-gray-500">-</span>
                <div className="flex items-center">
                  <input
                    type="time"
                    value={endTime ? format(endTime, "HH:mm") : ""}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      const newEndTime = new Date(selectedSlot.start);
                      newEndTime.setHours(hours);
                      newEndTime.setMinutes(minutes);
                      setEndTime(newEndTime);
                    }}
                    className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 w-20"
                  />
                  <div className="flex flex-col ml-1">
                    <button
                      onClick={() => adjustEndTime(30)}
                      className="p-1 hover:bg-gray-100 rounded-t-lg"
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
                      className="p-1 hover:bg-gray-100 rounded-b-lg"
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="email"
                placeholder="E-posta"
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
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

export default function Appointments() {
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Initialize with current date
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Saç Kesimi - Ahmet Yılmaz",
      start: new Date(2024, 2, 15, 10, 0),
      end: new Date(2024, 2, 15, 11, 0),
    },
    {
      id: "2",
      title: "Sakal Tıraşı - Mehmet Kaya",
      start: new Date(2024, 2, 15, 14, 30),
      end: new Date(2024, 2, 15, 15, 0),
    },
  ]);

  // Tarih seçici için ay başlangıç ve bitiş günlerini hesapla
  const monthStart = startOfMonth(datePickerMonth);
  const monthDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { locale: tr }),
    end: endOfWeek(addDays(monthStart, getDaysInMonth(monthStart) - 1), {
      locale: tr,
    }),
  });

  // Tarih seçici için hafta başlıkları
  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const handleSelectEvent = (event: Event) => {
    console.log("Seçilen randevu:", event);
  };

  // Seçilen günün haftasının başlangıç gününü hesapla
  const calculateWeekViewDate = (date: Date) => {
    const weekStart = startOfWeek(date, { locale: tr });
    return date; // Seçilen tarihi doğrudan döndür
  };

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const selectedDay = startOfDay(start);
      setSelectedDate(selectedDay);

      // Seçilen gün mevcut ayın dışındaysa
      const currentMonth = currentDate.getMonth();
      const selectedMonth = selectedDay.getMonth();

      if (selectedMonth !== currentMonth) {
        // Sadece ay değişimi yap, hafta görünümüne geçme
        setCurrentDate(selectedDay);
      } else if (currentView === "month") {
        // Mevcut ayın günlerine tıklandığında hafta görünümüne geç
        setCurrentView("week");
        setCurrentDate(selectedDay);
      } else {
        setSelectedSlot({ start, end });
        setIsCreateEventOpen(true);
      }
    },
    [currentView, currentDate]
  );

  const handleDrillDown = useCallback(
    (date: Date) => {
      const selectedDay = startOfDay(date);
      setSelectedDate(selectedDay);

      // Seçilen gün mevcut ayın dışındaysa
      const currentMonth = currentDate.getMonth();
      const selectedMonth = selectedDay.getMonth();

      if (selectedMonth !== currentMonth) {
        // Sadece ay değişimi yap, hafta görünümüne geçme
        setCurrentDate(selectedDay);
      } else if (currentView === "month") {
        // Mevcut ayın günlerine tıklandığında hafta görünümüne geç
        setCurrentView("week");
        setCurrentDate(selectedDay);
      }
    },
    [currentView, currentDate]
  );

  const dayPropGetter = useCallback(
    (date: Date) => {
      const isToday = isSameDay(date, new Date());
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      return {
        className: `${isToday ? "current-day" : ""} ${
          isSelected ? "selected-day" : ""
        }`,
        style: {
          backgroundColor: "transparent",
        },
      };
    },
    [selectedDate]
  );

  // Saat dilimlerini artık mor yapmayacağız
  const slotPropGetter = (date: Date) => {
    return {};
  };

  return (
    <div className="h-[calc(100vh-80px)] p-2">
      <Card className="bg-white rounded-3xl shadow-sm overflow-hidden h-full">
        <div className="p-2 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
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
                <span>{format(currentDate, "MMMM yyyy", { locale: tr })}</span>
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

              {/* Navigasyon ve Bugün Butonları */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setCurrentDate((prev) => subDays(prev, 1))}
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
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDate(today);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Bugün
                </button>

                <button
                  onClick={() => setCurrentDate((prev) => addDays(prev, 1))}
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

            {/* Görünüm Seçenekleri */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView("month")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  currentView === "month"
                    ? "bg-violet-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Ay
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  currentView === "week"
                    ? "bg-violet-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Hafta
              </button>
              <button
                onClick={() => setCurrentView("day")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  currentView === "day"
                    ? "bg-violet-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Gün
              </button>
            </div>
          </div>

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
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, index) => {
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth =
                      day.getMonth() === datePickerMonth.getMonth();
                    const isTodayDate = isToday(day);

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentDate(day);
                          setSelectedDate(day);
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

          {/* Takvim */}
          <div className="flex-1 min-h-0">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              messages={messages}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={(date) => {
                setCurrentDate(date);
                setSelectedDate(date);
              }}
              views={["month", "week", "day"]}
              formats={formats}
              selectable
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onDrillDown={handleDrillDown}
              dayPropGetter={dayPropGetter}
              slotPropGetter={slotPropGetter}
              style={{ height: "100%" }}
              popup
              culture="tr"
              className="custom-calendar"
              step={30}
              timeslots={1}
            />
          </div>
        </div>
      </Card>

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        selectedSlot={selectedSlot}
      />

      <style jsx global>{`
        .custom-calendar {
          height: 100% !important;
        }

        .custom-calendar .rbc-toolbar {
          margin-bottom: 8px;
          padding: 0 4px;
        }

        .custom-calendar .rbc-toolbar {
          display: none;
        }

        .custom-calendar .rbc-header {
          padding: 8px;
          font-weight: 500;
          color: #4b5563;
          font-size: 0.875rem;
        }

        .custom-calendar .rbc-header:nth-last-child(-n + 2) {
          color: #ef4444;
        }

        .custom-calendar .rbc-event {
          background-color: #8b5cf6;
          border-radius: 6px;
          padding: 2px 6px;
          border: none;
          font-size: 0.75rem;
        }

        .custom-calendar .rbc-today {
          background-color: #dbeafe;
        }

        .custom-calendar .rbc-off-range-bg {
          background-color: #f8fafc;
        }

        .custom-calendar .rbc-month-view,
        .custom-calendar .rbc-time-view {
          border-radius: 12px;
          border-color: #e2e8f0;
        }

        .custom-calendar .rbc-calendar {
          width: 100%;
          min-width: 100%;
        }

        .custom-calendar .rbc-month-view {
          min-width: 100%;
          flex: 1;
          min-height: 0;
        }

        .custom-calendar .rbc-month-row {
          min-height: 6rem;
        }

        .custom-calendar .rbc-date-cell {
          padding: 4px;
          font-size: 0.875rem;
        }

        .custom-calendar .rbc-date-cell.rbc-now {
          color: #ef4444;
          font-weight: 500;
        }

        .custom-calendar .rbc-time-header-content {
          border-left: 1px solid #e2e8f0;
        }

        .custom-calendar .rbc-time-view {
          background: white;
        }

        .custom-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #e2e8f0;
        }

        .custom-calendar .rbc-time-slot {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .custom-calendar .rbc-current-time-indicator {
          background-color: #8b5cf6;
        }

        .selected-day {
          background-color: #f3e8ff;
        }

        .custom-calendar .rbc-time-header-cell.selected-day {
          background-color: #f3e8ff;
        }

        .custom-calendar .rbc-time-header-cell.selected-day .rbc-header {
          background-color: #f3e8ff;
        }

        .custom-calendar .rbc-time-content {
          border-top: 1px solid #e2e8f0;
        }

        .custom-calendar .selected-slot {
          background-color: transparent !important;
        }

        .custom-calendar .rbc-month-view {
          border: none;
          background: white;
        }

        .custom-calendar .rbc-month-row {
          border-top: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-day-bg {
          border-left: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-off-range-bg {
          background: white;
        }

        .custom-calendar .rbc-off-range {
          color: #d1d5db !important;
        }

        .custom-calendar .rbc-header {
          border-bottom: none;
          padding: 8px 0;
          font-weight: 500;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .custom-calendar .rbc-header + .rbc-header {
          border-left: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-date-cell {
          padding: 4px 8px;
          text-align: left;
          font-size: 0.875rem;
          color: #111827;
        }

        /* Bugünün tarihini daha belirgin yapma */
        .custom-calendar .rbc-date-cell.rbc-now {
          position: relative;
          padding-left: 0;
        }

        .custom-calendar .rbc-date-cell.rbc-now > * {
          position: relative;
          z-index: 1;
          color: white;
          font-weight: 500;
          margin-left: 4px;
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .custom-calendar .rbc-date-cell.rbc-now::before {
          content: "";
          position: absolute;
          left: 4px;
          top: 4px;
          width: 24px;
          height: 24px;
          background-color: rgb(124, 58, 237);
          border-radius: 50%;
          z-index: 0;
        }

        .custom-calendar .rbc-today {
          background-color: #f5f3ff;
        }

        /* Cumartesi ve Pazar günleri için kırmızı renk */
        .custom-calendar .rbc-header:nth-child(6),
        .custom-calendar .rbc-header:nth-child(7) {
          color: #ef4444;
        }

        /* Cumartesi ve Pazar günlerinin tarihleri için kırmızı renk */
        .custom-calendar .rbc-date-cell:nth-child(6),
        .custom-calendar .rbc-date-cell:nth-child(7) {
          color: #ef4444;
        }

        /* Önceki ve sonraki ayların Cumartesi ve Pazar günleri için soluk kırmızı */
        .custom-calendar .rbc-off-range.rbc-date-cell:nth-child(6),
        .custom-calendar .rbc-off-range.rbc-date-cell:nth-child(7) {
          color: #fca5a5 !important;
        }

        .custom-calendar .selected-day {
          background-color: rgba(124, 58, 237, 0.12) !important;
          border-radius: 6px;
          position: relative;
        }

        .custom-calendar .selected-day::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid rgba(124, 58, 237, 0.3);
          border-radius: 6px;
          pointer-events: none;
        }

        .custom-calendar .selected-day .rbc-date-cell {
          color: rgb(124, 58, 237) !important;
          font-weight: 500;
        }

        /* Bugünün tarihi seçiliyse */
        .custom-calendar .selected-day .rbc-date-cell.rbc-now::before {
          background-color: white;
          border: 2px solid rgb(124, 58, 237);
        }

        .custom-calendar .rbc-row-content {
          z-index: 0;
        }

        .custom-calendar .rbc-row-segment {
          padding: 2px 4px;
        }

        .custom-calendar .rbc-event {
          background-color: #4f46e5;
          border-radius: 4px;
          color: white;
          padding: 2px 6px;
          font-size: 0.75rem;
        }

        .custom-calendar .rbc-today {
          background-color: #f5f3ff;
        }

        .custom-calendar .rbc-selected {
          background-color: #4f46e5 !important;
        }

        .custom-calendar .rbc-show-more {
          color: #4f46e5;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .custom-calendar .rbc-time-view {
          border: none;
        }

        .custom-calendar .rbc-time-header {
          border-bottom: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-time-content {
          border-top: none;
        }

        .custom-calendar .rbc-time-slot {
          border-top: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-timeslot-group {
          border-bottom: none;
        }

        .custom-calendar .rbc-time-gutter {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .custom-calendar .rbc-allday-cell {
          display: none;
        }

        .custom-calendar .rbc-time-header-gutter {
          border-right: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-time-header-content {
          border-left: none;
        }

        .custom-calendar .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }

        .custom-calendar .rbc-current-time-indicator {
          background-color: #4f46e5;
        }

        .custom-calendar .rbc-label {
          padding: 4px 8px;
        }

        .custom-calendar .rbc-time-content > * + * > * {
          border-left: 1px solid #e5e7eb;
        }

        .custom-calendar .rbc-agenda-view table.rbc-agenda-table {
          border: none;
        }

        .custom-calendar
          .rbc-agenda-view
          table.rbc-agenda-table
          tbody
          > tr
          > td {
          padding: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .custom-calendar
          .rbc-agenda-view
          table.rbc-agenda-table
          .rbc-agenda-time-cell {
          padding: 8px;
          border-right: 1px solid #e5e7eb;
        }

        .custom-calendar
          .rbc-agenda-view
          table.rbc-agenda-table
          thead
          > tr
          > th {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
