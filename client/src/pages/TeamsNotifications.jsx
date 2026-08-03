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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { 
  getNotifications, 
  syncDashboardNotifications, 
  sendReportNotification,
  deleteNotification 
} from '../services/teamsService';

import TeamsModal from '../components/TeamsModal';
import TeamsSettings from '../components/TeamsSettings';

const TeamsNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filter States
  const [fromDate, setFromDate] = useState('');
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

  // Toast Notification State
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
      showToast('error', 'Failed to fetch notification records.');
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
      showToast('error', `Failed to send report. Check webhook settings.`);
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

  // Helper to format ISO timestamps neatly
  const formatDateTime = (rawDate) => {
    if (!rawDate) return '—';
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return String(rawDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Smart Pagination range builder (prevents 50 buttons from stretching screen)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-[1600px] mx-auto text-slate-800">
      
      {/* Toast Notification Popups */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white border transition-all animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------- 1. PAGE HEADER & ACTIONS ---------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-200/50">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Teams Notifications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage, sync, and deliver real-time reports to Microsoft Teams</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>

          <div className="relative flex items-center">
            <Users className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={selectedReportGroup}
              onChange={(e) => setSelectedReportGroup(e.target.value)}
              className="pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-sm appearance-none cursor-pointer"
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            {reportLoading ? 'Posting...' : 'Send Report'}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Settings
          </button>

          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test
          </button>
        </div>
      </div>

      {/* ---------------- 2. SEARCH & FILTERS TOOLBAR ---------------- */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap xl:flex-nowrap items-center gap-3">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          />
        </div>

        <div className="flex-1 min-w-[170px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Employee</label>
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Employee Name"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Mistake Type / Claim ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 xl:pt-0">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </form>

      {/* ---------------- 3. DATA TABLE ---------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Claim ID <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Mistake Type <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Created Date <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Teams Group <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4"><div className="flex items-center gap-1">Sent At <ArrowUpDown className="w-3 h-3 text-slate-400" /></div></th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">Loading records...</td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">No notification logs found.</td>
                </tr>
              ) : (
                notifications.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.claim_id}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{row.employee_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{row.mistake_type}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{row.description}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDateTime(row.created_date || row.created_at)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{row.teams_group || 'QC Team'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        row.status === 'Sent' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : row.status === 'Failed' 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDateTime(row.sent_at)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

        {/* ---------------- 4. CLEAN PAGINATION FOOTER ---------------- */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{totalEntries === 0 ? 0 : (currentPage - 1) * 10 + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(currentPage * 10, totalEntries)}</span> of <span className="font-semibold text-slate-800">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Render 1st page shortcut if scrolled far */}
            {currentPage > 3 && totalPages > 5 && (
              <>
                <button onClick={() => setCurrentPage(1)} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">1</button>
                <span className="px-1 text-slate-400">...</span>
              </>
            )}

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Render Last page shortcut */}
            {currentPage < totalPages - 2 && totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">{totalPages}</button>
              </>
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Popup Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Notification?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete claim <span className="font-semibold text-slate-800">#{deleteTarget.claim_id}</span>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TeamsModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />
      <TeamsSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default TeamsNotifications;