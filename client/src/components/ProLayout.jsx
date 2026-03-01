import React from "react";
import { Link } from "react-router-dom";

export default function ProLayout({ children }) {

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-gray-100">

      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-slate-700">
          IAIL
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            Dashboard
          </Link>

          <Link
            to="/add-mistake"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            Add Mistake
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">

        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-700">
            Mistake Tracking System
          </h1>

          <div className="flex items-center space-x-4">
            <div className="text-gray-600 font-medium">
              {user?.name}
            </div>

            <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}