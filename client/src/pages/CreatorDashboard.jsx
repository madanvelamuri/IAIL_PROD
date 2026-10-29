import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState("mistakes");

  const [mistakeTypes, setMistakeTypes] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [mistakeName, setMistakeName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState("");

  const [employeeName, setEmployeeName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [mistakeResponse, employeeResponse] =
        await Promise.all([
          API.get("/creator/mistake-types"),
          API.get("/creator/employees")
        ]);

      setMistakeTypes(mistakeResponse.data);
      setEmployees(employeeResponse.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load Creator Dashboard."
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addMistakeType = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await API.post("/creator/mistake-types", {
        name: mistakeName,
        description,
        conditions: conditions
          .split("\n")
          .map(value => value.trim())
          .filter(Boolean)
      });

      setMistakeName("");
      setDescription("");
      setConditions("");

      await loadData();
      setMessage("Mistake type added successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to add mistake type."
      );
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await API.post("/creator/employees", {
        name: employeeName
      });

      setEmployeeName("");

      await loadData();
      setMessage("Employee added successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to add employee."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full border border-gray-300 rounded-lg p-3 mt-2";

  const buttonStyle =
    "bg-indigo-700 hover:bg-indigo-800 text-white " +
    "px-5 py-3 rounded-lg font-semibold disabled:opacity-50";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold">
          Creator Dashboard
        </h1>

        <p className="mt-2 text-gray-300">
          Manage mistake types and employee names.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("mistakes");
            setMessage("");
            setError("");
          }}
          className={buttonStyle}
        >
          Mistake Type Management
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("employees");
            setMessage("");
            setError("");
          }}
          className={buttonStyle}
        >
          Employee Management
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="bg-green-100 text-green-800 p-3 rounded-lg"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-100 text-red-800 p-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {activeTab === "mistakes" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">
              Add New Mistake Type
            </h2>

            <form onSubmit={addMistakeType} className="space-y-4">
              <label className="block">
                Mistake Type Name
                <input
                  required
                  maxLength={150}
                  className={inputStyle}
                  value={mistakeName}
                  onChange={(e) =>
                    setMistakeName(e.target.value)
                  }
                  placeholder="Enter mistake type"
                />
              </label>

              <label className="block">
                Description
                <textarea
                  maxLength={2000}
                  className={inputStyle}
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Enter description"
                />
              </label>

              <label className="block">
                Conditions (one per line)
                <textarea
                  className={inputStyle}
                  rows={4}
                  value={conditions}
                  onChange={(e) =>
                    setConditions(e.target.value)
                  }
                  placeholder={
                    "Missing\nIncorrect\nNot applicable"
                  }
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className={buttonStyle}
              >
                {loading ? "Saving..." : "Add Mistake Type"}
              </button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">
              Existing Mistake Types ({mistakeTypes.length})
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {mistakeTypes.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4"
                >
                  <h3 className="font-bold">{item.name}</h3>

                  {item.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {item.description}
                    </p>
                  )}

                  {item.conditions?.length > 0 && (
                    <p className="text-sm mt-2">
                      <strong>Conditions:</strong>{" "}
                      {item.conditions.join(", ")}
                    </p>
                  )}
                </div>
              ))}

              {mistakeTypes.length === 0 && (
                <p>No custom mistake types added yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">
              Add Employee
            </h2>

            <form onSubmit={addEmployee} className="space-y-4">
              <label className="block">
                Employee Name
                <input
                  required
                  maxLength={120}
                  className={inputStyle}
                  value={employeeName}
                  onChange={(e) =>
                    setEmployeeName(e.target.value)
                  }
                  placeholder="Enter employee name"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className={buttonStyle}
              >
                {loading ? "Saving..." : "Add Employee"}
              </button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">
              Employee List ({employees.length})
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="border rounded-lg p-3"
                >
                  {employee.name}
                </div>
              ))}

              {employees.length === 0 && (
                <p>No employees added yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}