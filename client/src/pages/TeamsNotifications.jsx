import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Send, 
  Search, 
  RotateCcw, 
  ArrowUpDown, 
  User, 
  FileText, 
  Users, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  LayoutDashboard, 
  PlusCircle, 
  Bell, 
  LogOut 
} from 'lucide-react';

import StatusBadge from '../components/StatusBadge';
import TeamsModal from '../components/TeamsModal';
import TeamsSettings from '../components/TeamsSettings';
import { 
  getNotifications, 
  resendNotification, 
  syncDashboardNotifications, 
  sendReportNotification,
  deleteNotification // Ensure this endpoint exists in your teamsService.js
} from '../services/teamsService';

const TeamsNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filter States
  const [fromDate, setFromDate] = useState('2026-08-03');
  const [toDate, setToDate] = useState('');
  const [employee, setEmployee] = useState('');
  const [selectedReportGroup, setSelectedReportGroup] = useState('QC Team');
  const [search, setSearch] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Modals & UI Controls
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Messages State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getNotifications({
        fromDate,
        toDate,
        employee,
        teamsGroup: selectedReportGroup,
        search,
        page: currentPage,
        limit: 10,
      });
      setNotifications(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotalEntries(response?.total || 0);
    } catch (err) {
      showToast('error', 'Failed to fetch notifications records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setEmployee('');
    setSelectedReportGroup('QC Team');
    setSearch('');
    setCurrentPage(1);
    fetchLogs();
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncDashboardNotifications();
      showToast('success', `Data synced! Updated ${res?.changes || 0} records.`);
      fetchLogs();
    } catch (err) {
      showToast('error', 'Failed to sync dashboard data.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      await syncDashboardNotifications().catch(() => {});
      await sendReportNotification({
        teamsGroup: selectedReportGroup,
        fromDate,
        toDate,
        employee,
        search,
      });
      showToast('success', `Report posted to ${selectedReportGroup} successfully!`);
      fetchLogs();
    } catch (err) {
      showToast('error', `Failed to send report. Check webhook configuration.`);
    } finally {
      setReportLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteNotification) {
        await deleteNotification(deleteTarget.id);
      }
      showToast('success', `Record #${deleteTarget.claim_id} deleted successfully.`);
      setDeleteTarget(null);
      fetchLogs();
    } catch (err) {
      showToast('error', 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100/70 font-sans text-slate-800 overflow-hidden">
      
      {/* Dynamic Pop-up Toast Message */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white transition-all transform animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xl tracking-wider">
              IAIL
            </div>
            <span className="text-xl font-bold text-white tracking-wide">IAIL</span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition">
              <PlusCircle className="w-4 h-4" />
              Add Mistake
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-sm">
              <Bell className="w-4 h-4 text-blue-400" />
              Teams Notifications
            </button>
          </nav>
        </div>

        {/* Logout Button */}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition shadow-sm">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold text-slate-800">Mistake Tracking System</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Madan</span>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              M
            </div>
          </div>
        </header>

        {/* Main Dashboard Container */}
        <div className="p-8 space-y-6 flex-1">
          
          {/* Header Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Teams Notifications</h2>
                <p className="text-xs text-slate-500">Manage, sync, and deliver real-time reports to Microsoft Teams</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>

              <div className="relative flex items-center">
                <Users className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedReportGroup}
                  onChange={(e) => setSelectedReportGroup(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm appearance-none cursor-pointer"
                >
                  <option value="QC Team">QC Team</option>
                  <option value="QA Team">QA Team</option>
                  <option value="Management">Management</option>
                  <option value="Claims Team">Claims Team</option>
                </select>
              </div>

              <button
                onClick={handleSendReport}
                disabled={reportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition shadow-sm"
              >
                <FileText className="w-4 h-4" />
                {reportLoading ? 'Posting...' : 'Send Report'}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Settings
              </button>

              <button
                onClick={() => setIsTestModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                Send Test
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-3">
            <div className="flex-1 min-w-[140px]">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="flex-1 min-w-[160px] relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Employee Name"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="flex-1 min-w-[180px] relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Mistake Type / Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <Search className="w-4 h-4" />
                Search
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold text-xs">
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Claim ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Mistake Type <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Created Date <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Teams Group <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1">Sent At <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                    </th>
                    <th className="py-3.5 px-4 text-center font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-slate-400">Loading records...</td>
                    </tr>
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-slate-400">No notification logs found.</td>
                    </tr>
                  ) : (
                    notifications.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.claim_id}</td>
                        <td className="py-3.5 px-4 text-slate-600">{row.employee_name}</td>
                        <td className="py-3.5 px-4 font-medium">{row.mistake_type}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{row.description}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">{row.created_date}</td>
                        <td className="py-3.5 px-4 font-medium">{row.teams_group || 'QC Team'}</td>
                        <td className="py-3.5 px-4">
                          {/* Styled Status Pill Badge */}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.status === 'Sent' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : row.status === 'Failed' 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {row.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">{row.sent_at || '—'}</td>
                        <td className="py-3.5 px-4 text-center">
                          {/* Delete Action Button */}
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                Showing {totalEntries === 0 ? 0 : (currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalEntries)} of {totalEntries} entries
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition font-medium"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---------------- DELETE CONFIRMATION POPUP MODAL ---------------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Notification?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete claim <span className="font-semibold text-slate-800">#{deleteTarget.claim_id}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals */}
      <TeamsModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />
      <TeamsSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default TeamsNotifications;