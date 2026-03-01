import React from "react";

export default function StarBackground() {
  const stars = Array.from({ length: 120 });

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {stars.map((_, i) => {
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 10;

        return (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-70"
            style={{
              width: size + "px",
              height: size + "px",
              left: left + "%",
              top: "-10px",
              animation: `fall ${duration}s linear infinite`,
            }}
          />
        );
      })}

      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}