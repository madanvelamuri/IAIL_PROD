import React, { useState, useEffect } from 'react';
import { Settings, Send, Search, RotateCcw, ArrowUpDown, User, FileText, Users, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import TeamsModal from '../components/TeamsModal';
import TeamsSettings from '../components/TeamsSettings';
import { 
  getNotifications, 
  resendNotification, 
  syncDashboardNotifications, 
  sendReportNotification 
} from '../services/teamsService';

const TeamsNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Group Select State for Manual Report Posting
  const [selectedReportGroup, setSelectedReportGroup] = useState('QC Team');

  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employee, setEmployee] = useState('');
  const [teamsGroup, setTeamsGroup] = useState('All Groups');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Sync latest dashboard data first to ensure reflection
      await syncDashboardNotifications().catch(() => {});
      
      const response = await getNotifications({
        fromDate,
        toDate,
        employee,
        teamsGroup,
        status,
        search,
        page: currentPage,
        limit: 10,
      });
      setNotifications(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalEntries(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
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
    setTeamsGroup('All Groups');
    setStatus('All');
    setSearch('');
    setCurrentPage(1);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncDashboardNotifications();
      alert(`✅ Dashboard data synced! Updated ${res.changes || 0} records.`);
      fetchLogs();
    } catch (err) {
      alert('Failed to sync dashboard data.');
    } finally {
      setSyncing(false);
    }
  };

  const handleResend = async (item) => {
    try {
      await resendNotification({
        notificationId: item.id,
        claimId: item.claim_id,
        employeeName: item.employee_name,
        mistakeType: item.mistake_type,
        description: item.description,
        teamsGroup: item.teams_group,
      });
      fetchLogs();
    } catch (err) {
      alert('Failed to resend notification');
    }
  };

  // Manual Trigger with Pre-syncing to catch screenshot_url updates
  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      // Step 1: Force sync from 'mistakes' table to catch latest screenshot_url columns
      await syncDashboardNotifications().catch(() => {});

      // Step 2: Post report table to MS Teams Webhook
      await sendReportNotification({
        teamsGroup: selectedReportGroup,
        fromDate,
        toDate,
        employee,
        search,
      });

      alert(`📊 Report table successfully posted to ${selectedReportGroup}!`);
      fetchLogs();
    } catch (err) {
      console.error('Failed to send report:', err);
      alert(`Failed to send report to ${selectedReportGroup}. Please verify Webhook configuration in Settings.`);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-100/60 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold shadow-sm">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teams Notifications</h1>
            <p className="text-xs text-gray-500">Manage, sync, and deliver real-time reports to Microsoft Teams</p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
            title="Force sync records from Mistakes table"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>

          {/* Group Select Dropdown */}
          <div className="relative flex items-center">
            <Users className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none" />
            <select
              value={selectedReportGroup}
              onChange={(e) => setSelectedReportGroup(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm appearance-none cursor-pointer"
            >
              <option value="QC Team">QC Team</option>
              <option value="QA Team">QA Team</option>
              <option value="Management">Management</option>
              <option value="Claims Team">Claims Team</option>
            </select>
          </div>

          {/* Manual Post Report Button */}
          <button
            onClick={handleSendReport}
            disabled={reportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {reportLoading ? 'Posting Report...' : 'Send Report'}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            Settings
          </button>
          
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send Test
          </button>
        </div>
      </div>

      {/* Search Filter Toolbar */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 mb-6 flex flex-wrap lg:flex-nowrap items-center gap-3"
      >
        <div className="flex-1 min-w-[140px]">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50/70 border border-gray-200/80 rounded-xl text-sm text-gray-600 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50/70 border border-gray-200/80 rounded-xl text-sm text-gray-600 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="flex-1 min-w-[170px] relative">
          <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            placeholder="Employee Name"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-gray-200/80 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="flex-1 min-w-[170px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            placeholder="Mistake Type / Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-gray-200/80 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </form>

      {/* Notification Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500 font-semibold text-xs">
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Claim ID <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Mistake Type <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Created Date <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Teams Group <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <div className="flex items-center gap-1">Sent At <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-400">Loading records...</td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-400">No notification logs found.</td>
                </tr>
              ) : (
                notifications.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-medium text-gray-900">{row.claim_id}</td>
                    <td className="py-3.5 px-4 text-gray-600">{row.employee_name}</td>
                    <td className="py-3.5 px-4">{row.mistake_type}</td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">{row.description}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-pre-line">{row.created_date}</td>
                    <td className="py-3.5 px-4">{row.teams_group}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-pre-line">{row.sent_at || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      {row.status === 'Failed' ? (
                        <button
                          onClick={() => handleResend(row)}
                          className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition"
                        >
                          Send Again
                        </button>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Dynamic Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            Showing {totalEntries === 0 ? 0 : (currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, array) => (
                <React.Fragment key={page}>
                  {idx > 0 && array[idx - 1] !== page - 1 && (
                    <span className="px-1 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TeamsModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />
      <TeamsSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default TeamsNotifications;