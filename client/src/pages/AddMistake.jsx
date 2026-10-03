import React, { useState, useRef, useEffect } from "react";
import API from "../services/api";
import Swal from "sweetalert2";

export default function AddMistake() {

  const [form, setForm] = useState({
    claim_id: "",
    employee_name: "",
    mistake_type: "",
    description: "",
    screenshot: null,
    is_verification: false,
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiError, setAiError] = useState("");

  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [showMistakeSuggestions, setShowMistakeSuggestions] = useState(false);

  const employeeRef = useRef(null);
  const mistakeRef = useRef(null);

  const employeeOptions = [
    "anil.putturu","braja.behera","divya.pandluru","feba.verifier",
    "harshitha.botsa","hashrita.suthapalli","aryan.kumar",
    "dikshya.priyadarshini","durgabhavani.k","hemalatha.devuni",
    "jahnavi.thathakuntla","lakshmimounika.ch","madanmohan.velamuri",
    "pavana.r","suneel.pedarasi","priti.chendkale","netravathi.s",
    "ramya.gade","sailakshmi.patarlapalli","shivani.verifier",
    "shruti.bajju","sirisha.pallapu","lipika.behera",
    "swapna.s","thaslimsulthana.shaik",
    "yashod.tupili","ziaur.verifier","bhuvaneshwari.thatipuri",
    "alekhya.soma","bhavani.yaka","chakradhar.panchada","divyasai.lakshmi",
    "latha","neha.sameer","pretticia.malekar","rajani.ravishetty","swati.chougala","zamiruddin.syed","yamini.meditha",
  ];

  const mistakeOptions = [
    "Primary ICD-10 Code","Optical Details","Medical Scheme Provider",
    "Invalid Deductions","Gender Not Mentiond or Incorrect",
    "Particular Name Incorrect","Classification Mistake",
    "Validation Incorrect","Invoice No Incorrect",
    "Patient Name Incorrect","Bypassed claim with Incorrect Reason",
    "Selected Incorrect Pre Auth","Claim Date Incorrect",
    "Incorrect Hospital Name","DOB Not Mentiond or Incorrect",
    "Dental Details Not Mentioned","Benefit Details Incorrect",
    "Revenue Description Incorrect",
    "Deduction Incorrectly Done or Not Deducted",
    "Deduction Done with Incorrect Reason","ICD Incorrect","Secondary ICD-10 Code","Invoice No Incorrect",
  ];

  const filteredEmployees = employeeOptions.filter((option) =>
    option.toLowerCase().includes(form.employee_name.toLowerCase())
  );

  const filteredMistakes = mistakeOptions.filter((option) =>
    option.toLowerCase().includes(form.mistake_type.toLowerCase())
  );

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* PASTE SCREENSHOT FEATURE */
  useEffect(() => {

    const handlePaste = (e) => {

      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {

        if (items[i].type.indexOf("image") !== -1) {

          const blob = items[i].getAsFile();

          const file = new File(
            [blob],
            `pasted-${Date.now()}.png`,
            { type: blob.type }
          );

          setForm((prev) => ({
            ...prev,
            screenshot: file
          }));

          setPreview(URL.createObjectURL(file));

          setMessage("Screenshot pasted successfully!");

        }
      }

    };

    window.addEventListener("paste", handlePaste);

    return () => window.removeEventListener("paste", handlePaste);

  }, []);

  useEffect(() => {
    if (message) {

      Swal.fire({
        icon: message.includes("successfully") ? "success" : "error",
        title: message.includes("successfully") ? "Success" : "Error",
        text: message,
        background: "#0f172a",
        color: "#ffffff",
        confirmButtonColor: "#22c55e",
        backdrop: `
        rgba(0,0,0,0.8)
        blur(6px)
      `
      });

      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const generateAIDescription = async (mistakeType = form.mistake_type) => {
    if (!mistakeType || !mistakeType.trim()) {
      setAiError("Select a mistake type first.");
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      // Only the mistake category is sent to AI. No claim, employee,
      // patient, medical-record, or screenshot data is sent.
      const response = await API.post("/ai/generate-description", {
        mistakeType: mistakeType.trim(),
      });
      const generated = response?.data?.description?.trim();
      if (!generated) throw new Error("AI returned an empty description.");

      setForm((prev) => ({ ...prev, description: generated }));
      setAiGenerated(true);
    } catch (error) {
      console.error("AI description generation failed:", error);
      setAiError(
        error?.response?.data?.message ||
        "Could not generate an AI description. Please try again or enter it manually."
      );
      setAiGenerated(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (form.is_verification && !form.screenshot) {
      setMessage("Error: Screenshot is mandatory for Verification Claims.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {

      const data = new FormData();

      data.append("claim_id", form.claim_id);
      data.append("employee_name", form.employee_name);
      data.append("mistake_type", form.mistake_type);
      data.append("description", form.description);
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
        is_verification: false,
      });

      setPreview(null);
      setAiGenerated(false);
      setAiError("");

    } catch (err) {
      console.error(err);
      setMessage("Error submitting mistake.");
    }

    setLoading(false);

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
            onChange={(e) =>
              setForm({ ...form, claim_id: e.target.value })
            }
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
            required
          />

          {/* Employee */}
          <div className="relative" ref={employeeRef}>
            <input
              type="text"
              placeholder="Employee Name"
              value={form.employee_name}
              onChange={(e) => {
                setForm({ ...form, employee_name: e.target.value });
                setShowEmployeeSuggestions(true);
              }}
              onFocus={() => setShowEmployeeSuggestions(true)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
              required
            />

            {showEmployeeSuggestions && filteredEmployees.length > 0 && (
              <div className="absolute z-50 mt-3 w-full bg-slate-900/95 border border-white/10 rounded-2xl shadow-xl max-h-52 overflow-y-auto">
                {filteredEmployees.map((option, index) => (
                  <div
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setForm({ ...form, employee_name: option });
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
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  mistake_type: e.target.value,
                  description: "",
                }));
                setAiGenerated(false);
                setAiError("");
                setShowMistakeSuggestions(true);
              }}
              onFocus={() => setShowMistakeSuggestions(true)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition"
              required
            />

            {showMistakeSuggestions && filteredMistakes.length > 0 && (
              <div className="absolute z-50 mt-3 w-full bg-slate-900/95 border border-white/10 rounded-2xl shadow-xl max-h-52 overflow-y-auto">
                {filteredMistakes.map((option, index) => (
                  <div
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setForm((prev) => ({
                        ...prev,
                        mistake_type: option,
                        description: "",
                      }));
                      setAiGenerated(false);
                      setAiError("");
                      setShowMistakeSuggestions(false);
                      generateAIDescription(option);
                    }}
                    className="px-5 py-3 hover:bg-cyan-500/20 cursor-pointer transition"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Claim Type */}
          <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl p-5">
            <span className="text-sm text-white/70">Claim Type:</span>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.is_verification}
                onChange={(e) => setForm({ ...form, is_verification: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 bg-white/10 border-white/20 rounded cursor-pointer"
              />
              <span className={`text-sm transition ${form.is_verification ? 'text-cyan-400 font-bold' : 'text-white/60'}`}>
                Verification Claim (Mandatory Screenshot)
              </span>
            </label>
          </div>

          {/* AI-generated, editable description */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-semibold text-white/80">
                Description
                {aiGenerated && (
                  <span className="ml-2 text-xs font-medium text-emerald-400">
                    AI draft generated — please review
                  </span>
                )}
              </label>

              <button
                type="button"
                onClick={() => generateAIDescription()}
                disabled={aiLoading || !form.mistake_type.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✦</span>
                    {aiGenerated ? "Regenerate AI Description" : "Generate AI Description"}
                  </>
                )}
              </button>
            </div>

            <textarea
              placeholder="Select a mistake type to generate a description, or enter it manually..."
              value={form.description}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                setAiGenerated(false);
              }}
              rows="4"
              maxLength={1500}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition resize-none"
              required
            />

            <div className="flex items-center justify-between text-xs text-white/50">
              <span>AI text is a draft. Verify it against the actual claim evidence before submitting.</span>
              <span>{form.description.length}/1500</span>
            </div>

            {aiError && (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {aiError}
              </p>
            )}
          </div>

          {/* Screenshot */}
          <div className={`bg-white/5 border rounded-2xl p-6 transition-colors ${form.is_verification && !form.screenshot ? 'border-amber-500/50' : 'border-white/10'}`}>

            <label className="block mb-3 text-sm text-white/70">
              Upload Screenshot {form.is_verification ? <span className="text-amber-400 font-bold">(MANDATORY)</span> : '(Optional)'}
            </label>

            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                setForm({ ...form, screenshot: file });

                if (file) {
                  setPreview(URL.createObjectURL(file));
                }
              }}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:text-slate-900 file:font-semibold hover:file:bg-cyan-600 transition"
            />

            {preview && (
  <div className="mt-4 flex items-center gap-4">

    {/* URL display */}
    <input
      type="text"
      value={preview}
      readOnly
      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
    />

    {/* View Image */}
    <button
      type="button"
      onClick={() => window.open(preview, "_blank")}
      className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600"
    >
      View Image
    </button>

    {/* Remove */}
    <button
      type="button"
      onClick={() => {
        setPreview(null);
        setForm({ ...form, screenshot: null });
      }}
      className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs"
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
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Submitting..." : "Submit Mistake"}
          </button>

        </form>
      </div>
    </div>
  );
}