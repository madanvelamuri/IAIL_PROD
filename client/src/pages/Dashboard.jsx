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
      "Created Date"
    ];

    const rows = filteredData.map((m) => [
      `="${m.claim_id}"`,
      `"${m.employee_name}"`,
      `"${m.mistake_type}"`,
      `"${m.description}"`,
      `"${new Date(m.created_at).toISOString().split("T")[0]}"`
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `mistakes_report_${new Date().toISOString().split("T")[0]}.csv`;

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

    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-blue-600"/>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Download className="w-4 h-4 mr-2"/>
          Export CSV
        </button>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">

        <KpiCard title="Total Mistakes" value={totalMistakes}/>
        <KpiCard title="This Month" value={thisMonthCount}/>
        <KpiText title="Most Mistake Type" value={topMistake}/>
        <KpiText title="Top Employee" value={topEmployee}/>

      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-3">

        <Input
          type="date"
          value={filters.from}
          onChange={(e)=>setFilters({...filters,from:e.target.value})}
        />

        <Input
          type="date"
          value={filters.to}
          onChange={(e)=>setFilters({...filters,to:e.target.value})}
        />

        <Input
          placeholder="Employee"
          value={filters.employee}
          onChange={(e)=>setFilters({...filters,employee:e.target.value})}
        />

        <Input
          placeholder="Mistake Type"
          value={filters.type}
          onChange={(e)=>setFilters({...filters,type:e.target.value})}
        />

        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded">
          <Search className="w-4 h-4 inline mr-1"/> Search
        </button>

        <button onClick={handleReset} className="bg-gray-200 px-4 py-2 rounded">
          <RotateCcw className="w-4 h-4 inline mr-1"/> Reset
        </button>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        <ChartCard title="Monthly Trend">
          <Line data={trendData}/>
        </ChartCard>

        <ChartCard title="Mistake Distribution">
          <Bar data={barData}/>
        </ChartCard>

      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="p-4">Claim</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredData.map((m)=>(
              <tr key={m.id}>

                {/* CLICK CLAIM TO VIEW SCREENSHOT */}
                <td className="p-4 text-blue-600 font-semibold">

                  {m.screenshot_url ? (
                    <button
                      onClick={()=>setViewImage(m.screenshot_url)}
                      className="hover:underline"
                    >
                      {m.claim_id}
                    </button>
                  ) : (
                    m.claim_id
                  )}

                </td>

                <td>{m.employee_name}</td>
                <td>{m.mistake_type}</td>
                <td>{m.description}</td>
                <td>{new Date(m.created_at).toLocaleDateString()}</td>

                <td>
                  <button onClick={()=>handleDelete(m.id)}>
                    <Trash2 className="text-red-600 w-5 h-5"/>
                  </button>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* Screenshot Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-white p-4 rounded-lg">

            <button
              onClick={()=>setViewImage(null)}
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

const KpiCard = ({title,value}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <p className="text-gray-400 text-sm">{title}</p>
    <h2 className="text-3xl font-bold">
      <CountUp end={value}/>
    </h2>
  </div>
);

const KpiText = ({title,value}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <p className="text-gray-400 text-sm">{title}</p>
    <h2 className="text-lg font-bold">{value}</h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="border px-3 py-2 rounded-lg"
  />
);

const ChartCard = ({title,children}) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="mb-4 font-bold">{title}</h3>
    {children}
  </div>
);
