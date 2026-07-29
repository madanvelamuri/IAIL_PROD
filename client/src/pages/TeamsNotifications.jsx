import React, { useState, useEffect } from 'react';
import { Settings, Send, Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import TeamsModal from '../components/TeamsModal';
import TeamsSettings from '../components/TeamsSettings';
import { getNotifications, resendNotification } from '../services/teamsService';

const TeamsNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employee, setEmployee] = useState('All Employees');
  const [teamsGroup, setTeamsGroup] = useState('All Groups');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(12);
  const [totalEntries, setTotalEntries] = useState(120);

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
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
    setEmployee('All Employees');
    setTeamsGroup('All Groups');
    setStatus('All');
    setSearch('');
    setCurrentPage(1);
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

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <Send className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Teams Notifications</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send Test Notification
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="All Employees">All Employees</option>
            <option value="harshitha.botsa">harshitha.botsa</option>
            <option value="durgabhavani.k">durgabhavani.k</option>
            <option value="divya.pandluru">divya.pandluru</option>
            <option value="rajesh.k">rajesh.k</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Teams Group</label>
          <select
            value={teamsGroup}
            onChange={(e) => setTeamsGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="All Groups">All Groups</option>
            <option value="QC Team">QC Team</option>
            <option value="Audit Team">Audit Team</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">&nbsp;</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </form>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-semibold text-xs">
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Claim ID <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Employee Name <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Mistake Type <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Created Date <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Teams Group <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">Sent At <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">Loading records...</td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">No notification logs found.</td>
                </tr>
              ) : (
                notifications.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
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
                          className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition"
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

        {/* Footer & Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>

            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <span className="px-1 text-gray-400">...</span>

            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                currentPage === totalPages
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {totalPages}
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
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