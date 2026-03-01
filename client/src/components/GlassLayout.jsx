import React from "react";

export default function GlassLayout({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white p-6">
        <h1 className="text-2xl font-bold mb-10">IAIL</h1>

        <nav className="space-y-4">
          <a href="#" className="block hover:text-gray-300">
            Dashboard
          </a>
          <a href="#" className="block hover:text-gray-300">
            Add Mistake
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Top Header */}
        <header className="flex justify-between items-center px-8 py-4 bg-white shadow-md">

          <h2 className="text-xl font-semibold">
            Mistake Tracking System
          </h2>

          <div className="flex items-center gap-4">

            {/* User Badge */}
            <div className="flex items-center gap-3 bg-indigo-100 px-4 py-2 rounded-full">

              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                {user?.name?.charAt(0)}
              </div>

              <span className="text-sm font-medium text-gray-800">
                {user?.name}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}