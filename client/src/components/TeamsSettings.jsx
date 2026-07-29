import React, { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';
import { getTeamsSettings, saveTeamsSettings } from '../services/teamsService';

const TeamsSettings = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('QC Team');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getTeamsSettings().then((configs) => {
        const qcConfig = configs.find((c) => c.group_name === 'QC Team');
        if (qcConfig) setWebhookUrl(qcConfig.webhook_url);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      await saveTeamsSettings({ groupName, webhookUrl });
      setStatusMsg({ type: 'success', text: 'Webhook configuration saved!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          MS Teams Channel Configurations
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Map internal groups to Microsoft Teams incoming webhook endpoints.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Teams Group
            </label>
            <select
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="QC Team">QC Team</option>
              <option value="Billing Team">Billing Team</option>
              <option value="Audit Team">Audit Team</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Incoming Webhook URL
            </label>
            <input
              type="url"
              required
              placeholder="https://outlook.office.com/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-lg text-xs ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {statusMsg.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamsSettings;