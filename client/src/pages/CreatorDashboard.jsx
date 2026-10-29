
import React, { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";

const Icon = ({ name, size = 20 }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    tag: <><path d="M20.5 13.5 13.5 20.5 3 10V3h7z" /><circle cx="7.5" cy="7.5" r="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  );
};

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState("mistakes");

  const [mistakeTypes, setMistakeTypes] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [mistakeName, setMistakeName] = useState("");
  const [notAddedDescription, setNotAddedDescription] = useState("");
  const [incorrectDescription, setIncorrectDescription] = useState("");
  const [generalDescription, setGeneralDescription] = useState("");
  const [conditions, setConditions] = useState("Missing\nIncorrect");
  const [employeeName, setEmployeeName] = useState("");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [accessRequests, setAccessRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [mistakeSearch, setMistakeSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const requestLock = useRef(false);

  const showToast = useCallback((type, message) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    setToast({
      id: Date.now(),
      type,
      message,
    });

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setPageLoading(true);
    }

    try {
      const [mistakeResponse, employeeResponse] = await Promise.all([
        API.get("/creator/mistake-types"),
        API.get("/creator/employees"),
      ]);

      if (!Array.isArray(mistakeResponse.data)) {
        throw new Error("Unexpected mistake types response.");
      }

      if (!Array.isArray(employeeResponse.data)) {
        throw new Error("Unexpected employee list response.");
      }

      setMistakeTypes(mistakeResponse.data);
      setEmployees(employeeResponse.data);

      return true;
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message ||
          "Unable to load Creator Dashboard. Please try again."
      );

      return false;
    } finally {
      if (showLoading) {
        setPageLoading(false);
      }
    }
  }, [showToast]);

  const loadAccessRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const response = await API.get("/creator/access-requests");
      const rows = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.requests)
          ? response.data.requests
          : [];
      setAccessRequests(rows);
    } catch (err) {
      // Keep the rest of the dashboard usable if the backend endpoint is not deployed yet.
      setAccessRequests([]);
      showToast(
        "error",
        err.response?.data?.message ||
          "Unable to load access requests. Check the creator access-requests API route."
      );
    } finally {
      setRequestsLoading(false);
    }
  }, [showToast]);

  const selectAccessRequest = (request) => {
    const requestedRole = String(
      request.requested_role ?? request.requestedRole ?? "user"
    ).toLowerCase();

    if (request.id == null) {
      showToast("error", "This request has no ID. Refresh the requests and try again.");
      return;
    }

    setUserName(String(request.name ?? ""));
    setUserEmail(String(request.email ?? "").toLowerCase());
    setUserRole(
      ["user", "admin"].includes(requestedRole) ? requestedRole : "user"
    );
    setUserPassword("");
    setSelectedRequestId(request.id);

    showToast(
      "success",
      "Request selected. Name, email, and role have been filled in."
    );
  };

  useEffect(() => {
    loadData(true);
    loadAccessRequests();
  }, [loadData, loadAccessRequests]);

  const addMistakeType = async (event) => {
    event.preventDefault();

    if (requestLock.current) return;

    const cleanName = mistakeName.trim();
    const cleanNotAdded = notAddedDescription.trim();
    const cleanIncorrect = incorrectDescription.trim();
    const cleanGeneral = generalDescription.trim();
    const cleanConditions = conditions
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const normalizedConditions = cleanConditions.map((value) => value.toLowerCase());

    if (!cleanName) {
      showToast("error", "Please enter a mistake type name.");
      return;
    }

    if (cleanConditions.length === 0) {
      showToast("error", "Enter at least one condition.");
      return;
    }

    const needsNotAdded = normalizedConditions.some((value) =>
      ["missing", "not added"].includes(value)
    );
    const needsIncorrect = normalizedConditions.includes("incorrect");

    if (needsNotAdded && !cleanNotAdded) {
      showToast("error", "Please enter the Not Added / Missing description.");
      return;
    }

    if (needsIncorrect && !cleanIncorrect) {
      showToast("error", "Please enter the Incorrect description.");
      return;
    }

    const duplicate = mistakeTypes.some(
      (item) => item.name?.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      showToast("error", "This mistake type already exists.");
      return;
    }

    // Keep using the existing API/database description field. Labels let this
    // component show the two descriptions separately without requiring new columns.
    const combinedDescription = [
      cleanNotAdded ? `Not Added: ${cleanNotAdded}` : "",
      cleanIncorrect ? `Incorrect: ${cleanIncorrect}` : "",
      cleanGeneral ? `General: ${cleanGeneral}` : "",
    ].filter(Boolean).join("\n");

    requestLock.current = true;
    setLoading(true);

    try {
      await API.post("/creator/mistake-types", {
        name: cleanName,
        description: combinedDescription,
        conditions: cleanConditions,
      });

      setMistakeName("");
      setNotAddedDescription("");
      setIncorrectDescription("");
      setGeneralDescription("");
      setConditions("Missing\nIncorrect");

      await loadData();
      showToast("success", "Mistake type added successfully.");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Unable to add mistake type."
      );
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const addEmployee = async (event) => {
    event.preventDefault();

    if (requestLock.current) return;

    const cleanName = employeeName.trim();

    if (!cleanName) {
      showToast("error", "Please enter an employee name.");
      return;
    }

    const duplicate = employees.some(
      (item) =>
        item.name?.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      showToast("error", "This employee already exists.");
      return;
    }

    requestLock.current = true;
    setLoading(true);

    try {
      await API.post("/creator/employees", {
        name: cleanName,
      });

      setEmployeeName("");
      await loadData();

      showToast("success", "Employee added successfully.");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Unable to add employee."
      );
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();

    if (requestLock.current) return;

    const cleanName = userName.trim();
    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanPassword = userPassword;

    if (!cleanName || !cleanEmail) {
      showToast("error", "Please complete the name and email fields.");
      return;
    }

    if (!selectedRequestId && !cleanPassword) {
      showToast("error", "Enter a password for a manually created account.");
      return;
    }

    if (!selectedRequestId && (cleanPassword.length < 8 || cleanPassword.length > 72)) {
      showToast("error", "Password must contain 8 to 72 characters.");
      return;
    }

    if (!["user", "admin"].includes(userRole)) {
      showToast("error", "Please select a valid account role.");
      return;
    }

    requestLock.current = true;
    setLoading(true);

    try {
      if (selectedRequestId) {
        // The backend must use the password hash stored with this pending request.
        // Never retrieve or send the original password/hash to the browser.
        await API.post(
          `/creator/access-requests/${encodeURIComponent(selectedRequestId)}/create-account`,
          { role: userRole }
        );
      } else {
        // Manual account creation remains available when no request is selected.
        await API.post("/creator/users", {
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: userRole,
        });
      }

      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserRole("user");
      setSelectedRequestId(null);

      showToast("success", "User account created successfully.");
      await loadAccessRequests();
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message ||
          "Unable to create account. Check your administrator access and try again."
      );
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  const formatConditions = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value.split("\n").map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const parseMistakeDescription = (value) => {
    const result = { notAdded: "", incorrect: "", general: "", legacy: "" };
    if (!value || typeof value !== "string") return result;

    const notAddedMatch = value.match(/(?:^|\n)\s*Not Added:\s*([\s\S]*?)(?=\n\s*(?:Incorrect|General):|$)/i);
    const incorrectMatch = value.match(/(?:^|\n)\s*Incorrect:\s*([\s\S]*?)(?=\n\s*General:|$)/i);
    const generalMatch = value.match(/(?:^|\n)\s*General:\s*([\s\S]*)$/i);

    if (notAddedMatch || incorrectMatch || generalMatch) {
      result.notAdded = notAddedMatch?.[1]?.trim() || "";
      result.incorrect = incorrectMatch?.[1]?.trim() || "";
      result.general = generalMatch?.[1]?.trim() || "";
    } else {
      // Preserve descriptions created before this update.
      result.legacy = value.trim();
    }
    return result;
  };

  const filteredMistakes = mistakeTypes.filter((item) => {
    const search = mistakeSearch.trim().toLowerCase();
    const parsed = parseMistakeDescription(item.description);

    return (
      !search ||
      item.name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      parsed.notAdded.toLowerCase().includes(search) ||
      parsed.incorrect.toLowerCase().includes(search) ||
      parsed.general.toLowerCase().includes(search) ||
      (formatConditions(item.conditions).some((condition) =>
        String(condition).toLowerCase().includes(search)
      ))
    );
  });

  const filteredEmployees = employees.filter((employee) =>
    employee.name
      ?.toLowerCase()
      .includes(employeeSearch.trim().toLowerCase())
  );


  return (
    <div className="creator-page">
      <style>{`
        .creator-page {
          --creator-ink: #172033;
          --creator-muted: #68758b;
          --creator-primary: #5145e5;
          --creator-border: #e5e9f2;
          min-height: 100%;
          color: var(--creator-ink);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .creator-page * { box-sizing: border-box; }

        .creator-page button,
        .creator-page input,
        .creator-page textarea { font: inherit; }

        .creator-hero {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          padding: 30px 32px;
          color: #fff;
          background: linear-gradient(120deg, #111a30 0%, #202d4a 62%, #4237a9 130%);
          box-shadow: 0 12px 30px rgba(20, 29, 51, .13);
        }

        .creator-hero:after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -75px;
          top: -130px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 50%;
          box-shadow: 0 0 0 28px rgba(255,255,255,.035), 0 0 0 58px rgba(255,255,255,.025);
          pointer-events: none;
        }

        .creator-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #c9d4ff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .creator-hero h1 {
          margin: 12px 0 7px;
          font-size: clamp(26px, 3vw, 34px);
          font-weight: 800;
          letter-spacing: -.035em;
          line-height: 1.15;
        }

        .creator-hero p {
          margin: 0;
          max-width: 620px;
          color: #cbd5e5;
          font-size: 14px;
          line-height: 1.7;
        }

        .creator-hero-meta {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .creator-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 42px;
          padding: 10px 15px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 12px;
          color: #fff;
          background: rgba(255,255,255,.09);
          cursor: pointer;
          transition: background .2s, transform .2s;
        }

        .creator-refresh:hover { background: rgba(255,255,255,.17); transform: translateY(-1px); }
        .creator-refresh:disabled { opacity: .65; cursor: wait; }

        .creator-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 22px;
        }

        .creator-stat {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
          padding: 19px;
          border: 1px solid var(--creator-border);
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(23,32,51,.035);
        }

        .creator-stat-icon {
          display: grid;
          place-items: center;
          flex: 0 0 46px;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          color: #5145e5;
          background: #eeedff;
        }

        .creator-stat-icon.employee { color: #087d68; background: #e5f8f1; }

        .creator-stat-label {
          margin-bottom: 3px;
          color: var(--creator-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .creator-stat-number {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -.04em;
          line-height: 1.2;
        }

        .creator-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 25px 0 19px;
          padding: 6px;
          border: 1px solid var(--creator-border);
          border-radius: 15px;
          background: #e9edf5;
        }

        .creator-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 45px;
          padding: 11px 17px;
          border: 0;
          border-radius: 11px;
          color: #657189;
          background: transparent;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: color .2s, background .2s, box-shadow .2s, transform .2s;
        }

        .creator-tab:hover { color: #252d45; background: rgba(255,255,255,.65); }

        .creator-tab.active {
          color: #fff;
          background: var(--creator-primary);
          box-shadow: 0 5px 12px rgba(81,69,229,.23);
        }

        .creator-tab-count {
          display: inline-grid;
          min-width: 23px;
          height: 23px;
          padding: 0 6px;
          place-items: center;
          border-radius: 7px;
          color: inherit;
          background: rgba(125,135,155,.14);
          font-size: 11px;
        }

        .creator-tab.active .creator-tab-count { background: rgba(255,255,255,.2); }

        .creator-content {
          animation: creatorContentIn .3s ease both;
        }

        .creator-columns {
          display: grid;
          grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
          align-items: stretch;
          gap: 20px;
        }

        .creator-card {
          min-width: 0;
          padding: 25px;
          border: 1px solid var(--creator-border);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(23,32,51,.045);
        }

        .creator-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 23px;
        }

        .creator-card-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.025em;
        }

        .creator-card-subtitle {
          margin: 6px 0 0;
          color: var(--creator-muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .creator-label {
          display: block;
          margin-bottom: 8px;
          color: #344056;
          font-size: 12px;
          font-weight: 750;
        }

        .creator-field { margin-bottom: 19px; }

        .creator-input {
          display: block;
          width: 100%;
          min-height: 47px;
          padding: 12px 14px;
          border: 1px solid #d9dfeb;
          border-radius: 11px;
          outline: none;
          color: #1e293b;
          background: #fff;
          font-size: 13px;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }

        .creator-input::placeholder { color: #9aa5b6; }

        .creator-input:hover { border-color: #aeb8cc; }

        .creator-input:focus {
          border-color: #7367f0;
          box-shadow: 0 0 0 4px rgba(81,69,229,.10);
          background: #fff;
        }

        .creator-textarea { min-height: 108px; resize: vertical; line-height: 1.6; }

        .creator-help {
          margin-top: 7px;
          color: #8993a6;
          font-size: 11px;
          line-height: 1.5;
        }

        .creator-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 45px;
          padding: 12px 17px;
          border: 1px solid transparent;
          border-radius: 11px;
          color: #fff;
          background: linear-gradient(135deg, #594cf0, #4436d2);
          box-shadow: 0 5px 12px rgba(81,69,229,.18);
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }

        .creator-primary-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 17px rgba(81,69,229,.23); }
        .creator-primary-btn:active { transform: translateY(0); }
        .creator-primary-btn:disabled { opacity: .62; cursor: wait; transform: none; }

        .creator-search-wrap { position: relative; margin-bottom: 16px; }
        .creator-search-wrap .creator-input { padding-left: 41px; background: #f8f9fc; }
        .creator-search-icon { position: absolute; left: 14px; top: 14px; color: #929db0; pointer-events: none; }

        .creator-list-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 13px;
          color: #8590a4;
          font-size: 11px;
        }

        .creator-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 460px;
          overflow: auto;
          padding: 1px 4px 1px 1px;
          scrollbar-width: thin;
          scrollbar-color: #cbd2df transparent;
        }

        .creator-list::-webkit-scrollbar { width: 6px; }
        .creator-list::-webkit-scrollbar-thumb { border-radius: 8px; background: #cbd2df; }

        .creator-item {
          position: relative;
          padding: 15px 16px;
          border: 1px solid #e7eaf2;
          border-radius: 13px;
          background: #fff;
          transition: border-color .2s, transform .2s, box-shadow .2s;
          animation: creatorItemIn .28s ease both;
        }

        .creator-item:hover {
          border-color: #c9c6ff;
          box-shadow: 0 4px 13px rgba(35,43,71,.055);
          transform: translateY(-1px);
        }

        .creator-item-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .creator-item-title {
          overflow-wrap: anywhere;
          color: #202a40;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.55;
        }

        .creator-item-index {
          display: grid;
          flex: 0 0 31px;
          width: 31px;
          height: 31px;
          place-items: center;
          border-radius: 9px;
          color: #5145e5;
          background: #f0efff;
          font-size: 11px;
          font-weight: 800;
        }

        .creator-item-description {
          margin: 8px 0 0;
          color: #69758b;
          font-size: 12px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .creator-description-box {
          margin-top: 10px;
          padding: 11px 12px;
          border: 1px solid #e7eaf2;
          border-radius: 10px;
        }
        .creator-description-box strong {
          display: block;
          margin-bottom: 5px;
          font-size: 11px;
          font-weight: 800;
        }
        .creator-description-box p {
          margin: 0;
          color: #69758b;
          font-size: 12px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .creator-description-missing { background: #fff8ed; border-color: #f7e2c1; }
        .creator-description-missing strong { color: #a76512; }
        .creator-description-incorrect { background: #fff1f2; border-color: #f6d9de; }
        .creator-description-incorrect strong { color: #b83248; }
        .creator-description-general { background: #f5f4ff; border-color: #e3e1ff; }
        .creator-description-general strong { color: #5145b9; }

        .creator-request-list { display: flex; flex-direction: column; gap: 10px; max-height: 360px; overflow: auto; }
        .creator-request-item { width: 100%; text-align: left; padding: 14px; border: 1px solid #e2e7f0; border-radius: 12px; background: #fff; color: var(--creator-ink); cursor: pointer; transition: border-color .2s, background .2s, box-shadow .2s; }
        .creator-request-item:hover { border-color: #a8a1ff; background: #fafaff; }
        .creator-request-item.selected { border-color: #5145e5; background: #f3f2ff; box-shadow: 0 0 0 3px rgba(81,69,229,.09); }
        .creator-request-name { font-size: 13px; font-weight: 800; overflow-wrap: anywhere; }
        .creator-request-email { margin-top: 4px; color: #68758b; font-size: 12px; overflow-wrap: anywhere; }
        .creator-request-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
        .creator-request-role { padding: 4px 8px; border-radius: 7px; background: #e9e7ff; color: #4338ca; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .creator-request-date { color: #929db0; font-size: 10px; }
        .creator-request-action { margin-top: 9px; color: #5145e5; font-size: 11px; font-weight: 750; }

        .creator-condition-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 11px;
        }

        .creator-condition {
          padding: 5px 8px;
          border: 1px solid #e3e4ff;
          border-radius: 7px;
          color: #5145b9;
          background: #f5f4ff;
          font-size: 10px;
          font-weight: 700;
        }

        .creator-employee-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          background: #fff;
          transition: border-color .2s, background .2s, transform .2s;
          animation: creatorItemIn .28s ease both;
        }

        .creator-employee-item:hover { border-color: #bdebdc; background: #fbfffd; transform: translateX(2px); }

        .creator-avatar {
          display: grid;
          flex: 0 0 38px;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 12px;
          color: #087d68;
          background: #e3f8f0;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .creator-employee-name {
          min-width: 0;
          overflow-wrap: anywhere;
          color: #29344b;
          font-size: 13px;
          font-weight: 750;
        }

        .creator-employee-caption { margin-top: 3px; color: #9aa4b5; font-size: 10px; }

        .creator-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 210px;
          padding: 28px 16px;
          border: 1px dashed #dce2ee;
          border-radius: 14px;
          color: #98a2b3;
          text-align: center;
          background: #fafbfe;
        }

        .creator-empty-icon {
          display: grid;
          width: 47px;
          height: 47px;
          margin-bottom: 12px;
          place-items: center;
          border-radius: 14px;
          color: #7b70e9;
          background: #efeeff;
        }

        .creator-empty strong { color: #59657a; font-size: 13px; }
        .creator-empty span { margin-top: 6px; font-size: 12px; line-height: 1.6; }

        .creator-spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: creatorSpin .7s linear infinite;
        }

        .creator-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 250px;
          color: #657189;
          font-size: 13px;
          font-weight: 650;
        }

        .creator-loading-spinner {
          width: 23px;
          height: 23px;
          border: 3px solid #e3e5ff;
          border-top-color: #5145e5;
          border-radius: 50%;
          animation: creatorSpin .7s linear infinite;
        }

        .creator-toast-area {
          position: fixed;
          z-index: 9999;
          top: 22px;
          right: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: min(390px, calc(100vw - 32px));
          pointer-events: none;
        }

        .creator-toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px 15px;
          border: 1px solid #e3e8f0;
          border-radius: 15px;
          background: rgba(255,255,255,.97);
          box-shadow: 0 16px 45px rgba(20,29,51,.18);
          pointer-events: auto;
          animation: creatorToastIn .35s cubic-bezier(.2,.8,.2,1) both;
          backdrop-filter: blur(12px);
        }

        .creator-toast.success { border-left: 4px solid #13a477; }
        .creator-toast.error { border-left: 4px solid #e34e61; }

        .creator-toast-icon {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 11px;
          color: #07845f;
          background: #e1f8ed;
        }

        .creator-toast.error .creator-toast-icon { color: #d5384d; background: #ffebee; }

        .creator-toast-body { flex: 1; min-width: 0; padding-top: 1px; }
        .creator-toast-title { margin: 0; color: #202a40; font-size: 13px; font-weight: 800; }
        .creator-toast-message { margin: 4px 0 0; color: #68758b; font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }

        .creator-toast-close {
          display: grid;
          flex: 0 0 27px;
          width: 27px;
          height: 27px;
          place-items: center;
          border: 0;
          border-radius: 8px;
          color: #8590a4;
          background: transparent;
          cursor: pointer;
        }

        .creator-toast-close:hover { color: #263149; background: #f0f2f7; }

        .creator-toast-progress {
          height: 3px;
          margin: 11px 0 -15px -61px;
          border-radius: 0 0 0 12px;
          background: #e5eaf2;
          overflow: hidden;
        }

        .creator-toast-progress:after {
          content: "";
          display: block;
          height: 100%;
          width: 100%;
          transform-origin: left;
          background: #13a477;
          animation: creatorToastProgress 3.8s linear forwards;
        }

        .creator-toast.error .creator-toast-progress:after { background: #e34e61; }

        @keyframes creatorSpin { to { transform: rotate(360deg); } }
        @keyframes creatorContentIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes creatorItemIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes creatorToastIn { from { opacity: 0; transform: translateX(28px) scale(.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes creatorToastProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }

        @media (max-width: 900px) {
          .creator-columns { grid-template-columns: minmax(0, 1fr); }
          .creator-card { padding: 22px; }
        }

        @media (max-width: 560px) {
          .creator-hero { padding: 23px 20px; border-radius: 17px; }
          .creator-hero-meta { align-items: flex-start; flex-direction: column; }
          .creator-refresh { width: 100%; }
          .creator-stats { gap: 10px; }
          .creator-stat { gap: 10px; padding: 13px 10px; }
          .creator-stat-icon { flex-basis: 36px; width: 36px; height: 36px; }
          .creator-stat-number { font-size: 21px; }
          .creator-stat-label { font-size: 10px; }
          .creator-tabs { display: grid; grid-template-columns: 1fr; }
          .creator-tab { justify-content: flex-start; }
          .creator-card { padding: 18px; border-radius: 15px; }
          .creator-card-title { font-size: 16px; }
          .creator-toast-area { top: 12px; right: 12px; width: calc(100vw - 24px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .creator-page *, .creator-page *:before, .creator-page *:after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      {toast && (
        <div className="creator-toast-area" aria-live="polite" aria-atomic="true">
          <div key={toast.id} className={`creator-toast ${toast.type}`}>
            <div className="creator-toast-icon">
              <Icon name={toast.type === "success" ? "check" : "alert"} size={19} />
            </div>

            <div className="creator-toast-body">
              <p className="creator-toast-title">
                {toast.type === "success" ? "Success" : "Action needed"}
              </p>
              <p className="creator-toast-message">{toast.message}</p>
              <div className="creator-toast-progress" />
            </div>

            <button
              type="button"
              className="creator-toast-close"
              aria-label="Dismiss notification"
              onClick={() => {
                if (toastTimer.current) clearTimeout(toastTimer.current);
                setToast(null);
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      <header className="creator-hero">
        <div className="creator-hero-meta">
          <div>
            <div className="creator-eyebrow">
              <Icon name="grid" size={15} />
              Administration workspace
            </div>

            <h1>Creator Dashboard</h1>
            <p>
              Manage QC mistake categories, employee names, and user accounts
              from one organized workspace.
            </p>
          </div>

          <button
            type="button"
            className="creator-refresh"
            disabled={pageLoading}
            onClick={() => loadData(true)}
          >
            {pageLoading ? (
              <span className="creator-spinner" />
            ) : (
              <Icon name="refresh" size={17} />
            )}
            {pageLoading ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </header>

      <section className="creator-stats" aria-label="Dashboard summary">
        <div className="creator-stat">
          <div className="creator-stat-icon">
            <Icon name="layers" size={22} />
          </div>
          <div>
            <div className="creator-stat-label">Custom mistake types</div>
            <div className="creator-stat-number">{mistakeTypes.length}</div>
          </div>
        </div>

        <div className="creator-stat">
          <div className="creator-stat-icon employee">
            <Icon name="users" size={22} />
          </div>
          <div>
            <div className="creator-stat-label">Registered employees</div>
            <div className="creator-stat-number">{employees.length}</div>
          </div>
        </div>
      </section>

      <nav className="creator-tabs" aria-label="Creator dashboard sections">
        <button
          type="button"
          className={`creator-tab ${activeTab === "mistakes" ? "active" : ""}`}
          aria-current={activeTab === "mistakes" ? "page" : undefined}
          onClick={() => setActiveTab("mistakes")}
        >
          <Icon name="tag" size={18} />
          Mistake Type Management
          <span className="creator-tab-count">{mistakeTypes.length}</span>
        </button>

        <button
          type="button"
          className={`creator-tab ${activeTab === "employees" ? "active" : ""}`}
          aria-current={activeTab === "employees" ? "page" : undefined}
          onClick={() => setActiveTab("employees")}
        >
          <Icon name="users" size={18} />
          Employee Management
          <span className="creator-tab-count">{employees.length}</span>
        </button>

        <button
          type="button"
          className={`creator-tab ${activeTab === "users" ? "active" : ""}`}
          aria-current={activeTab === "users" ? "page" : undefined}
          onClick={() => setActiveTab("users")}
        >
          <Icon name="user" size={18} />
          User Account Management
        </button>
      </nav>

      {pageLoading ? (
        <div className="creator-card creator-loading">
          <span className="creator-loading-spinner" />
          Loading your dashboard...
        </div>
      ) : (
        <>
          {activeTab === "mistakes" && (
            <section key="mistakes" className="creator-content creator-columns">
              <div className="creator-card">
                <div className="creator-card-head">
                  <div>
                    <h2 className="creator-card-title">Add New Mistake Type</h2>
                    <p className="creator-card-subtitle">
                      Define a category, its description, and supported conditions.
                    </p>
                  </div>
                  <div className="creator-stat-icon">
                    <Icon name="plus" size={21} />
                  </div>
                </div>

                <form onSubmit={addMistakeType}>
                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-mistake-name">
                      Mistake type name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="creator-mistake-name"
                      required
                      maxLength={150}
                      className="creator-input"
                      value={mistakeName}
                      onChange={(event) => setMistakeName(event.target.value)}
                      placeholder="e.g. ICD code missing or incorrect"
                    />
                  </div>

                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-not-added-description">
                      Not Added / Missing Description
                    </label>
                    <textarea
                      id="creator-not-added-description"
                      maxLength={2000}
                      className="creator-input creator-textarea"
                      rows={3}
                      value={notAddedDescription}
                      onChange={(event) => setNotAddedDescription(event.target.value)}
                      placeholder="Explain what was not added and what the QC reviewer should check..."
                    />
                    <div className="creator-help">
                      {notAddedDescription.length}/2000 characters
                    </div>
                  </div>

                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-incorrect-description">
                      Incorrect Description
                    </label>
                    <textarea
                      id="creator-incorrect-description"
                      maxLength={2000}
                      className="creator-input creator-textarea"
                      rows={3}
                      value={incorrectDescription}
                      onChange={(event) => setIncorrectDescription(event.target.value)}
                      placeholder="Explain what is incorrect and what should be corrected..."
                    />
                    <div className="creator-help">
                      {incorrectDescription.length}/2000 characters
                    </div>
                  </div>

                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-general-description">
                      General Description (optional)
                    </label>
                    <textarea
                      id="creator-general-description"
                      maxLength={2000}
                      className="creator-input creator-textarea"
                      rows={2}
                      value={generalDescription}
                      onChange={(event) => setGeneralDescription(event.target.value)}
                      placeholder="Optional notes that apply to this mistake type generally..."
                    />
                  </div>

                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-conditions">
                      Conditions
                    </label>
                    <textarea
                      id="creator-conditions"
                      className="creator-input creator-textarea"
                      rows={4}
                      value={conditions}
                      onChange={(event) => setConditions(event.target.value)}
                      placeholder={"Missing\nIncorrect\nNot applicable"}
                    />
                    <div className="creator-help">
                      Enter one condition per line. These options can describe
                      how the mistake occurred.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="creator-primary-btn"
                  >
                    {loading ? (
                      <>
                        <span className="creator-spinner" />
                        Saving mistake type...
                      </>
                    ) : (
                      <>
                        <Icon name="plus" size={17} />
                        Add mistake type
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="creator-card">
                <div className="creator-card-head">
                  <div>
                    <h2 className="creator-card-title">Existing Mistake Types</h2>
                    <p className="creator-card-subtitle">
                      Search and review the custom categories already saved.
                    </p>
                  </div>
                  <div className="creator-stat-icon">
                    <Icon name="list" size={21} />
                  </div>
                </div>

                <div className="creator-search-wrap">
                  <span className="creator-search-icon">
                    <Icon name="search" size={17} />
                  </span>
                  <input
                    type="search"
                    className="creator-input"
                    value={mistakeSearch}
                    onChange={(event) => setMistakeSearch(event.target.value)}
                    placeholder="Search name, description, or condition..."
                    aria-label="Search mistake types"
                  />
                </div>

                <div className="creator-list-meta">
                  <span>
                    Showing {filteredMistakes.length} of {mistakeTypes.length}
                  </span>
                  <span>Newest data from server</span>
                </div>

                <div className="creator-list">
                  {filteredMistakes.map((item, index) => {
                    const itemConditions = formatConditions(item.conditions);

                    return (
                      <article className="creator-item" key={item.id ?? item.name}>
                        <div className="creator-item-top">
                          <div className="creator-item-title">{item.name}</div>
                          <span className="creator-item-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        {(() => {
                          const parsedDescription = parseMistakeDescription(item.description);
                          return (
                            <>
                              {parsedDescription.notAdded && (
                                <div className="creator-description-box creator-description-missing">
                                  <strong>Not Added / Missing</strong>
                                  <p>{parsedDescription.notAdded}</p>
                                </div>
                              )}
                              {parsedDescription.incorrect && (
                                <div className="creator-description-box creator-description-incorrect">
                                  <strong>Incorrect</strong>
                                  <p>{parsedDescription.incorrect}</p>
                                </div>
                              )}
                              {parsedDescription.general && (
                                <div className="creator-description-box creator-description-general">
                                  <strong>General Description</strong>
                                  <p>{parsedDescription.general}</p>
                                </div>
                              )}
                              {parsedDescription.legacy && (
                                <p className="creator-item-description">
                                  {parsedDescription.legacy}
                                </p>
                              )}
                            </>
                          );
                        })()}

                        {itemConditions.length > 0 && (
                          <div className="creator-condition-list">
                            {itemConditions.map((condition, conditionIndex) => (
                              <span
                                className="creator-condition"
                                key={`${condition}-${conditionIndex}`}
                              >
                                {condition}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}

                  {filteredMistakes.length === 0 && (
                    <div className="creator-empty">
                      <div className="creator-empty-icon">
                        <Icon name="search" size={22} />
                      </div>
                      <strong>
                        {mistakeTypes.length
                          ? "No matching mistake types"
                          : "No custom mistake types yet"}
                      </strong>
                      <span>
                        {mistakeTypes.length
                          ? "Try another search term."
                          : "Use the form to add your first custom category."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "employees" && (
            <section key="employees" className="creator-content creator-columns">
              <div className="creator-card">
                <div className="creator-card-head">
                  <div>
                    <h2 className="creator-card-title">Add Employee</h2>
                    <p className="creator-card-subtitle">
                      Add an employee name to your QC selection list.
                    </p>
                  </div>
                  <div className="creator-stat-icon employee">
                    <Icon name="user" size={21} />
                  </div>
                </div>

                <form onSubmit={addEmployee}>
                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-employee-name">
                      Employee name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="creator-employee-name"
                      required
                      maxLength={120}
                      className="creator-input"
                      value={employeeName}
                      onChange={(event) => setEmployeeName(event.target.value)}
                      placeholder="e.g. employee.name"
                    />
                    <div className="creator-help">
                      Duplicate names are checked before submitting.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="creator-primary-btn"
                  >
                    {loading ? (
                      <>
                        <span className="creator-spinner" />
                        Saving employee...
                      </>
                    ) : (
                      <>
                        <Icon name="plus" size={17} />
                        Add employee
                      </>
                    )}
                  </button>
                </form>

                <div
                  style={{
                    marginTop: 25,
                    padding: 16,
                    border: "1px solid #dcefe8",
                    borderRadius: 13,
                    background: "#f5fcf9",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="creator-stat-icon employee" style={{ width: 36, height: 36, flexBasis: 36 }}>
                      <Icon name="check" size={18} />
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#176b57" }}>
                        Employee directory
                      </div>
                      <div style={{ fontSize: 11, color: "#688a80", marginTop: 3 }}>
                        {employees.length} employee{employees.length === 1 ? "" : "s"} currently registered
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="creator-card">
                <div className="creator-card-head">
                  <div>
                    <h2 className="creator-card-title">Employee Directory</h2>
                    <p className="creator-card-subtitle">
                      Find and review registered employee names.
                    </p>
                  </div>
                  <div className="creator-stat-icon employee">
                    <Icon name="users" size={21} />
                  </div>
                </div>

                <div className="creator-search-wrap">
                  <span className="creator-search-icon">
                    <Icon name="search" size={17} />
                  </span>
                  <input
                    type="search"
                    className="creator-input"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    placeholder="Search employee names..."
                    aria-label="Search employees"
                  />
                </div>

                <div className="creator-list-meta">
                  <span>
                    Showing {filteredEmployees.length} of {employees.length}
                  </span>
                  <span>Registered employees</span>
                </div>

                <div className="creator-list">
                  {filteredEmployees.map((employee, index) => (
                    <div
                      className="creator-employee-item"
                      key={employee.id ?? employee.name}
                    >
                      <div className="creator-avatar">
                        {employee.name?.trim().charAt(0) || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="creator-employee-name">
                          {employee.name}
                        </div>
                        <div className="creator-employee-caption">
                          Employee #{String(index + 1).padStart(2, "0")}
                        </div>
                      </div>
                      <span style={{ color: "#0b9873" }}>
                        <Icon name="check" size={17} />
                      </span>
                    </div>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <div className="creator-empty">
                      <div className="creator-empty-icon">
                        <Icon name="users" size={22} />
                      </div>
                      <strong>
                        {employees.length
                          ? "No matching employees"
                          : "No employees added yet"}
                      </strong>
                      <span>
                        {employees.length
                          ? "Try another name."
                          : "Add an employee using the form to get started."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "users" && (
            <section key="users" className="creator-content creator-columns">
              <div className="creator-card">
                <div className="creator-card-head">
                  <div>
                    <h2 className="creator-card-title">Create User Account</h2>
                    <p className="creator-card-subtitle">
                      Create an account with an email address, password, and access role.
                    </p>
                  </div>
                  <div className="creator-stat-icon">
                    <Icon name="user" size={21} />
                  </div>
                </div>

                <form onSubmit={createUser}>
                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-user-name">
                      Full name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="creator-user-name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      className="creator-input"
                      value={userName}
                      onChange={(event) => setUserName(event.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-user-email">
                      Email address <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="creator-user-email"
                      required
                      type="email"
                      maxLength={255}
                      autoComplete="email"
                      className="creator-input"
                      value={userEmail}
                      onChange={(event) => setUserEmail(event.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>

                  {!selectedRequestId ? (
                    <div className="creator-field">
                      <label className="creator-label" htmlFor="creator-user-password">
                        Password <span aria-hidden="true">*</span>
                      </label>
                      <input
                        id="creator-user-password"
                        required={!selectedRequestId}
                        type="password"
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        className="creator-input"
                        value={userPassword}
                        onChange={(event) => setUserPassword(event.target.value)}
                        placeholder="Enter a password (8–72 characters)"
                      />
                      <div className="creator-help">
                        Passwords are hashed on the server before they are stored.
                      </div>
                    </div>
                  ) : (
                    <div className="creator-description-box creator-description-general">
                      <strong>Access request selected</strong>
                      <p>
                        The account will use the password hash securely stored
                        with this request. The password is not displayed here.
                      </p>
                    </div>
                  )}

                  <div className="creator-field">
                    <label className="creator-label" htmlFor="creator-user-role">
                      Account role <span aria-hidden="true">*</span>
                    </label>
                    <select
                      id="creator-user-role"
                      required
                      className="creator-input"
                      value={userRole}
                      onChange={(event) => setUserRole(event.target.value)}
                    >
                      <option value="user">User — Standard access</option>
                      <option value="admin">Admin — Administrator</option>
                    </select>
                    {selectedRequestId && (
                      <div className="creator-help" style={{ color: "#5145e5" }}>
                        Role filled from the selected access request. Verify it before creating the account.
                      </div>
                    )}
                    {userRole === "admin" && (
                      <div className="creator-help" style={{ color: "#a76512" }}>
                        Assign administrator access only to trusted people.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="creator-primary-btn"
                  >
                    {loading ? (
                      <>
                        <span className="creator-spinner" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Icon name="plus" size={17} />
                        Create account
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="creator-card">
                <div className="creator-card-head">
                  <div>
                    <h2 className="creator-card-title">Pending Access Requests</h2>
                    <p className="creator-card-subtitle">
                      Select a request to fill the account form automatically.
                    </p>
                  </div>
                  <div className="creator-stat-icon">
                    <Icon name="users" size={21} />
                  </div>
                </div>

                <div className="creator-list-meta">
                  <span>{accessRequests.length} pending request{accessRequests.length === 1 ? "" : "s"}</span>
                  <button
                    type="button"
                    className="creator-tab"
                    style={{ minHeight: 30, padding: "5px 9px", fontSize: 11 }}
                    onClick={loadAccessRequests}
                    disabled={requestsLoading}
                  >
                    <Icon name="refresh" size={13} />
                    {requestsLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {requestsLoading ? (
                  <div className="creator-empty">
                    <span className="creator-loading-spinner" />
                    <strong>Loading access requests...</strong>
                  </div>
                ) : accessRequests.length > 0 ? (
                  <div className="creator-request-list">
                    {accessRequests.map((request) => {
                      const requestId = request.id ?? request.email;
                      const requestedRole = String(request.requested_role ?? request.requestedRole ?? "user").toLowerCase();
                      return (
                        <button
                          type="button"
                          key={requestId}
                          className={`creator-request-item ${selectedRequestId === requestId ? "selected" : ""}`}
                          onClick={() => selectAccessRequest(request)}
                          aria-pressed={selectedRequestId === requestId}
                        >
                          <div className="creator-request-name">{request.name || "Name not provided"}</div>
                          <div className="creator-request-email">{request.email || "Email not provided"}</div>
                          <div className="creator-request-meta">
                            <span className="creator-request-role">{requestedRole}</span>
                            <span className="creator-request-date">
                              {request.created_at ? new Date(request.created_at).toLocaleDateString() : "Pending review"}
                            </span>
                          </div>
                          <div className="creator-request-action">Click to fill account form →</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="creator-empty">
                    <div className="creator-empty-icon"><Icon name="users" size={22} /></div>
                    <strong>No pending access requests</strong>
                    <span>New requests will appear here after the backend API is connected.</span>
                  </div>
                )}

                <div className="creator-card-head" style={{ marginTop: 26, marginBottom: 15 }}>
                  <div>
                    <h2 className="creator-card-title">Account Security</h2>
                    <p className="creator-card-subtitle">
                      Important details about account creation and access.
                    </p>
                  </div>
                  <div className="creator-stat-icon employee">
                    <Icon name="check" size={21} />
                  </div>
                </div>

                <div className="creator-description-box creator-description-general">
                  <strong>Password protection</strong>
                  <p>
                    The server hashes the password with bcryptjs. The original
                    password and password hash are not returned to the browser.
                  </p>
                </div>

                <div className="creator-description-box creator-description-missing">
                  <strong>Administrator access</strong>
                  <p>
                    Only an authorized administrator can create accounts.
                    The server must enforce role checks; hiding controls in the
                    frontend alone is not security.
                  </p>
                </div>

                <div className="creator-description-box creator-description-incorrect">
                  <strong>Duplicate email addresses</strong>
                  <p>
                    The backend should reject email addresses already registered
                    in the users table.
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
