import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { sendTestNotification } from '../services/teamsService';

const TeamsModal = ({ isOpen, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await sendTestNotification(webhookUrl);
      setMessage({ type: 'success', text: 'Test notification sent successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send test notification.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          Send Test Notification
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Enter an incoming webhook URL from Microsoft Teams to test integration.
        </p>

        <form onSubmit={handleTest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Teams Webhook URL
            </label>
            <input
              type="url"
              required
              placeholder="https://outlook.office.com/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamsModal;