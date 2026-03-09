import React, { useEffect, useState } from "react";
import API from "../services/api";
import CountUp from "react-countup";
import { Bar, Line } from "react-chartjs-2";
import { 
  Search, 
  RotateCcw, 
  Trash2, 
  Ghost, 
  Frown, 
  PartyPopper, 
  Skull, 
  Zap,
  Banana
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
  const [filters, setFilters] = useState({ from: "", to: "", employee: "", type: "" });

  useEffect(() => { fetchMistakes(); }, []);

  const fetchMistakes = async () => {
    try {
      const res = await API.get("/mistakes");
      setMistakes(res.data);
      setFilteredData(res.data);
    } catch (err) { console.error("Fetch error:", err); }
  };

  const handleSearch = () => {
    let data = [...mistakes];
    if (filters.employee) data = data.filter((m) => m.employee_name.toLowerCase().includes(filters.employee.toLowerCase()));
    if (filters.type) data = data.filter((m) => m.mistake_type.toLowerCase().includes(filters.type.toLowerCase()));
    if (filters.from) data = data.filter((m) => new Date(m.created_at) >= new Date(filters.from));
    if (filters.to) data = data.filter((m) => new Date(m.created_at) <= new Date(filters.to));
    setFilteredData(data);
  };

  const handleReset = () => {
    setFilters({ from: "", to: "", employee: "", type: "" });
    setFilteredData(mistakes);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bury this mistake forever? 🪦")) return;
    try { await API.delete(`/mistakes/${id}`); fetchMistakes(); } catch (err) { console.error("Delete failed:", err); }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) { alert("Nothing to see here! 🙈"); return; }
    const headers = ["Claim ID", "Employee Name", "Mistake Type", "Description", "Created Date"];
    const rows = filteredData.map((m) => [
      `="${m.claim_id}"`, `"${m.employee_name}"`, `"${m.mistake_type}"`, `"${m.description}"`, `"${new Date(m.created_at).toISOString().split("T")[0]}"`
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `the_shame_file_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMistakes = filteredData.length;
  const thisMonthCount = filteredData.filter((m) => new Date(m.created_at).getMonth() === new Date().getMonth()).length;
  
  const typeFreq = {};
  filteredData.forEach(m => typeFreq[m.mistake_type] = (typeFreq[m.mistake_type] || 0) + 1);
  const topMistake = Object.keys(typeFreq).reduce((a, b) => typeFreq[a] > typeFreq[b] ? a : b, "-");

  const empFreq = {};
  filteredData.forEach(m => empFreq[m.employee_name] = (empFreq[m.employee_name] || 0) + 1);
  const topEmployee = Object.keys(empFreq).reduce((a, b) => empFreq[a] > empFreq[b] ? a : b, "-");

  const monthly = {};
  filteredData.forEach(m => {
    const month = new Date(m.created_at).toLocaleString("default", { month: "short" });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [{ label: "The Slip-up Scale", data: Object.values(monthly), borderColor: "#FFDE00", backgroundColor: "#000", tension: 0.5, fill: false }],
  };

  const barData = {
    labels: Object.keys(typeFreq),
    datasets: [{ label: "Whoops Count", data: Object.values(typeFreq), backgroundColor: ["#FF5733", "#33FF57", "#3357FF", "#F333FF"], borderWidth: 3, borderColor: '#000' }],
  };

  return (
    <div className="min-h-screen bg-[#FFDE00] p-6 lg:p-10 space-y-8 font-mono">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter flex items-center gap-4">
            <Banana className="w-12 h-12 rotate-12" /> Analytics Dashboard
          </h1>
          <p className="text-xl font-bold mt-2">Mistake tracking insights & performance overview 🤡</p>
        </div>
        <button onClick={handleExportCSV} className="mt-4 bg-black text-white px-8 py-3 font-bold hover:bg-white hover:text-black border-4 border-black transition-all transform active:scale-95">
          GET THE CSV 📂
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes" value={totalMistakes} icon={<Frown className="w-8 h-8" />} color="bg-blue-400" />
        <KpiCard title="This Month" value={thisMonthCount} icon={<Ghost className="w-8 h-8" />} color="bg-purple-400" />
        <KpiText title="Most of Mistakes Done in" value={topMistake} icon={<Skull className="w-8 h-8" />} color="bg-red-400" />
        <KpiText title="Mostly Mistake Done By" value={topEmployee} icon={<PartyPopper className="w-8 h-8" />} color="bg-green-400" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-4 items-center">
        <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <Input type="text" placeholder="Search Employee..." value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
        <Input type="text" placeholder="Mistake Type..." value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
        
        <div className="flex gap-4">
            <button onClick={handleSearch} className="bg-black text-white px-6 py-2 border-2 border-black font-bold hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">FIND 'EM</button>
            <button onClick={handleReset} className="bg-white text-black px-6 py-2 border-2 border-black font-bold hover:bg-gray-100"><RotateCcw className="inline mr-2" /> REWIND</button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Trend">
          <Line data={trendData} />
        </ChartCard>
        <ChartCard title="Mistake Type Distribution">
          <Bar data={barData} />
        </ChartCard>
      </div>

      {/* Table */}
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-20">
        <table className="w-full">
          <thead className="bg-black text-white border-b-4 border-black">
            <tr>
              {["Claim ID", "Employee", "Type", "Description", "Date", "Action"].map(h => (
                <th key={h} className="p-4 text-left font-black uppercase italic tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {filteredData.map((m) => (
              <tr key={m.id} className="hover:bg-yellow-100 transition-colors font-bold">
                <td className="p-4">#{m.claim_id}</td>
                <td className="p-4 underline decoration-wavy decoration-red-500">{m.employee_name}</td>
                <td className="p-4 italic">{m.mistake_type}</td>
                <td className="p-4 text-xs opacity-70">{m.description}</td>
                <td className="p-4">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    <Trash2 className="text-white" />
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

const KpiCard = ({ title, value, color, icon }) => (
  <div className={`${color} border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-rotate-2 transition-transform`}>
    <div className="flex justify-between items-start">
        <p className="font-black uppercase italic">{title}</p>
        {icon}
    </div>
    <h2 className="text-5xl font-black mt-4 drop-shadow-md">
      <CountUp end={value} duration={2} />
    </h2>
  </div>
);

const KpiText = ({ title, value, color, icon }) => (
  <div className={`${color} border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:rotate-2 transition-transform`}>
    <div className="flex justify-between items-start">
        <p className="font-black uppercase italic">{title}</p>
        {icon}
    </div>
    <h2 className="text-2xl font-black mt-4 uppercase truncate">{value}</h2>
  </div>
);

const Input = (props) => (
  <input {...props} className="border-2 border-black p-2 font-bold focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400" />
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
    <h3 className="text-2xl font-black uppercase italic border-b-4 border-black pb-2 mb-6 flex items-center gap-2">
        <Zap className="fill-yellow-400" /> {title}
    </h3>
    {children}
  </div>
);