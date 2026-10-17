import { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Activity,
  Trash2,
  UserCheck,
  Mail,
  Tag,
  Flame,
  FileText,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { ticketsAPI } from '../../api/tickets';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a UTC ISO string into a human-friendly relative time.
 * Falls back to a formatted date when the event is older than a week.
 */
function timeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Map the backend action string → { label, Icon, iconBg, iconColor }
 * The backend sends exact strings like "Ticket Created", "Priority Changed", etc.
 */
function resolveAction(action = '') {
  const normalized = action.toLowerCase();

  if (normalized.includes('created')) {
    return { label: 'Ticket Created', Icon: PlusCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' };
  }
  if (normalized.includes('status')) {
    return { label: 'Status Changed', Icon: RefreshCw, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' };
  }
  if (normalized.includes('priority')) {
    return { label: 'Priority Changed', Icon: Flame, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' };
  }
  if (normalized.includes('customer name')) {
    return { label: 'Customer Name Changed', Icon: UserCheck, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' };
  }
  if (normalized.includes('customer email') || normalized.includes('email')) {
    return { label: 'Email Changed', Icon: Mail, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' };
  }
  if (normalized.includes('category')) {
    return { label: 'Category Changed', Icon: Tag, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' };
  }
  if (normalized.includes('description')) {
    return { label: 'Description Updated', Icon: FileText, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' };
  }
  if (normalized.includes('due date') || normalized.includes('due_date')) {
    return { label: 'Due Date Changed', Icon: Calendar, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' };
  }
  if (normalized.includes('deleted')) {
    return { label: 'Ticket Deleted', Icon: Trash2, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' };
  }
  if (normalized.includes('resolved') || normalized.includes('closed')) {
    return { label: 'Ticket Resolved', Icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' };
  }

  // Generic fallback
  return { label: action || 'Activity', Icon: Activity, iconBg: 'bg-slate-100', iconColor: 'text-slate-500' };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ActivitySkeleton = () => (
  <div className="space-y-5 animate-pulse px-1">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-px flex-1 bg-slate-100 min-h-[28px]" />
        </div>
        <div className="flex-1 space-y-1.5 pt-1 pb-4">
          <div className="h-3.5 bg-slate-200 rounded w-32" />
          <div className="h-3 bg-slate-100 rounded w-48" />
          <div className="h-3 bg-slate-100 rounded w-24" />
        </div>
      </div>
    ))}
  </div>
);

const ActivityEmpty = () => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
      <Clock className="w-5 h-5 text-slate-400" />
    </div>
    <p className="text-sm font-medium text-slate-600">No activity yet</p>
    <p className="text-xs text-slate-400 mt-1">Actions on this ticket will appear here.</p>
  </div>
);

const ActivityError = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mb-3">
      <AlertTriangle className="w-5 h-5 text-rose-500" />
    </div>
    <p className="text-sm font-medium text-slate-700">Could not load activity</p>
    <p className="text-xs text-slate-400 mt-1 mb-3">Check your connection and try again.</p>
    <button
      onClick={onRetry}
      className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
    >
      Retry
    </button>
  </div>
);

// Single timeline item
const ActivityItem = ({ item, isLast }) => {
  const { label, Icon, iconBg, iconColor } = resolveAction(item.action);
  const userName = item.users?.username || 'User';
  const hasChange = item.old_value != null && item.new_value != null;

  return (
    <div className="flex gap-3">
      {/* Icon column + connector line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg} ring-2 ring-white z-10`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-100 my-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${!isLast ? 'pb-4' : 'pb-1'}`}>
        {/* Action label */}
        <p className="text-[13px] font-semibold text-slate-800 leading-snug">{label}</p>

        {/* Old → New value pill */}
        {hasChange && (
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 max-w-[120px] truncate" title={item.old_value}>
              {item.old_value}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 max-w-[120px] truncate" title={item.new_value}>
              {item.new_value}
            </span>
          </div>
        )}

        {/* Description (only when no old/new values) */}
        {!hasChange && item.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
        )}

        {/* User + timestamp */}
        <p className="text-[11px] text-slate-400 mt-1.5">
          <span className="font-medium text-slate-500">{userName}</span>
          {' · '}
          {timeAgo(item.created_at)}
        </p>
      </div>
    </div>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * ActivityTimeline
 * Props:
 *   ticketId  — string, the ticket UUID
 */
const ActivityTimeline = ({ ticketId }) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivity = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await ticketsAPI.getTicketActivity(ticketId);
      setActivity(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity</p>
        </div>
        {!loading && !error && activity.length > 0 && (
          <button
            onClick={fetchActivity}
            className="text-[11px] font-medium text-slate-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
            title="Refresh activity"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        )}
      </div>

      {/* Body */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        {loading ? (
          <ActivitySkeleton />
        ) : error ? (
          <ActivityError onRetry={fetchActivity} />
        ) : activity.length === 0 ? (
          <ActivityEmpty />
        ) : (
          <div>
            {activity.map((item, idx) => (
              <ActivityItem key={item.id || idx} item={item} isLast={idx === activity.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
