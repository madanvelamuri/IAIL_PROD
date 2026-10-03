import React, { useState, useRef, useEffect } from "react";
import API from "../services/api";
import Swal from "sweetalert2";
import {
  generateMistakeDescription,
  getMistakeConditions,
  normalizeMistakeType
} from "../utils/mistakeDescriptions";

export default function AddMistake() {
  const [form, setForm] = useState({
    claim_id: "",
    employee_name: "",
    mistake_type: "",
    description: "",
    screenshot: null,
    is_verification: false
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mistakeCondition, setMistakeCondition] = useState("");

  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [showMistakeSuggestions, setShowMistakeSuggestions] = useState(false);

  const employeeRef = useRef(null);
  const mistakeRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  // Employee suggestions
  const employeeOptions = [
    "anil.putturu",
    "braja.behera",
    "divya.pandluru",
    "feba.verifier",
    "harshitha.botsa",
    "hashrita.suthapalli",
    "aryan.kumar",
    "dikshya.priyadarshini",
    "durgabhavani.k",
    "hemalatha.devuni",
    "jahnavi.thathakuntla",
    "lakshmimounika.ch",
    "madanmohan.velamuri",
    "pavana.r",
    "suneel.pedarasi",
    "priti.chendkale",
    "netravathi.s",
    "ramya.gade",
    "sailakshmi.patarlapalli",
    "shivani.verifier",
    "shruti.bajju",
    "sirisha.pallapu",
    "lipika.behera",
    "swapna.s",
    "thaslimsulthana.shaik",
    "yashod.tupili",
    "ziaur.verifier",
    "bhuvaneshwari.thatipuri",
    "alekhya.soma",
    "bhavani.yaka",
    "chakradhar.panchada",
    "divyasai.lakshmi",
    "latha",
    "neha.sameer",
    "pretticia.malekar",
    "rajani.ravishetty",
    "swati.chougala",
    "zamiruddin.syed",
    "yamini.meditha",
    "vamsi.eerla"
  ];

  // Mistake type suggestions
  const mistakeOptions = [
    "Primary ICD-10 Code incorrect",
    "Optical Details Not added",
    "Medical Scheme Provider not added",
    "Invalid Deductions",
    "Gender Not Mentiond or Incorrect",
    "Particular Name Incorrect",
    "Classification Mistake",
    "Validation Incorrect",
    "Invoice No Incorrect",
    "Patient Name Incorrect",
    "Bypassed claim with Incorrect Reason",
    "Selected Incorrect Pre Auth",
    "Claim Date Incorrect",
    "Incorrect Hospital Name",
    "DOB Not Mentiond or Incorrect",
    "Dental Details Not Mentioned",
    "Benefit Details Incorrect",
    "Revenue Description Incorrect",
    "Deduction Incorrectly Done or Not Deducted",
    "Deduction Done with Incorrect Reason",
    "ICD Incorrect",
    "Secondary ICD-10 Code incorrect",
    "Tariff – Missing or Incorrect"
  ];

  const filteredEmployees = employeeOptions.filter((option) =>
    option.toLowerCase().includes(form.employee_name.toLowerCase())
  );

  const filteredMistakes = mistakeOptions.filter((option) =>
    normalizeMistakeType(option).includes(
      normalizeMistakeType(form.mistake_type)
    )
  );

  const requiredConditions = getMistakeConditions(form.mistake_type);

  const replacePreview = (file) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    if (!file) {
      previewUrlRef.current = null;
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreview(objectUrl);
  };

  const selectMistakeType = (mistakeType) => {
    const conditions = getMistakeConditions(mistakeType);

    setMistakeCondition("");
    setForm((prev) => ({
      ...prev,
      mistake_type: mistakeType,
      // Conditional categories wait until Missing/Incorrect is selected.
      description: conditions.length
        ? ""
        : generateMistakeDescription(mistakeType)
    }));

    setShowMistakeSuggestions(false);
  };

  const handleMistakeConditionChange = (condition) => {
    setMistakeCondition(condition);
    setForm((prev) => ({
      ...prev,
      description: generateMistakeDescription(prev.mistake_type, condition)
    }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employeeRef.current && !employeeRef.current.contains(event.target)) {
        setShowEmployeeSuggestions(false);
      }

      if (mistakeRef.current && !mistakeRef.current.contains(event.target)) {
        setShowMistakeSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Paste screenshot directly from clipboard
  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i += 1) {
        if (items[i].type.includes("image")) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const file = new File(
            [blob],
            `pasted-${Date.now()}.png`,
            { type: blob.type || "image/png" }
          );

          setForm((prev) => ({ ...prev, screenshot: file }));
          replacePreview(file);
          setMessage("Screenshot pasted successfully!");
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Clean up the temporary screenshot preview URL.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // Display success and error messages
  useEffect(() => {
    if (!message) return undefined;

    Swal.fire({
      icon: message.toLowerCase().includes("successfully") ? "success" : "error",
      title: message.toLowerCase().includes("successfully") ? "Success" : "Error",
      text: message,
      background: "#0f172a",
      color: "#ffffff",
      confirmButtonColor: "#22c55e",
      backdrop: "rgba(0,0,0,0.8)"
    });

    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // Submit mistake
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.claim_id.trim()) {
      setMessage("Error: Please enter the Claim ID.");
      return;
    }

    if (!form.employee_name.trim()) {
      setMessage("Error: Please enter the Employee Name.");
      return;
    }

    if (!form.mistake_type.trim()) {
      setMessage("Error: Please select a Mistake Type.");
      return;
    }

    if (requiredConditions.length > 0 && !mistakeCondition) {
      setMessage("Error: Please select whether the mistake is Missing or Incorrect.");
      return;
    }

    if (!form.description.trim()) {
      setMessage("Error: Please enter the Description.");
      return;
    }

    if (form.is_verification && !form.screenshot) {
      setMessage("Error: Screenshot is mandatory for Verification Claims.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("claim_id", form.claim_id.trim());
      data.append("employee_name", form.employee_name.trim());
      data.append("mistake_type", form.mistake_type.trim());
      data.append("description", form.description.trim());
      data.append("is_verification", form.is_verification);

      if (form.screenshot) {
        data.append("screenshot", form.screenshot);
      }

      await API.post("/mistakes", data);

      setMessage("Mistake submitted successfully!");

      setForm({
        claim_id: "",
        employee_name: "",
        mistake_type: "",
        description: "",
        screenshot: null,
        is_verification: false
      });

      setMistakeCondition("");
      replacePreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setShowEmployeeSuggestions(false);
      setShowMistakeSuggestions(false);
    } catch (error) {
      console.error("Mistake submission failed:", error);
      setMessage(
        error?.response?.data?.message || "Error submitting mistake."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full max-w-3xl backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white">
        <h2 className="text-4xl font-extrabold mb-10 text-center bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
          Add QC Mistake
        </h2>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Claim ID */}
          <input
            type="text"
            placeholder="Claim ID"
            value={form.claim_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, claim_id: event.target.value }))
            }
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
            required
          />

          {/* Employee Name */}
          <div className="relative" ref={employeeRef}>
            <input
              type="text"
              placeholder="Employee Name"
              value={form.employee_name}
              onChange={(event) => {
                setForm((prev) => ({
                  ...prev,
                  employee_name: event.target.value
                }));
                setShowEmployeeSuggestions(true);
              }}
              onFocus={() => setShowEmployeeSuggestions(true)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
              required
            />

            {showEmployeeSuggestions && filteredEmployees.length > 0 && (
              <div className="absolute z-50 mt-3 w-full bg-slate-900/95 border border-white/10 rounded-2xl shadow-xl max-h-52 overflow-y-auto">
                {filteredEmployees.map((option) => (
                  <div
                    key={option}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setForm((prev) => ({ ...prev, employee_name: option }));
                      setShowEmployeeSuggestions(false);
                    }}
                    className="px-5 py-3 hover:bg-cyan-500/20 cursor-pointer transition"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mistake Type */}
          <div className="relative" ref={mistakeRef}>
            <input
              type="text"
              placeholder="Mistake Type"
              value={form.mistake_type}
              onChange={(event) => {
                const value = event.target.value;
                setMistakeCondition("");
                setForm((prev) => ({
                  ...prev,
                  mistake_type: value,
                  description: ""
                }));
                setShowMistakeSuggestions(true);
              }}
              onFocus={() => setShowMistakeSuggestions(true)}
              onBlur={(event) => {
                const typedValue = event.currentTarget.value;
                const matchedOption = mistakeOptions.find(
                  (option) =>
                    normalizeMistakeType(option) ===
                    normalizeMistakeType(typedValue)
                );

                if (matchedOption) selectMistakeType(matchedOption);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && filteredMistakes.length > 0) {
                  event.preventDefault();
                  selectMistakeType(filteredMistakes[0]);
                }
              }}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
              required
            />

            {showMistakeSuggestions && filteredMistakes.length > 0 && (
              <div className="absolute z-50 mt-3 w-full bg-slate-900/95 border border-white/10 rounded-2xl shadow-xl max-h-52 overflow-y-auto">
                {filteredMistakes.map((option) => (
                  <div
                    key={option}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectMistakeType(option);
                    }}
                    className="px-5 py-3 hover:bg-cyan-500/20 cursor-pointer transition"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condition selector for categories with Missing/Incorrect variants */}
          {requiredConditions.length > 0 && (
            <div className="space-y-2">
              <label
                htmlFor="mistake-condition"
                className="block text-sm font-semibold text-white/80"
              >
                Select Condition <span className="text-rose-400">*</span>
              </label>
              <select
                id="mistake-condition"
                value={mistakeCondition}
                onChange={(event) =>
                  handleMistakeConditionChange(event.target.value)
                }
                required
                className="w-full bg-slate-900 border border-white/20 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
              >
                <option value="">Select Condition</option>
                {requiredConditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
              <p className="text-xs text-white/50">
                Choose whether the information is missing or the entered
                information is incorrect.
              </p>
            </div>
          )}

          {/* Claim Type */}
          <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl p-5">
            <span className="text-sm text-white/70">Claim Type:</span>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.is_verification}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_verification: event.target.checked
                  }))
                }
                className="w-5 h-5 accent-cyan-500 bg-white/10 border-white/20 rounded cursor-pointer"
              />
              <span
                className={`text-sm transition ${
                  form.is_verification
                    ? "text-cyan-400 font-bold"
                    : "text-white/60"
                }`}
              >
                Verification Claim (Mandatory Screenshot)
              </span>
            </label>
          </div>

          {/* Automatically generated, editable description */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor="mistake-description"
                className="text-sm font-semibold text-white/80"
              >
                Description
                {form.description && (
                  <span className="ml-2 text-xs font-medium text-emerald-400">
                    Auto description generated — please review
                  </span>
                )}
              </label>
            </div>

            <textarea
              id="mistake-description"
              placeholder={
                requiredConditions.length > 0 && !mistakeCondition
                  ? "Select Missing or Incorrect to generate the description..."
                  : "Select a mistake type to generate a description, or enter it manually..."
              }
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value
                }))
              }
              rows="4"
              maxLength={1500}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition resize-none"
              required
            />

            <div className="flex items-center justify-between text-xs text-white/50">
              <span>
                Automatically generated description can be edited before
                submission.
              </span>
              <span>{form.description.length}/1500</span>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div
            className={`bg-white/5 border rounded-2xl p-6 transition-colors ${
              form.is_verification && !form.screenshot
                ? "border-amber-500/50"
                : "border-white/10"
            }`}
          >
            <label className="block mb-3 text-sm text-white/70">
              Upload Screenshot{" "}
              {form.is_verification ? (
                <span className="text-amber-400 font-bold">(MANDATORY)</span>
              ) : (
                "(Optional)"
              )}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                setForm((prev) => ({ ...prev, screenshot: file }));
                replacePreview(file);
              }}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:text-slate-900 file:font-semibold hover:file:bg-cyan-600 transition"
            />

            <p className="mt-3 text-xs text-white/50">
              You can also paste a screenshot directly using Ctrl + V.
            </p>

            {preview && (
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={preview}
                  alt="Screenshot preview"
                  className="h-20 w-20 rounded-xl border border-white/20 object-cover"
                />

                <button
                  type="button"
                  onClick={() => window.open(preview, "_blank", "noopener,noreferrer")}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-600"
                >
                  View Image
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, screenshot: null }));
                    replacePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-400 to-teal-500 text-slate-900 font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg disabled:opacity-70"
          >
            {loading && (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Submitting..." : "Submit Mistake"}
          </button>
        </form>
      </div>
    </div>
  );
}
