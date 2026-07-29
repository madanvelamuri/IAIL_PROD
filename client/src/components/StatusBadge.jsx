import React from 'react';

const StatusBadge = ({ status }) => {
  const isSent = status?.toLowerCase() === 'sent';
  const isFailed = status?.toLowerCase() === 'failed';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        isSent
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
          : isFailed
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;