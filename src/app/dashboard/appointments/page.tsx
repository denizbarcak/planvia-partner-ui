"use client";

import { useState, useEffect } from "react";

interface Event {
  title: string;
  start: Date;
  end: Date;
}

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState<Event[]>([]);

  // Ayın ilk gününü al
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  // Ayın son gününü al
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // Ayın ilk gününün haftanın hangi günü olduğunu al (0 = Pazar, 1 = Pazartesi, ...)
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Takvimde gösterilecek günleri oluştur
  const days = [];
  const totalDays = lastDayOfMonth.getDate();

  // Önceki aydan gösterilecek günler
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  // Bu ayın günleri
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const weekDays = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Randevular</h1>
        <button className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
          + Yeni Randevu
        </button>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        {/* Takvim Başlığı */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Takvim */}
        <div className="grid grid-cols-7 gap-1">
          {/* Haftanın Günleri */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center py-2 text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}

          {/* Günler */}
          {days.map((day, index) => (
            <div
              key={index}
              className={`
                aspect-square p-2 border rounded-lg
                ${
                  day === null
                    ? "bg-gray-50"
                    : "hover:bg-gray-50 cursor-pointer"
                }
                ${
                  day === currentDate.getDate() &&
                  "bg-violet-100 text-violet-600 font-medium"
                }
              `}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
