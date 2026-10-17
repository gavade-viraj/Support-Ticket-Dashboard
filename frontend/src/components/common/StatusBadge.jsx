const StatusBadge = ({ status, size = 'sm' }) => {
  const getStatusConfig = (s) => {
    switch (s?.toLowerCase()) {
      case 'open':
        return {
          wrapper: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dot: 'bg-blue-500',
        };
      case 'in progress':
        return {
          wrapper: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          dot: 'bg-indigo-500',
        };
      case 'resolved':
        return {
          wrapper: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'closed':
        return {
          wrapper: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        };
      default:
        return {
          wrapper: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.wrapper} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;