"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  { name: "Ana Sayfa", icon: HomeIcon, href: "/dashboard" },
  { name: "Randevular", icon: CalendarIcon, href: "/dashboard/appointments" },
  { name: "Müşteriler", icon: UsersIcon, href: "/dashboard/customers" },
  { name: "Raporlar", icon: ChartBarIcon, href: "/dashboard/reports" },
  { name: "Ayarlar", icon: Cog6ToothIcon, href: "/dashboard/settings" },
];

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Bu kısım daha sonra API'den gelecek
  const partnerInfo = {
    companyName: "Örnek İşletme",
  };

  return (
    <div
      className={`bg-white h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out shadow-lg ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-between border-b">
        <Link
          href="/dashboard"
          className={`logo-text text-xl ${!isExpanded && "hidden"}`}
        >
          PlanVia
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <ArrowLeftCircleIcon className="w-6 h-6 text-gray-500" />
          ) : (
            <ArrowRightCircleIcon className="w-6 h-6 text-gray-500" />
          )}
        </button>
      </div>

      {/* Profil Bölümü */}
      <div className="px-4 py-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <UserCircleIcon className="w-10 h-10 text-gray-400" />
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {partnerInfo.companyName}
              </p>
              <p className="text-xs text-gray-500">İşletme Hesabı</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="mt-6 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-3 mb-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-violet-100 text-violet-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {isExpanded && (
                <span className="ml-3 text-sm font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
