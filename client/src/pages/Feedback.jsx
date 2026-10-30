
import React, { useCallback, useEffect, useState } from "react";

import {
  SlidersHorizontal,
  RefreshCw,
  Lightbulb,
  MessageSquare,
  Bug,
  Sparkles,
  Clock3,
  UserRound,
  Plus,
  X,
  Star,
  Send,
} from "lucide-react";

import API from "../services/api";

// ==========================================
// CONSTANTS
// ==========================================

const categories = [
  "Suggestion",
  "General",
  "Bug Report",
  "Feature Request",
];

const statuses = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

const categoryIcons = {
  Suggestion: Lightbulb,
  General: MessageSquare,
  "Bug Report": Bug,
  "Feature Request": Sparkles,
};

// ==========================================
// TIME AGO
// ==========================================

function timeAgo(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(days / 365)}y ago`;
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }) {
  const normalizedStatus = status || "Open";

  const styles = {
    Open: "bg-orange-50 text-orange-600 border-orange-200",

    "In Progress":
      "bg-blue-50 text-blue-600 border-blue-200",

    Resolved:
      "bg-green-50 text-green-600 border-green-200",

    Closed:
      "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[normalizedStatus] || styles.Open
      }`}
    >
      <Clock3 size={13} />

      {normalizedStatus}
    </span>
  );
}

// ==========================================
// STAR RATING
// ==========================================

