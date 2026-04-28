import React, { useState, useEffect } from "react";
import API from "../services/api";
import StarBackground from "../components/StarBackground";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  /* =========================
     SESSION EXPIRED MESSAGE
  ========================= */
  useEffect(() => {
    const expired = localStorage.getItem("sessionExpired");

    if (expired) {
      setError("Session expired. Please login again.");
      localStorage.removeItem("sessionExpired");
    }
  }, []);

  const memeQuotes = [
    "😎 It’s not the password… it’s the confidence.",
    "🧠 Did you try turning your memory off and on?",
    "😂 Keyboard looking suspicious right now.",
    "🚀 NASA couldn't launch this many failed attempts.",
    "🔐 The password is shy. Try again gently.",
  ];

  const getRandomMeme = () => {
    return memeQuotes[Math.floor(Math.random() * memeQuotes.length)];
  };

  const playErrorSound = () => {
    const audio = new Audio(
      "https://www.soundjay.com/buttons/sounds/button-10.mp3"
    );
    audio.volume = 0.4;
    audio.play();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      const token = res.data.token;

      localStorage.setItem("token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: payload.id,
          name: payload.name,
          email: payload.email,
        })
      );

      setSuccess(true);

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);

    } catch (err) {
      setLoading(false);
      setError("Invalid email or password");
      setShake(true);
      playErrorSound();
      setAttempts((prev) => prev + 1);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div
  className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden"
  style={{
    backgroundImage: "url('https://tse4.mm.bing.net/th/id/OIP.i-h_3Myz5w8vUsqAIZhbMAAAAA?rs=1&pid=ImgDetMain&o=7&rm=3')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  }}
>

      <StarBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className={`relative z-10 w-full max-w-md p-12 rounded-3xl
        backdrop-blur-3xl bg-white/5 border border-white/10
        shadow-[0_0_80px_rgba(0,255,255,0.15)]
        text-white transition-all duration-500
        ${shake ? "animate-shake border-red-500" : ""}
        ${success ? "border-green-400 shadow-green-400/40" : ""}`}
      >

        <h2 className="text-4xl font-extrabold text-center mb-12 tracking-wide bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
          Welcome To APA
        </h2>

        <form onSubmit={handleLogin} className="space-y-8">

          {/* Email */}
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="email"
            required
            placeholder="Email Address"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full rounded-2xl px-5 py-4
            bg-white/90 text-black border border-gray-200
            focus:outline-none focus:ring-2 focus:ring-cyan-400
            transition duration-300"
          />

          {/* Password */}
          <div className="relative">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full rounded-2xl px-5 py-4 pr-12
              bg-white/90 text-black border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-cyan-400
              transition duration-300"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold
            text-slate-900 tracking-wide
            bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400
            shadow-lg transition-all duration-300
            flex justify-center items-center gap-3"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
            ) : success ? (
              "Success ✓"
            ) : (
              "Login"
            )}
          </motion.button>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-red-400 font-semibold mt-4"
            >
              {error}
            </motion.div>
          )}

          {/* Attempts */}
          {attempts > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-amber-400 text-sm mt-2"
            >
              Failed Attempts: {attempts}
            </motion.div>
          )}

          {/* Meme */}
          {attempts >= 1 && !success && (
            <motion.div
              key={attempts}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-cyan-300 text-sm mt-3 italic"
            >
              {getRandomMeme()}
            </motion.div>
          )}

        </form>

        {/* Register Link */}
        <div className="text-center mt-8">
          <span className="text-gray-400 text-sm">
            Don't have an account?{" "}
          </span>
          <Link
            to="/register"
            className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition duration-300"
          >
            Register here
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6 tracking-wide">
          Mistake Tracking & Analysis System
        </p>

      </motion.div>
    </div>
  );
}