import { X, CheckCircle2, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useToast } from '../../context/toastContext';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <BellRing className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/95 text-emerald-900';
      case 'error':
        return 'border-rose-200 bg-rose-50/95 text-rose-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50/95 text-amber-900';
      case 'info':
        return 'border-blue-200 bg-blue-50/95 text-blue-900';
      default:
        return 'border-slate-200 bg-slate-50/95 text-slate-900';
    }
  };

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg shadow-slate-900/10 backdrop-blur-sm transition-all duration-300 ${getStyles(toast.type)}`}
        >
          <div className="mt-0.5 flex-shrink-0">{getIcon(toast.type)}</div>
          <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="ml-1 mt-0.5 rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;