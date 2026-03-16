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
    "swapna.s","thaslimsulthana.shaik","vasu.nelavelli",
    "yashod.tupili","ziaur.verifier",
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
    "Deduction Done with Incorrect Reason",
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
                setForm({ ...form, mistake_type: e.target.value });
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
                      setForm({ ...form, mistake_type: option });
                      setShowMistakeSuggestions(false);
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

          {/* Description */}
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows="4"
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 outline-none transition resize-none"
            required
          />

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
              <div className="mt-4 relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="rounded-xl max-h-60 border border-white/20"
                />

                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setForm({ ...form, screenshot: null });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs"
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