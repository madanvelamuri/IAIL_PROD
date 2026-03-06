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
      `"${m.employee_name}"`,
      `"${m.mistake_type}"`,
      `"${m.description}"`,
      `"${new Date(m.created_at).toISOString().split("T")[0]}"`,
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
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.15)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Mistake Count 🐞",
        data: Object.values(typeFrequency),
        backgroundColor: "#16a34a",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-10 space-y-12">

      <div>
        <h1 className="text-4xl font-extrabold text-slate-800">
          📊 Analytics Dashboard
        </h1>
        <p className="text-slate-500 mt-2">
          Mistake tracking insights & performance overview 🚀
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Total Mistakes 🐞" value={totalMistakes} color="text-blue-600" />
        <KpiCard title="This Month 📅" value={thisMonthCount} color="text-indigo-600" />
        <KpiText title="Most of Mistakes Done in 🔥" value={topMistake} color="text-red-600" />
        <KpiText title="Mostly Mistake Done By 🧑‍💻" value={topEmployee} color="text-green-600" />
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-slate-300/40 border border-white flex flex-wrap gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <ChartCard title="Monthly Trend 📈">
          <Line data={trendData} />
        </ChartCard>
        <ChartCard title="Mistake Type Distribution 🐞">
          <Bar data={barData} />
        </ChartCard>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-300/40 border border-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
            <tr>
              <th className="p-4">📌 Claim ID</th>
              <th className="p-4">👤 Employee</th>
              <th className="p-4">🐞 Type</th>
              <th className="p-4">📝 Description</th>
              <th className="p-4">📅 Date</th>
              <th className="p-4 text-center">⚙️ Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((m) => (
              <tr key={m.id} className="border-t hover:bg-blue-50/40 transition-colors">
                <td className="p-4 font-medium">{m.claim_id}</td>
                <td className="p-4">{m.employee_name}</td>
                <td className="p-4">{m.mistake_type}</td>
                <td className="p-4 text-slate-500">{m.description}</td>
                <td className="p-4">
                  {new Date(m.created_at).toISOString().split("T")[0]}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs shadow-md hover:shadow-lg transition"
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
  );
}

const KpiCard = ({ title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-slate-300/40 border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
    <p className="text-slate-500 text-sm">{title}</p>
    <h2 className={`text-4xl font-bold mt-3 ${color}`}>
      <CountUp end={value} duration={1.5} /> 😅
    </h2>
  </div>
);

const KpiText = ({ title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-slate-300/40 border border-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
    <p className="text-slate-500 text-sm">{title}</p>
    <h2 className={`text-xl font-semibold mt-3 ${color}`}>
      {value} 😬
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="border border-slate-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    gray: "bg-slate-500 hover:bg-slate-600",
    green: "bg-emerald-600 hover:bg-emerald-700",
  };

  return (
    <button
      {...props}
      className={`${colors[color]} text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition`}
    >
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl shadow-slate-300/40 border border-white hover:shadow-3xl transition-all">
    <h3 className="text-lg font-semibold text-slate-700 mb-4">
      {title}
    </h3>
    {children}
  </div>
);