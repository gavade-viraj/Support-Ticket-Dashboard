const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  color = 'blue',
  active = false,
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: active ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/80',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: active ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200/80',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: active ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: active ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200/80',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-600',
      border: active ? 'border-slate-500 ring-2 ring-slate-500/10' : 'border-slate-200/80',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 ${scheme.border} ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <p className="text-[1.8rem] font-bold leading-none tracking-[-0.05em] text-slate-900">{value}</p>
          {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
        </div>

        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${scheme.bg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;