import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import CountUp from "react-countup";
import { Bar, Line } from "react-chartjs-2";
import { Search, RotateCcw, Download, Trash2, LayoutDashboard, Eye, ZoomIn, ZoomOut, Maximize, X, Rocket } from "lucide-react";
import Swal from "sweetalert2";
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

const BACKEND_URL = import.meta.env.VITE_API_URL.replace("/api", "");

export default function Dashboard() {
  const [mistakes, setMistakes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [viewImage, setViewImage] = useState(null);
// NEW STATE FOR HIDE BUTTON//
  const [showEmployeeTable, setShowEmployeeTable] = useState(true);

  /* Version State - Bumped to 1.2.1 to trigger popup */
  const CURRENT_VERSION = "1.3.0";
  const [showUpdate, setShowUpdate] = useState(false);

  /* Zoom State */
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    employee: "",
    type: ""
  });

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchMistakes();

    // Check for Version Update
    const lastVersion = localStorage.getItem("app_version");
    if (lastVersion !== CURRENT_VERSION) {
      setShowUpdate(true);
    }
  }, []);

  const handleCloseUpdate = () => {
    localStorage.setItem("app_version", CURRENT_VERSION);
    setShowUpdate(false);
  };

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
      data = data.filter(m =>
        m.employee_name.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }
    if (filters.type) {
      data = data.filter(m =>
        m.mistake_type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    if (filters.from) {
      data = data.filter(
        m => new Date(m.created_at) >= new Date(filters.from)
      );
    }
    if (filters.to) {
      data = data.filter(
        m => new Date(m.created_at) <= new Date(filters.to)
      );
    }
    setFilteredData(data);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({ from: "", to: "", employee: "", type: "" });
    setFilteredData(mistakes);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {

  const result = await Swal.fire({
    title: "Are u sure to Delete this data?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "OK",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#0ea5e9",
    background: "#0f172a",
    color: "#ffffff",
    backdrop: "rgba(0,0,0,0.8)"
  });

  if (!result.isConfirmed) return;

  try {
    await API.delete(`/mistakes/${id}`);
    fetchMistakes();

    Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "Data deleted successfully",
      confirmButtonColor: "#22c55e",
      background: "#0f172a",
      color: "#ffffff"
    });

  } catch (err) {
    console.error("Delete failed:", err);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Delete failed",
      confirmButtonColor: "#ef4444",
      background: "#0f172a",
      color: "#ffffff"
    });
  }
};

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ["Claim ID", "Employee Name", "Mistake Type", "Description", "Created Date"];
    const rows = filteredData.map(m => [
      `"${m.claim_id}"`,
      `"${m.employee_name}"`,
      `"${m.mistake_type}"`,
      `"${m.description}"`,
      `"${new Date(m.created_at).toISOString().split("T")[0]}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `mistakes_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* Zoom & Drag Handlers */
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const totalMistakes = filteredData.length;
  const thisMonth = new Date().getMonth();
  const thisMonthCount = filteredData.filter(
    m => new Date(m.created_at).getMonth() === thisMonth
  ).length;

  const typeFrequency = {};
  filteredData.forEach(m => {
    typeFrequency[m.mistake_type] = (typeFrequency[m.mistake_type] || 0) + 1;
  });

  const topMistake = Object.keys(typeFrequency).length > 0
    ? Object.keys(typeFrequency).reduce((a, b) => typeFrequency[a] > typeFrequency[b] ? a : b)
    : "-";

  const employeeFrequency = {};
  filteredData.forEach(m => {
    employeeFrequency[m.employee_name] = (employeeFrequency[m.employee_name] || 0) + 1;
  });
  const employeeMistakeList = Object.entries(employeeFrequency)
  .map(([employee, count]) => ({
    employee,
    count
  }))
  .sort((a, b) => b.count - a.count);

  const topEmployee = Object.keys(employeeFrequency).length > 0
    ? Object.keys(employeeFrequency).reduce((a, b) => employeeFrequency[a] > employeeFrequency[b] ? a : b)
    : "-";

  const monthly = {};
  filteredData.forEach(m => {
    const month = new Date(m.created_at).toLocaleString("default", { month: "short" });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [{
      label: "Monthly Mistakes",
      data: Object.values(monthly),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.1)",
      tension: 0.4,
      fill: true,
    }]
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [{
      label: "Mistake Count",
      data: Object.values(typeFrequency),
      backgroundColor: "#10b981",
    }]
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 lg:p-10 space-y-8 font-sans relative">
      
      {/* UPDATE POPUP */}
      {showUpdate && (
        <div className="fixed bottom-10 left-10 z-[60] animate-in slide-in-from-left duration-500">
          <div className="bg-white p-5 rounded-2xl shadow-2xl border-l-4 border-blue-600 max-w-sm relative">
            <button 
              onClick={handleCloseUpdate}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Rocket size={20} />
              <h4 className="font-bold text-slate-800">New Version {CURRENT_VERSION}</h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 ml-1">

<li>📋 <b>Paste Screenshot:</b> Use <b>Ctrl + V</b> to paste screenshot directly.</li>

<li>🖼 <b>Screenshot Preview:</b> View screenshot before submitting mistake.</li>

<li>❌ <b>Remove Screenshot:</b> Easily remove uploaded image.</li>

<li>⚡ <b>Faster QC Workflow:</b> No need to browse files manually.</li>

<li className="pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
Submission Rules:
</li>

<li className="text-blue-500 font-semibold italic">
!! Optional For Already Approved Claims
</li>

<li className="text-amber-600 font-semibold italic">
!! Mandatory For Verified Claims
</li>

</ul>
            <button 
              onClick={handleCloseUpdate}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-slate-800">📊 Analytics Dashboard</h1>
        </div>
        <button onClick={handleExportCSV} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:bg-emerald-700 transition">
          <Download className="w-4 h-4"/> 📥 Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes" value={totalMistakes} icon="📈" />
        <KpiCard title="This Month" value={thisMonthCount} icon="📅" />
        <KpiText title="Most of Mistakes in" value={topMistake} icon="⚠️" />
        <KpiText title="Most of Mistakes Done By" value={topEmployee} icon="👤" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4">
        <Input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })}/>
        <Input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })}/>
        <Input placeholder="👤 Employee Name" value={filters.employee} onChange={e => setFilters({ ...filters, employee: e.target.value })}/>
        <Input placeholder="🔍 Mistake Type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}/>
        <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700">
          <Search className="w-4 h-4"/> Search
        </button>
        <button onClick={handleReset} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-200">
          <RotateCcw className="w-4 h-4"/> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="📈 Monthly Trend"><Line data={trendData}/></ChartCard>
        <ChartCard title="📊 Mistake Type Distribution"><Bar data={barData}/></ChartCard>
      </div>
     {/* EMPLOYEE WISE COMPLETE MISTAKE COUNT */}