function Rating({
  value = 5,
  interactive = false,
  onChange,
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={
            interactive
              ? "cursor-pointer"
              : "cursor-default"
          }
        >
          <Star
            size={interactive ? 27 : 16}
            className={
              star <= Number(value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

// ==========================================
// FEEDBACK COMPONENT
// ==========================================

export default function Feedback() {
  const [feedback, setFeedback] = useState([]);

  // Filters
  const [typeFilter, setTypeFilter] =
    useState("All Types");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);

  // Form
  const [category, setCategory] =
    useState("Suggestion");

  const [message, setMessage] = useState("");

  const [rating, setRating] = useState(5);

  // Loading states
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  // Notifications
  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ==========================================
  // CURRENT USER
  // ==========================================

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  const isAdmin = user.role === "admin";

  // ==========================================
  // LOAD FEEDBACK FROM DATABASE
  // ==========================================

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/feedback");

      console.log(
        "[Feedback] API response:",
        response.data
      );

      const responseData = response.data;

      // Support different response structures.
      const feedbackList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.feedback)
          ? responseData.feedback
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

      setFeedback(feedbackList);

    } catch (err) {
      console.error(
        "[Feedback] Loading failed:",
        err.response?.data || err
      );

      setFeedback([]);

      setError(
        err.response?.data?.message ||
          "Unable to load feedback. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // ==========================================
  // FILTER FEEDBACK
  // ==========================================

  const filteredFeedback = feedback.filter((item) => {
    const matchesType =
      typeFilter === "All Types" ||
      item.category === typeFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (item.status || "Open").toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesType && matchesStatus;
  });

  // ==========================================
  // SUBMIT FEEDBACK
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Please enter your feedback.");
      return;
    }

    if (message.trim().length > 3000) {
      setError(
        "Feedback cannot exceed 3000 characters."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        category,
        message: message.trim(),
        rating,
      };

      const response = await API.post(
        "/feedback",
        payload
      );

      console.log(
        "[Feedback] Submitted:",
        response.data
      );

      setSuccess(
        "Feedback submitted successfully."
      );

      setMessage("");
      setRating(5);
      setCategory("Suggestion");
      setShowModal(false);

      // Reload feedback after successful submission.
      await loadFeedback();

    } catch (err) {
      console.error(
        "[Feedback] Submission failed:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Unable to submit feedback. Please try again."
      );

    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // UPDATE FEEDBACK STATUS
  // ADMIN ONLY
  // ==========================================

  const updateStatus = async (id, status) => {
    try {
      setError("");

      await API.patch(
        `/feedback/${id}/status`,
        { status }
      );

      setSuccess(
        "Feedback status updated successfully."
      );

      await loadFeedback();

    } catch (err) {
      console.error(
        "[Feedback] Status update failed:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update feedback status."
      );
    }
  };

  // ==========================================
  // RESET FILTERS
  // ==========================================

  const resetFilters = () => {
    setTypeFilter("All Types");
    setStatusFilter("ALL");
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* ==================================
            FILTER SECTION
        ================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="flex items-center gap-3 text-lg font-bold text-gray-700">
              <SlidersHorizontal
                size={20}
                className="text-gray-500"
              />

              Filters
            </h2>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl px-3 py-3 text-sm text-gray-500 transition hover:bg-gray-100"
                title="Reset filters"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={loadFeedback}
                disabled={loading}
                className="rounded-xl bg-blue-50 p-3 text-blue-500 transition hover:bg-blue-100 disabled:opacity-50"
                title="Refresh feedback"
              >
                <RefreshCw
                  size={21}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
              </button>

            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* CATEGORY FILTER */}

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All Types">
                All Types
              </option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">
                All Statuses
              </option>

              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

          </div>
        </section>

        {/* ==================================
            SUCCESS MESSAGE
        ================================== */}

        {success && (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-bold"
            >
              <X size={17} />
            </button>

          </div>
        )}

        {/* ==================================
            ERROR MESSAGE
        ================================== */}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
            >
              <X size={17} />
            </button>

          </div>
        )}

        {/* ==================================
            FEEDBACK LIST
        ================================== */}

        {loading ? (

          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-500">
            <RefreshCw
              size={28}
              className="mx-auto mb-3 animate-spin text-blue-500"
            />

            Loading feedback...
          </div>

        ) : filteredFeedback.length === 0 ? (

          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">

            <MessageSquare
              size={42}
              className="mx-auto mb-3 text-gray-300"
            />

            <h3 className="font-semibold text-gray-700">
              No feedback found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing the filters or submit new feedback.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          <div className="space-y-6">

            {filteredFeedback.map((item) => {

              const CategoryIcon =
                categoryIcons[item.category] ||
                MessageSquare;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                >

                  {/* CARD HEADER */}

                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                    <div className="flex flex-wrap items-center gap-3">

                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">

                        <CategoryIcon size={15} />

                        {item.category}
                      </span>

                      <StatusBadge
                        status={item.status}
                      />

                    </div>

                    {/* STAR RATING */}

                    <div className="rounded-full bg-amber-50 px-3 py-1.5">
                      <Rating
                        value={Number(item.rating)}
                      />
                    </div>

                  </div>

                  {/* FEEDBACK MESSAGE */}

                  <p className="whitespace-pre-wrap break-words text-base leading-7 text-slate-700">
                    {item.message}
                  </p>

                  {/* EMPLOYEE AND DATE */}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-600">

                      <UserRound size={14} />

                      {item.employee_name || "User"}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-500">

                      <Clock3 size={14} />

                      {timeAgo(item.created_at)}
                    </span>

                  </div>

                  {/* ADMIN STATUS MANAGEMENT */}

                  {isAdmin && (
                    <div className="mt-4 border-t border-gray-100 pt-4">

                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Update Feedback Status
                      </label>

                      <select
                        value={item.status || "Open"}
                        onChange={(e) =>
                          updateStatus(
                            item.id,
                            e.target.value
                          )
                        }
                        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                      >
                        {statuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>

                    </div>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* ==================================
          FLOATING ADD FEEDBACK BUTTON
      ================================== */}

      <button
        type="button"
        onClick={() => {
          setError("");
          setSuccess("");
          setShowModal(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-xl transition hover:bg-blue-700"
      >
        <Plus size={21} />

        Add Feedback
      </button>

      {/* ==================================
          ADD FEEDBACK MODAL
      ================================== */}

      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >

          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 p-6">

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  Add Feedback
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Share your suggestions and ideas with us.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <X size={21} />
              </button>

            </div>

            {/* FEEDBACK FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* CATEGORY */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Feedback Type
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-blue-500"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

              </div>

              {/* RATING */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Your Rating
                </label>

                <Rating
                  value={rating}
                  interactive
                  onChange={setRating}
                />

                <p className="mt-2 text-xs text-gray-500">
                  {rating} out of 5 stars
                </p>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  rows={5}
                  maxLength={3000}
                  placeholder="Enter your feedback or suggestion..."
                  required
                  className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-blue-500"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {message.length}/3000
                </p>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting || !message.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />

                  {submitting
                    ? "Submitting..."
                    : "Submit Feedback"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
