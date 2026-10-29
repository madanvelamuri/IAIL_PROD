
import React, { useState } from "react";
import API from "../services/api";
import StarBackground from "../components/StarBackground";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    requestedRole: "user",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !form.password) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 8 || form.password.length > 72) {
      setError("Password must contain between 8 and 72 characters.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/access-requests", {
        name: cleanName,
        email: cleanEmail,
        password: form.password,
        requestedRole: form.requestedRole,
      });

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        password: "",
        requestedRole: "user",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 py-8">
      <StarBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-[0_0_80px_rgba(0,255,255,0.15)] backdrop-blur-3xl sm:p-12"
      >
        <h2 className="mb-4 text-center text-3xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
          Request Access
        </h2>

        <p className="mb-8 text-center text-sm leading-6 text-gray-300">
          Submit your details to request access to the Mistake Tracking
          &amp; Analysis System. An administrator will review your request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FULL NAME */}
          <div>
            <label
              htmlFor="request-name"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Full Name
            </label>

            <input
              id="request-name"
              name="name"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-black outline-none transition focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* EMAIL ADDRESS */}
          <div>
            <label
              htmlFor="request-email"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Email Address
            </label>

            <input
              id="request-email"
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              placeholder="Enter your work email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-black outline-none transition focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="request-password"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Password
            </label>

            <input
              id="request-password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-black outline-none transition focus:ring-2 focus:ring-cyan-400"
            />

            <p className="mt-2 text-xs leading-5 text-gray-400">
              Use 8–72 characters. Your password must be securely hashed
              by the server before it is stored.
            </p>
          </div>

          {/* REQUESTED ROLE */}
          <div>
            <label
              htmlFor="request-role"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Requested Role
            </label>

            <select
              id="request-role"
              name="requestedRole"
              value={form.requestedRole}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-white/95 px-4 py-3 text-black outline-none transition focus:ring-2 focus:ring-cyan-400"
            >
              <option value="user">User</option>
              <option value="admin">
                Administrator (approval required)
              </option>
            </select>

            <p className="mt-2 text-xs leading-5 text-gray-400">
              The selected role is only a request. Administrator access
              requires explicit approval.
            </p>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || success}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 py-4 font-bold tracking-wide text-slate-900 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Submitting..."
              : success
                ? "Request Submitted ✓"
                : "Submit Access Request"}
          </button>

          {/* ERROR MESSAGE */}
          {error && (
            <p
              role="alert"
              className="text-center text-sm font-semibold text-red-400"
            >
              {error}
            </p>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div
              role="status"
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center text-sm leading-6 text-emerald-300"
            >
              Your access request has been submitted successfully.
              Please wait for administrator review.
            </div>
          )}
        </form>

        {/* LOGIN LINK */}
        <div className="mt-8 text-center text-sm text-gray-300">
          Already have an account?{" "}
          <a
            href="/"
            className="font-semibold text-cyan-400 transition hover:text-emerald-400"
          >
            Login here
          </a>
        </div>

        <p className="mt-8 text-center text-sm tracking-wide text-gray-500">
          Mistake Tracking &amp; Analysis System
        </p>
      </motion.div>
    </div>
  );
}
