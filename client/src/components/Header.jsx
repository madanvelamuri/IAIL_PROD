import React from "react";

export default function Header() {
  const token = localStorage.getItem("token");

  let userName = "";

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userName = payload.name;
    } catch (err) {
      userName = "";
    }
  }

  return (
    <div className="flex justify-between items-center bg-white shadow px-8 py-4">
      <h1 className="text-xl font-semibold">Mistake Tracking System</h1>

      <div className="flex items-center gap-4">
        <span className="text-gray-600 font-medium">
          {userName}
        </span>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.reload();
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}