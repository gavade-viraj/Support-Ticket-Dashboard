import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, LifeBuoy, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Decorative backdrop glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl -translate-y-12" />
      </div>

      <div className="relative max-w-lg w-full text-center space-y-6">
        {/* Visual Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary-50 text-primary-600 border border-primary-100 shadow-soft mb-2">
          <LifeBuoy className="w-10 h-10 animate-spin-slow" />
        </div>

        {/* 404 Heading */}
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">
            Error 404
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Page not found
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Sorry, the page or ticket route you are looking for doesn't exist, was moved, or you don't have access.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="w-full sm:w-auto shadow-sm shadow-primary-500/20"
          >
            <Home className="w-4 h-4 mr-2" />
            {isAuthenticated ? 'Back to Dashboard' : 'Go to Login'}
          </Button>
        </div>

        {/* Support hint */}
        <div className="pt-8 border-t border-slate-200/60 flex items-center justify-center gap-2 text-xs text-slate-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Support Desk · Internal Ticketing System</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
