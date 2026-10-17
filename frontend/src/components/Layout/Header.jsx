import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Plus, Ticket, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white shadow-sm shadow-primary-500/20 transition-transform group-hover:scale-[1.03]">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-[-0.04em] text-slate-900">TicketFlow</span>
                <span className="hidden rounded-md border border-primary-100 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-600 sm:inline-block">
                  Desk
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard' || location.pathname === '/tickets'
                    ? 'bg-slate-100 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            
            {/* <Button  size="sm" onClick={() => navigate('/tickets/create')} className="shadow-sm shadow-primary-500/10 px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Ticket</span>
            </Button> */}

            {user && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 text-xs font-semibold text-white shadow-sm">
                    {getInitials(user.username)}
                  </div>
                  <div className="hidden text-left lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.username}</p>
                    <p className="text-[10px] text-slate-500">Support Agent</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  title="Logout"
                  className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;