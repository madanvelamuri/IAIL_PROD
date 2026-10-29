
import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function ProLayout({ children }) {
  const location = useLocation();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Add Mistake",
      path: "/add-mistake",
    },
    {
      label: "Teams Notifications",
      path: "/teams-notifications",
    },
    {
      label: "Creator Dashboard",
      path: "/creator",
    },
  ];

  const linkClass = (path) => {
    const isActive = location.pathname === path;

    return [
      "block px-4 py-3 rounded-lg transition",
      isActive
        ? "bg-indigo-600 text-white font-semibold"
        : "text-gray-200 hover:bg-slate-700",
    ].join(" ");
  };

  const displayName = user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 text-2xl font-bold border-b border-slate-700">
          IAIL
          <p className="text-xs text-gray-400 font-normal mt-1">
            Mistake Tracking System
          </p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={linkClass(item.path)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* USER AND LOGOUT */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold">
              {initial}
            </div>

            <div className="min-w-0">
              <p className="font-medium truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-400">
                Logged in
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-700">
            Mistake Tracking System
          </h1>

          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">
              {displayName}
            </span>

            <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
              {initial}
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
