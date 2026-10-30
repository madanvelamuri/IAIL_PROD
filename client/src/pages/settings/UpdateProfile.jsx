
import React, { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Save,
  RotateCcw,
  CircleUserRound,
} from "lucide-react";

import API from "../../api/API";

export default function UpdateProfile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Load existing user details
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setMessage("");

    // Load cached details first
    try {
      const cachedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      setForm({
        name: cachedUser.name || "",
        email: cachedUser.email || "",
        mobile: cachedUser.mobile || "",
      });
    } catch {
      console.error("Unable to read cached user details.");
    }

    try {
      // Fetch latest profile from backend
      const response = await API.get("/settings/profile");

      const user = response.data.user || response.data;

      setForm({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
      });

      // Update cached user details
      const oldUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...user,
        })
      );
    } catch (error) {
      console.error("Profile loading failed:", error);

      if (!error.response) {
        setMessage(
          "Unable to connect to the server. Showing saved profile details."
        );
        setMessageType("error");
      } else if (error.response.status !== 404) {
        setMessage(
          error.response.data?.message ||
          "Unable to load the latest profile details."
        );
        setMessageType("error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!form.name.trim()) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    if (!form.email.trim()) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    if (
      form.mobile.trim() &&
      !/^[0-9+\-\s()]{7,20}$/.test(form.mobile.trim())
    ) {
      setMessage("Please enter a valid mobile number.");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
      };

      const response = await API.put(
        "/settings/profile",
        payload
      );

      const updatedUser = response.data.user || response.data;

      // Update form with backend response
      setForm({
        name: updatedUser.name || payload.name,
        email: updatedUser.email || payload.email,
        mobile: updatedUser.mobile || payload.mobile,
      });

      // Update local storage
      const oldUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          ...updatedUser,
          name: updatedUser.name || payload.name,
          email: updatedUser.email || payload.email,
          mobile: updatedUser.mobile || payload.mobile,
        })
      );

      setMessage("Profile updated successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Profile update failed:", error);

      setMessage(
        error.response?.data?.message ||
        "Unable to update profile. Please try again."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // Reset form to saved profile
  const handleReset = () => {
    loadProfile();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <p className="text-gray-500 font-medium">
          Loading profile...
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 pl-11 " +
    "outline-none transition focus:ring-2 focus:ring-indigo-500 " +
    "focus:border-indigo-500";

  return (
    <div className="max-w-4xl mx-auto">

      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <CircleUserRound size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Update Profile
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage your personal account information.
            </p>
          </div>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* CARD HEADER */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Personal Information
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Update your name, email address and mobile number.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >

          {/* NAME */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={255}
                className={inputClass}
              />
            </div>
          </div>

          {/* MOBILE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile Number
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="tel"
                name="mobile"
                placeholder="Enter your mobile number"
                value={form.mobile}
                onChange={handleChange}
                maxLength={20}
                className={inputClass}
              />
            </div>
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                messageType === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">

            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
