import React, { useEffect, useState } from "react";
import API from "../services/api";
import CountUp from "react-countup";
import { Bar, Line } from "react-chartjs-2";
import { 
  Search, 
  RotateCcw, 
  Download, 
  Trash2, 
  LayoutDashboard, 
  Filter,
  Eye
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [mistakes, setMistakes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [viewImage, setViewImage] = useState(null);

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
    setFilters({ from: "", to: "", employee: "", type: "" });
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

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

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
        label: "Monthly Mistakes",
        data: Object.values(monthly),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Mistake Count",
        data: Object.values(typeFrequency),
        backgroundColor: "#10b981",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 space-y-8 font-sans text-slate-900">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Mistake tracking insights & performance overview
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 text-white px-5 py-2 rounded-xl flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <KpiCard title="Total Mistakes" value={totalMistakes} />

        <KpiCard title="This Month" value={thisMonthCount} />

        <KpiText title="Most of Mistakes Done in" value={topMistake} />

        <KpiText title="Mostly Mistake Done By" value={topEmployee} />

      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-wrap items-center gap-4">

        <Input
          type="date"
          value={filters.from}
          onChange={(e) =>
            setFilters({ ...filters, from: e.target.value })
          }
        />

        <Input
          type="date"
          value={filters.to}
          onChange={(e) =>
            setFilters({ ...filters, to: e.target.value })
          }
        />

        <Input
          placeholder="Employee"
          value={filters.employee}
          onChange={(e) =>
            setFilters({ ...filters, employee: e.target.value })
          }
        />

        <Input
          placeholder="Mistake Type"
          value={filters.type}
          onChange={(e) =>
            setFilters({ ...filters, type: e.target.value })
          }
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </button>

        <button
          onClick={handleReset}
          className="bg-gray-200 px-4 py-2 rounded-xl flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <ChartCard title="Monthly Trend">
          <Line data={trendData} />
        </ChartCard>

        <ChartCard title="Mistake Type Distribution">
          <Bar data={barData} />
        </ChartCard>

      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-50 text-xs uppercase">

            <tr>

              <th className="px-6 py-4">Claim</th>

              <th className="px-6 py-4">Employee</th>

              <th className="px-6 py-4">Type</th>

              <th className="px-6 py-4">Description</th>

              <th className="px-6 py-4">Date</th>

              <th className="px-6 py-4 text-center">Action</th>

            </tr>

          </thead>

          <tbody>

            {filteredData.map((m) => (

              <tr key={m.id}>

                <td className="px-6 py-4 text-blue-600 font-semibold">
                  {m.claim_id}
                </td>

                <td className="px-6 py-4">
                  {m.employee_name}
                </td>

                <td className="px-6 py-4">
                  {m.mistake_type}
                </td>

                <td className="px-6 py-4">
                  {m.description}
                </td>

                <td className="px-6 py-4">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-center">

                  <div className="flex justify-center gap-3">

                    {m.screenshot_url && (
                      <button
                        onClick={() => setViewImage(m.screenshot_url)}
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {viewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white p-4 rounded-xl max-w-4xl">

            <button
              onClick={() => setViewImage(null)}
              className="float-right text-xl"
            >
              ✕
            </button>

            <img
              src={viewImage}
              alt="Screenshot"
              className="max-h-[80vh]"
            />

          </div>

        </div>
      )}

    </div>
  );
}

const KpiCard = ({ title, value }) => (
  <div className="bg-white p-6 rounded-2xl shadow">
    <p className="text-xs text-gray-400">{title}</p>
    <h2 className="text-3xl font-bold">
      <CountUp end={value} />
    </h2>
  </div>
);

const KpiText = ({ title, value }) => (
  <div className="bg-white p-6 rounded-2xl shadow">
    <p className="text-xs text-gray-400">{title}</p>
    <h2 className="text-lg font-bold">{value}</h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="border px-3 py-2 rounded-xl"
  />
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow">
    <h3 className="mb-4 font-bold">{title}</h3>
    {children}
  </div>
);
