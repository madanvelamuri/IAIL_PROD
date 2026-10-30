
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Settings,
  ChevronDown,
  ChevronRight,
  UserRound,
  LockKeyhole,
  MessageSquareWarning,
  CircleHelp,
} from "lucide-react";

export default function ProLayout({ children }) {
  const location = useLocation();

  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/settings") ||
    location.pathname === "/feedback"
  );

  // ==========================================
  // USER DETAILS
  // ==========================================

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const displayName = user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  // ==========================================
  // MAIN NAVIGATION
  // ==========================================

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

  // ==========================================
  // SETTINGS NAVIGATION
  // ==========================================

  const settingsItems = [
    {
      label: "Update Profile",
      path: "/settings/profile",
      icon: UserRound,
    },
    {
      label: "Update Password",
      path: "/settings/password",
      icon: LockKeyhole,
    },
    {
      label: "Feedback",
      path: "/feedback",
      icon: MessageSquareWarning,
    },
    {
      label: "Help",
      path: "/settings/help",
      icon: CircleHelp,
    },
  ];

  // ==========================================
  // NAVIGATION ACTIVE CLASS
  // ==========================================

  const linkClass = (path) => {
    const isActive = location.pathname === path;

    return [
      "block px-4 py-3 rounded-lg transition",
      isActive
        ? "bg-indigo-600 text-white font-semibold"
        : "text-gray-200 hover:bg-slate-700",
    ].join(" ");
  };

  // ==========================================
  // SETTINGS ACTIVE STATE
  // ==========================================

  const isSettingsActive = (path) => {
    return location.pathname === path;
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="flex h-screen bg-gray-100">

      {/* ==================================
          SIDEBAR
      ================================== */}

      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">

        {/* LOGO */}

        <div className="p-6 text-2xl font-bold border-b border-slate-700">
          IAIL

          <p className="text-xs text-gray-400 font-normal mt-1">
            Mistake Tracking System
          </p>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

          {/* MAIN NAVIGATION */}

          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={linkClass(item.path)}
            >
              {item.label}
            </Link>
          ))}

          {/* ==================================
              SETTINGS MENU
          ================================== */}

          <div className="pt-2">

            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              aria-expanded={settingsOpen}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition text-gray-200 hover:bg-slate-700"
            >

              <span className="flex items-center gap-3">
                <Settings size={19} />
                Settings
              </span>

              <ChevronDown
                size={17}
                className={`transition-transform duration-200 ${
                  settingsOpen ? "rotate-180" : ""
                }`}
              />

            </button>

            {/* SETTINGS ITEMS */}

            {settingsOpen && (
              <div className="mt-2 ml-3 space-y-1">

                {settingsItems.map((item) => {
                  const Icon = item.icon;

                  const isActive = isSettingsActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5
                        rounded-lg text-sm transition
                        ${
                          isActive
                            ? "bg-sky-500 text-white font-semibold"
                            : "text-blue-100 hover:bg-sky-500"
                        }`}
                    >

                      <span className="text-blue-300">
                        ·
                      </span>

                      <Icon size={15} />

                      <span>
                        {item.label}
                      </span>

                      {item.label === "Help" && (
                        <ChevronRight
                          size={16}
                          className="ml-auto"
                        />
                      )}

                    </Link>
                  );
                })}

              </div>
            )}

          </div>

        </nav>

        {/* ==================================
            USER AND LOGOUT
        ================================== */}

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

      {/* ==================================
          MAIN CONTENT
      ================================== */}

      <div className="flex-1 min-w-0 flex flex-col">

        {/* HEADER */}

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

        {/* PAGE CONTENT */}

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
