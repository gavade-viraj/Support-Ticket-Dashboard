const PriorityBadge = ({ priority, size = 'sm' }) => {
  const getPriorityConfig = (p) => {
    switch (p?.toLowerCase()) {
      case 'low':
        return {
          wrapper: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'medium':
        return {
          wrapper: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500',
        };
      case 'high':
        return {
          wrapper: 'bg-orange-50 text-orange-700 border-orange-200/80',
          dot: 'bg-orange-500',
        };
      case 'urgent':
        return {
          wrapper: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
          dot: 'bg-rose-500 animate-pulse',
        };
      default:
        return {
          wrapper: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getPriorityConfig(priority);
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.wrapper} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {priority || 'Unknown'}
    </span>
  );
};

export default PriorityBadge;