import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">IAIL</h2>

        <nav className="space-y-4">
          <Link
            to="/dashboard"
            className="block hover:text-blue-300"
          >
            Dashboard
          </Link>

          <Link
            to="/add-mistake"
            className="block hover:text-blue-300"
          >
            Add Mistake
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}