<div className="flex justify-end">
  <button
    onClick={() => setShowEmployeeTable(!showEmployeeTable)}
    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition"
  >
    {showEmployeeTable
      ? "Hide Employee Mistake Count"
      : "Show Employee Mistake Count"}
  </button>
</div>

{showEmployeeTable && (
<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
  <h3 className="text-lg font-bold text-slate-800 mb-4">
    👨‍💻 Complete Mistake Count - Employee Wise
  </h3>

  <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
    <thead className="bg-slate-100">
      <tr>
        <th className="p-3">Employee Name</th>
        <th className="p-3 text-center">Mistake Count</th>
      </tr>
    </thead>

    <tbody>
      {employeeMistakeList.map((emp, index) => (
        <tr key={index} className="border-t hover:bg-slate-50">
          <td className="p-3 font-medium">{emp.employee}</td>
          <td className="p-3 text-center font-bold text-blue-600">
            {emp.count}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
)}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">📑 Claim</th>
              <th className="p-4">👤 Employee</th>
              <th className="p-4">🏷️ Type</th>
              <th className="p-4">📝 Description</th>
              <th className="p-4">🗓️ Date</th>
              <th className="p-4 text-center">⚙️ Action</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map(m => (
              <tr key={m.id} className="border-t hover:bg-slate-50 transition">
                <td className="p-4 text-blue-600 font-bold">#{String(m.claim_id)}</td>
                <td className="p-4 font-medium">{m.employee_name}</td>
                <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase">{m.mistake_type}</span></td>
                <td className="p-4 text-slate-500 text-sm truncate max-w-[200px]">{m.description}</td>
                <td className="p-4 text-slate-500 text-sm">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {m.screenshot_url && (
                      <button
                       onClick={() => setViewImage(m.screenshot_url)}
                     className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        <Eye className="w-4 h-4"/>
                      </button>
                    )}
                    <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center p-4 bg-slate-50 border-t">
          <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">⬅</button>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">➡</button>
          </div>
        </div>
      </div>

      {/* VERSION BADGE */}
      <div className="fixed bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm text-white text-[10px] px-3 py-1 rounded-full opacity-60 hover:opacity-100 transition shadow-lg border border-white/10 z-40">
        Build: v{CURRENT_VERSION}-stable
      </div>

      {/* ZOOMABLE IMAGE MODAL */}
      {viewImage && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
          
          {/* Controls Bar */}
          <div className="absolute top-6 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 z-50">
            <button onClick={handleZoomOut} className="text-white hover:text-blue-400 transition" title="Zoom Out"><ZoomOut /></button>
            <span className="text-white font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="text-white hover:text-blue-400 transition" title="Zoom In"><ZoomIn /></button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button onClick={handleResetZoom} className="text-white hover:text-blue-400 transition" title="Reset"><Maximize /></button>
            <button onClick={() => { setViewImage(null); handleResetZoom(); }} className="text-white hover:text-red-400 transition ml-2" title="Close"><X /></button>
          </div>

          <div 
            className={`relative overflow-hidden w-full h-full flex items-center justify-center cursor-${scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={viewImage}
              alt="Screenshot"
              onError={(e) => {
                console.warn("Screenshot not found:", viewImage);
                e.target.src = "https://via.placeholder.com/900x600?text=Screenshot+Not+Available";
              }}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                maxHeight: '85vh',
                maxWidth: '90vw',
                objectFit: 'contain'
              }}
              draggable="false"
              className="rounded-lg shadow-2xl"
            />
          </div>

          <p className="absolute bottom-6 text-white/50 text-sm">Use above controls to ZOOM IN & ZOOM OUT </p>
        </div>
      )}
    </div>
  );
}

const KpiCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group">
    <div className="flex justify-between items-start mb-2">
      <p className="text-xs font-bold text-slate-400 uppercase">{title}</p>
      <span className="text-xl group-hover:scale-110 transition">{icon}</span>
    </div>
    <h2 className="text-4xl font-black text-slate-800"><CountUp end={value}/></h2>
  </div>
);

const KpiText = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition group">
    <div className="flex justify-between items-start mb-2">
      <p className="text-xs font-bold text-slate-400 uppercase">{title}</p>
      <span className="text-xl group-hover:scale-110 transition">{icon}</span>
    </div>
    <h2 className="text-xl font-bold text-slate-700 truncate" title={value}>{value}</h2>
  </div>
);

const Input = props => (
  <input {...props} className="border border-slate-200 bg-slate-50 px-4 py-2 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition flex-1 min-w-[180px]"/>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h3 className="mb-6 font-bold text-slate-800 text-lg">{title}</h3>
    <div className="h-[300px]">{children}</div>
  </div>
);