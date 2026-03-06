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
      `="${m.employee_name}"`,
      `="${m.mistake_type}"`,
      `="${m.description}"`,
      `="${new Date(m.created_at).toISOString().split("T")[0]}"`,
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
            'rgba(244, 63, 94, 0.8)', // Rose
            'rgba(14, 165, 233, 0.8)', // Sky
            'rgba(34, 197, 94, 0.8)', // Green
            'rgba(168, 85, 247, 0.8)' // Purple
        ],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 space-y-10 font-sans text-slate-900">
      
      {/* Header Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative">
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            📊 Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Dashboard</span>
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium italic">
            Mistake tracking insights & performance overview 🚀 <span className="not-italic opacity-50 ml-2"> (Or as we call it, the Hall of Fame)</span>
          </p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes 🐞" value={totalMistakes} color="text-blue-600" />
        <KpiCard title="This Month 📅" value={thisMonthCount} color="text-indigo-600" />
        <KpiText title="Most of Mistakes Done in 🔥" value={topMistake} color="text-rose-600" />
        <KpiText title="Mostly Mistake Done By 🧑‍💻" value={topEmployee} color="text-emerald-600" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-3 flex-grow">
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
        </div>

        <div className="flex gap-2">
            <Button onClick={handleSearch} color="blue">🔍 Search</Button>
            <Button onClick={handleReset} color="gray">♻️ Reset</Button>
            <Button onClick={handleExportCSV} color="green">📄 Export CSV</Button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Trend 📈">
          <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </ChartCard>
        <ChartCard title="Mistake Type Distribution 🐞">
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </ChartCard>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-700">Detailed Incident Logs 📝</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                <th className="p-5 text-left">📌 Claim ID</th>
                <th className="p-5 text-left">👤 Employee</th>
                <th className="p-5 text-left">🐞 Type</th>
                <th className="p-5 text-left">📝 Description</th>
                <th className="p-5 text-left">📅 Date</th>
                <th className="p-5 text-center">⚙️ Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredData.map((m) => (
                <tr key={m.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="p-5 font-bold text-blue-600">{m.claim_id}</td>
                    <td className="p-5 font-medium text-slate-700">{m.employee_name}</td>
                    <td className="p-5">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[12px] font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                            {m.mistake_type}
                        </span>
                    </td>
                    <td className="p-5 text-slate-500 italic">"{m.description}"</td>
                    <td className="p-5 text-slate-400 font-mono">
                    {new Date(m.created_at).toISOString().split("T")[0]}
                    </td>
                    <td className="p-5 text-center">
                    <button
                        onClick={() => handleDelete(m.id)}
                        className="opacity-0 group-hover:opacity-100 bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 p-2 rounded-xl transition-all duration-300 transform hover:scale-110"
                        title="Delete Evidence"
                    >
                        🗑️
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

/* Helper Components with Professional Styling */

const KpiCard = ({ title, value, color }) => (
  <div className="bg-white p-7 rounded-3xl shadow-lg shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
    <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">{title}</p>
    <h2 className={`text-5xl font-black mt-4 flex items-baseline gap-2 ${color}`}>
      <CountUp end={value} duration={2} separator="," />
      <span className="text-xl grayscale opacity-50 group-hover:grayscale-0 transition">😅</span>
    </h2>
  </div>
);

const KpiText = ({ title, value, color }) => (
  <div className="bg-white p-7 rounded-3xl shadow-lg shadow-slate-200/50 border border-white hover:border-rose-200 transition-all duration-300 transform hover:-translate-y-1">
    <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">{title}</p>
    <h2 className={`text-2xl font-black mt-4 truncate ${color}`}>
      {value} <span className="text-lg">😬</span>
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="bg-slate-50 border-0 ring-1 ring-slate-200 px-4 py-2.5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all w-full md:w-auto text-sm"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-slate-900 hover:bg-blue-600 shadow-slate-900/20",
    gray: "bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-none",
    green: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
  };

  return (
    <button
      {...props}
      className={`${colors[color]} text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 whitespace-nowrap`}
    >
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-50">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
      {title}
    </h3>
    <div className="min-h-[300px] flex items-center justify-center">
        {children}
    </div>
  </div>
);