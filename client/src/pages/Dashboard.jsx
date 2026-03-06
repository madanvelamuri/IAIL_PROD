import React, { useEffect, useState } from "react";
import API from "../services/api";
import CountUp from "react-countup";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [mistakes, setMistakes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    employee: "",
    type: "",
  });

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    try {
      const res = await API.get("/mistakes");
      setMistakes(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSearch = () => {
    let data = [...mistakes];

    if (filters.employee) {
      data = data.filter((m) =>
        m.employee_name.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }

    if (filters.type) {
      data = data.filter((m) =>
        m.mistake_type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.from) {
      data = data.filter(
        (m) => new Date(m.created_at) >= new Date(filters.from)
      );
    }

    if (filters.to) {
      data = data.filter(
        (m) => new Date(m.created_at) <= new Date(filters.to)
      );
    }

    setFilteredData(data);
  };

  const handleReset = () => {
    setFilters({
      from: "",
      to: "",
      employee: "",
      type: "",
    });
    setFilteredData(mistakes);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await API.delete(`/mistakes/${id}`);
      fetchMistakes();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  /* SAFE CSV ESCAPE */
  const escapeCSV = (value) => {
    if (!value) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Claim ID",
      "Employee Name",
      "Mistake Type",
      "Description",
      "Created Date",
    ];

    const rows = filteredData.map((m) => [
      `="${m.claim_id}"`,
      escapeCSV(m.employee_name),
      escapeCSV(m.mistake_type),
      escapeCSV(m.description),
      escapeCSV(new Date(m.created_at).toISOString().split("T")[0]),
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mistakes_report_${new Date().toISOString().split("T")[0]}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMistakes = filteredData.length;

  const thisMonth = new Date().getMonth();
  const thisMonthCount = filteredData.filter(
    (m) => new Date(m.created_at).getMonth() === thisMonth
  ).length;

  const typeFrequency = {};
  filteredData.forEach((m) => {
    typeFrequency[m.mistake_type] =
      (typeFrequency[m.mistake_type] || 0) + 1;
  });

  const topMistake =
    Object.keys(typeFrequency).length > 0
      ? Object.keys(typeFrequency).reduce((a, b) =>
          typeFrequency[a] > typeFrequency[b] ? a : b
        )
      : "-";

  const employeeFrequency = {};
  filteredData.forEach((m) => {
    employeeFrequency[m.employee_name] =
      (employeeFrequency[m.employee_name] || 0) + 1;
  });

  const topEmployee =
    Object.keys(employeeFrequency).length > 0
      ? Object.keys(employeeFrequency).reduce((a, b) =>
          employeeFrequency[a] > employeeFrequency[b] ? a : b
        )
      : "-";

  const monthly = {};
  filteredData.forEach((m) => {
    const month = new Date(m.created_at).toLocaleString("default", {
      month: "short",
    });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [
      {
        label: "Monthly Mistakes 📉",
        data: Object.values(monthly),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#1e40af",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
      },
    ],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Mistake Count 🐞",
        data: Object.values(typeFrequency),
        backgroundColor: [
          "rgba(244, 63, 94, 0.8)",
          "rgba(14, 165, 233, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 space-y-10 font-sans text-slate-900">

      <div>
        <h1 className="text-5xl font-black tracking-tight text-slate-900">
          📊 Analytics Dashboard
        </h1>
        <p className="text-slate-500 mt-3 text-lg font-medium italic">
          Mistake tracking insights & performance overview 🚀
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes 🐞" value={totalMistakes} color="text-blue-600" />
        <KpiCard title="This Month 📅" value={thisMonthCount} color="text-indigo-600" />
        <KpiText title="Most of Mistakes Done in 🔥" value={topMistake} color="text-rose-600" />
        <KpiText title="Mostly Mistake Done By 🧑‍💻" value={topEmployee} color="text-emerald-600" />
      </div>

      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border flex flex-wrap gap-4">

        <Input type="date" value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })} />

        <Input type="date" value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })} />

        <Input type="text" placeholder="Employee 👤"
          value={filters.employee}
          onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />

        <Input type="text" placeholder="Mistake Type 🐞"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })} />

        <Button onClick={handleSearch} color="blue">🔍 Search</Button>
        <Button onClick={handleReset} color="gray">♻️ Reset</Button>
        <Button onClick={handleExportCSV} color="green">📄 Export CSV</Button>
      </div>

    </div>
  );
}

/* COMPONENTS */

const KpiCard = ({ title, value, color }) => (
  <div className="bg-white p-7 rounded-3xl shadow-lg border">
    <p className="text-slate-400 font-bold uppercase text-[11px]">{title}</p>
    <h2 className={`text-5xl font-black mt-4 ${color}`}>
      <CountUp end={value} duration={2} separator="," />
    </h2>
  </div>
);

const KpiText = ({ title, value, color }) => (
  <div className="bg-white p-7 rounded-3xl shadow-lg border">
    <p className="text-slate-400 font-bold uppercase text-[11px]">{title}</p>
    <h2 className={`text-2xl font-black mt-4 ${color}`}>
      {value}
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="bg-slate-50 border px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-slate-900 hover:bg-blue-600",
    gray: "bg-slate-300 hover:bg-slate-400",
    green: "bg-emerald-600 hover:bg-emerald-700",
  };

  return (
    <button
      {...props}
      className={`${colors[color]} text-white px-6 py-2 rounded-xl`}
    >
      {children}
    </button>
  );
};