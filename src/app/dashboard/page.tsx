"use client";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Hoş Geldiniz</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* İstatistik Kartları */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Bugünkü Randevular
          </h3>
          <p className="text-3xl font-bold text-violet-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Toplam Müşteri
          </h3>
          <p className="text-3xl font-bold text-violet-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Bu Ayki Gelir
          </h3>
          <p className="text-3xl font-bold text-violet-600">₺0</p>
        </div>
      </div>
    </div>
  );
}
