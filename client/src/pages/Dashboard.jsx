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
  Filter 
} from "lucide-react"; // Note: Needs lucide-react package
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
      data = data.filter((m) => new Date(m.created_at) >= new Date(filters.from));
    }
    if (filters.to) {
      data = data.filter((m) => new Date(m.created_at) <= new Date(filters.to));
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
    const headers = ["Claim ID", "Employee Name", "Mistake Type", "Description", "Created Date"];
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
    link.setAttribute("download", `mistakes_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logic Calculations
  const totalMistakes = filteredData.length;
  const thisMonth = new Date().getMonth();
  const thisMonthCount = filteredData.filter((m) => new Date(m.created_at).getMonth() === thisMonth).length;

  const typeFrequency = {};
  filteredData.forEach((m) => {
    typeFrequency[m.mistake_type] = (typeFrequency[m.mistake_type] || 0) + 1;
  });

  const topMistake = Object.keys(typeFrequency).length > 0 
    ? Object.keys(typeFrequency).reduce((a, b) => typeFrequency[a] > typeFrequency[b] ? a : b) 
    : "-";

  const employeeFrequency = {};
  filteredData.forEach((m) => {
    employeeFrequency[m.employee_name] = (employeeFrequency[m.employee_name] || 0) + 1;
  });

  const topEmployee = Object.keys(employeeFrequency).length > 0 
    ? Object.keys(employeeFrequency).reduce((a, b) => employeeFrequency[a] > employeeFrequency[b] ? a : b) 
    : "-";

  const monthly = {};
  filteredData.forEach((m) => {
    const month = new Date(m.created_at).toLocaleString("default", { month: "short" });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [{
      label: "Monthly Mistakes",
      data: Object.values(monthly),
      borderColor: "#3b82f6",
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: "#3b82f6",
    }],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [{
      label: "Mistake Count",
      data: Object.values(typeFrequency),
      backgroundColor: "#10b981",
      borderRadius: 6,
    }],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 space-y-8 font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <LayoutDashboard className="w-6 h-6 text-blue-600" />
             <h1 className="text-3xl font-bold tracking-tight text-slate-800">Analytics Dashboard</h1>
          </div>
          <p className="text-slate-500 font-medium">Mistake tracking insights & performance overview</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleExportCSV} color="green">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes" value={totalMistakes} color="text-blue-600" />
        <KpiCard title="This Month" value={thisMonthCount} color="text-indigo-600" />
        <KpiText title="Most of Mistakes Done in" value={topMistake} color="text-rose-600" />
        <KpiText title="Mostly Mistake Done By" value={topEmployee} color="text-emerald-600" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 mr-2">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <Input type="text" placeholder="Search Employee..." value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
        <Input type="text" placeholder="Mistake Type..." value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
        
        <div className="flex gap-2 ml-auto">
            <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition-all flex items-center shadow-md shadow-blue-100">
                <Search className="w-4 h-4 mr-2" /> Search
            </button>
            <button onClick={handleReset} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2 rounded-xl transition-all flex items-center">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Trend">
          <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false }}}} />
        </ChartCard>
        <ChartCard title="Mistake Type Distribution">
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false }}}} />
        </ChartCard>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-700">Detailed Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Claim ID</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-blue-600">{m.claim_id}</td>
                  <td className="px-6 py-4 font-medium">{m.employee_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                        {m.mistake_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{m.description}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-slate-300 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
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

// Sub-components
const KpiCard = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-all">
    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
    <h2 className={`text-4xl font-bold mt-2 tracking-tight ${color}`}>
      <CountUp end={value} duration={1.5} separator="," />
    </h2>
  </div>
);

const KpiText = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-all">
    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
    <h2 className={`text-xl font-bold mt-3 truncate ${color}`}>
      {value}
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all text-sm placeholder:text-slate-400 w-full sm:w-auto"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
    gray: "bg-slate-500 hover:bg-slate-600 shadow-slate-100",
    green: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
  };
  return (
    <button
      {...props}
      className={`${colors[color]} text-white px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center font-semibold text-sm`}
    >
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
      {title}
    </h3>
    <div className="h-[300px] flex items-center justify-center">
        {children}
    </div>
  </div>
);