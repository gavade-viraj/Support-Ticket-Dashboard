import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  LayoutGrid,
  List,
  AlertCircle,
  Clock,
  CheckCircle2,
  Inbox,
  Flame,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  AlertTriangle,
  Lock,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { ticketsAPI } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/toastContext';
import Header from '../components/Layout/Header';
import StatCard from '../components/Layout/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton, { TableRowSkeleton } from '../components/common/LoadingSkeleton';
import ActivityTimeline from '../components/common/ActivityTimeline';

const CATEGORIES = ['All', 'Technical', 'Billing', 'Account', 'Other'];
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High'];

const LIMIT = 10;

const TicketList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dashboard stats (from /ticket/dashboard — independent of filters)
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, urgent: 0, overdue: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState('grid');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Debounce search input by 350 ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Re-fetch whenever filters/sort/page change
  useEffect(() => {
    fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, priorityFilter, categoryFilter, sortBy, currentPage]);

  // Fetch stats once on mount (and after mutations)
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchTickets = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    // Build query params — omit 'All' values so backend ignores them
    const params = {
      page: currentPage,
      limit: LIMIT,
      sortBy,
      ...(debouncedSearch.trim()   && { search:   debouncedSearch.trim() }),
      ...(statusFilter   !== 'All' && { status:   statusFilter }),
      ...(priorityFilter !== 'All' && { priority: priorityFilter }),
      ...(categoryFilter !== 'All' && { category: categoryFilter }),
    };

    try {
      const response = await ticketsAPI.getAllTickets(params);
      setTickets(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.totalPages ?? 1);
      setTotalCount(response.total ?? 0);
      if (isManualRefresh) {
        addToast('Tickets updated successfully', 'info');
        fetchStats();
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
      addToast(err.message || 'Failed to fetch tickets', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await ticketsAPI.getDashboard();
      if (response.success && response.data) {
        const d = response.data;
        setStats({
          total:      d.total       ?? 0,
          open:       d.open        ?? 0,
          inProgress: d.inProgress  ?? 0,
          resolved:   d.resolved    ?? 0,
          urgent:     d.highPriority ?? 0,
          overdue:    d.overdue     ?? 0,
        });
      }
    } catch {
      // Stats are non-critical — silently fail
    } finally {
      setStatsLoading(false);
    }
  };

  // Tickets from the server are already filtered/sorted — use directly
  const filteredTickets = tickets;

  const hasActiveFilters = searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All';

  // Reset all filters and return to page 1
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Helper: change a filter and reset pagination
  const changeFilter = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleQuickStatusChange = async (ticketId, newStatus) => {
    setUpdatingStatusId(ticketId);
    try {
      await ticketsAPI.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      }
      addToast(`Status updated to ${newStatus}`, 'success');
      fetchStats();
    } catch (err) {
      const message =
        err.status === 403
          ? 'You can only update the status of tickets you created.'
          : err.message || 'Failed to update status';
      addToast(message, 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      await ticketsAPI.deleteTicket(ticketToDelete.id);
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      addToast('Ticket deleted successfully', 'success');
      fetchStats();
      if (selectedTicket && selectedTicket.id === ticketToDelete.id) {
        setSelectedTicket(null);
      }
      setTicketToDelete(null);
    } catch (err) {
      const message =
        err.status === 403
          ? "You can only delete tickets you created."
          : err.message || 'Failed to delete ticket';
      addToast(message, 'error');
      setTicketToDelete(null); // close the dialog so user isn't stuck
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDueDateOverdue = (dateStr) => {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Export currently visible/filtered tickets as CSV
  const exportCSV = () => {
    if (!filteredTickets.length) {
      addToast('No tickets to export', 'warning');
      return;
    }
    const headers = ['ID', 'Customer Name', 'Customer Email', 'Category', 'Priority', 'Status', 'Description', 'Due Date', 'Created At'];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.customer_name || '',
      t.customer_email || '',
      t.issue_category || '',
      t.priority || '',
      t.status || '',
      `"${(t.description || '').replace(/"/g, '""')}"`, // escape quotes in description
      t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
      t.created_at ? new Date(t.created_at).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${filteredTickets.length} tickets as CSV`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Support Desk</p>
            <h1 className="text-2xl font-bold tracking-[-0.05em] text-slate-900 sm:text-3xl">
              Support Desk Overview
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Monitor, categorize, and respond to incoming customer support tickets in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              title="Export filtered tickets as CSV"
              className="bg-white text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets(true)}
              disabled={refreshing || loading}
              title="Refresh tickets"
              className="bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/tickets/create')}
              className="shadow-sm shadow-primary-500/20"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <StatCard
            title="Total Tickets"
            value={stats.total}
            icon={Inbox}
            color="slate"
            active={statusFilter === 'All'}
            onClick={() => setStatusFilter('All')}
          />
          <StatCard
            title="Open"
            value={stats.open}
            icon={AlertCircle}
            color="blue"
            active={statusFilter === 'Open'}
            onClick={() => setStatusFilter(statusFilter === 'Open' ? 'All' : 'Open')}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
            color="amber"
            active={statusFilter === 'In Progress'}
            onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            color="emerald"
            active={statusFilter === 'Resolved'}
            onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'All' : 'Resolved')}
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={AlertTriangle}
            color="rose"
            active={false}
            onClick={() => {}}
          />
          <StatCard
            title="High Priority"
            value={stats.urgent}
            icon={Flame}
            color="rose"
            active={priorityFilter === 'High'}
            onClick={() => setPriorityFilter(priorityFilter === 'High' ? 'All' : 'High')}
          />
        </div>

        {/* Search, Filter & View Controls */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, email, category, ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/15"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Selects & View Toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => changeFilter(setStatusFilter)(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-hidden"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>

              {/* Priority Select */}
              <select
                value={priorityFilter}
                onChange={(e) => changeFilter(setPriorityFilter)(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-hidden"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    Priority: {p}
                  </option>
                ))}
              </select>

              {/* Category Select */}
              <select
                value={categoryFilter}
                onChange={(e) => changeFilter(setCategoryFilter)(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => { changeFilter(setSortBy)(e.target.value); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-hidden"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="due_soon">Sort: Due Soonest</option>
                <option value="priority">Sort: Priority (High to Low)</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-primary-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-primary-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>Showing {tickets.length} of {totalCount} ticket{totalCount !== 1 ? 's' : ''}:</span>
              {statusFilter !== 'All' && (
                <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  Status: {statusFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => changeFilter(setStatusFilter)('All')} />
                </span>
              )}
              {priorityFilter !== 'All' && (
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  Priority: {priorityFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => changeFilter(setPriorityFilter)('All')} />
                </span>
              )}
              {categoryFilter !== 'All' && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  Category: {categoryFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => changeFilter(setCategoryFilter)('All')} />
                </span>
              )}
              {searchQuery && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ticket List Render Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded w-24"></div>
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-12 bg-slate-100 rounded"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-8 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">
            <EmptyState
              icon={Inbox}
              title={tickets.length === 0 ? 'No tickets opened yet' : 'No tickets match your filters'}
              description={
                tickets.length === 0
                  ? 'Your support queue is completely clear. Click the button below to log the first customer ticket.'
                  : 'Try adjusting your search criteria or removing active filters to see more results.'
              }
              actionText={tickets.length === 0 ? 'Create New Ticket' : undefined}
              onAction={tickets.length === 0 ? () => navigate('/tickets/create') : undefined}
              showClearFilters={hasActiveFilters}
              onClearFilters={resetFilters}
            />
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => {
              const overdue = isDueDateOverdue(ticket.due_date);
              const isOwner = Boolean(user?.id && ticket.created_by && user.id === ticket.created_by);
              return (
                <div
                  key={ticket.id}
                  className="group flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="space-y-4 p-5">
                    {/* Header: Badges & ID */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80" title="You created this ticket (Full edit access)">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Editable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70" title="Created by another user (Read-only)">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            Read Only
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        #{String(ticket.id).slice(0, 8)}
                      </span>
                    </div>

                    {/* Customer Info & Category */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                          {ticket.customer_name || 'Anonymous Customer'}
                        </h3>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                          {ticket.issue_category || 'General'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{ticket.customer_email}</span>
                      </p>
                    </div>

                    {/* Description Excerpt */}
                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      {ticket.description}
                    </p>

                    {/* Due Date & Created Date */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          overdue && ticket.status !== 'Closed' && ticket.status !== 'Resolved'
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                        title="Due Date"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(ticket.due_date)}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="bg-slate-50/90 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Quick Status Dropdown */}
                    <select
                      value={ticket.status || 'Open'}
                      disabled={!isOwner || updatingStatusId === ticket.id}
                      onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                      title={!isOwner ? "Only the ticket creator can change status" : "Update status"}
                      className={`text-xs font-semibold rounded-lg px-2 py-1.5 outline-hidden transition-colors ${
                        isOwner
                          ? 'bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer'
                          : 'bg-slate-100/70 border border-slate-200/60 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        title="View details"
                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isOwner ? (
                        <>
                          <button
                            onClick={() => navigate(`/tickets/update/${ticket.id}`)}
                            title="Edit ticket"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setTicketToDelete(ticket)}
                            title="Delete ticket"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span
                          title="Read-only: Only the creator can edit or delete this ticket"
                          className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg inline-flex items-center"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredTickets.map((ticket) => {
                    const overdue = isDueDateOverdue(ticket.due_date);
                    const isOwner = Boolean(user?.id && ticket.created_by && user.id === ticket.created_by);
                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-500 text-[11px]">
                              #{String(ticket.id).slice(0, 8)}
                            </span>
                            {isOwner ? (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60" title="Your ticket (Editable)">
                                You
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {ticket.customer_name}
                          </div>
                          <div className="text-slate-400 text-[11px]">{ticket.customer_email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {ticket.issue_category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span
                            className={
                              overdue && ticket.status !== 'Closed' && ticket.status !== 'Resolved'
                                ? 'text-rose-600'
                                : 'text-slate-600'
                            }
                          >
                            {formatDate(ticket.due_date)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={ticket.status || 'Open'}
                            disabled={!isOwner || updatingStatusId === ticket.id}
                            onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                            title={!isOwner ? "Only ticket creator can change status" : "Update status"}
                            className={`text-xs font-semibold rounded-lg px-2 py-1 outline-hidden ${
                              isOwner
                                ? 'bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer'
                                : 'bg-slate-100/70 border border-slate-200/60 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedTicket(ticket)}
                              title="View details"
                              className="p-1 text-slate-400 hover:text-primary-600 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isOwner ? (
                              <>
                                <button
                                  onClick={() => navigate(`/tickets/update/${ticket.id}`)}
                                  title="Edit ticket"
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setTicketToDelete(ticket)}
                                  title="Delete ticket"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span
                                title="Read-only"
                                className="p-1 text-slate-300 cursor-not-allowed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-soft">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">{totalCount}</span>{' '}
              ticket{totalCount !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              {/* Page number pills — only when multiple pages exist */}
              {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === item
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                          : 'text-slate-600 border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              {/* Single page indicator when only 1 page */}
              {totalPages === 1 && (
                <span className="w-8 h-8 rounded-lg text-xs font-semibold bg-primary-600 text-white shadow-sm shadow-primary-500/20 flex items-center justify-center">
                  1
                </span>
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket Details — #${String(selectedTicket.id).slice(0, 8)}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Status & Priority header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTicket.status} size="md" />
                <PriorityBadge priority={selectedTicket.priority} size="md" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                Category: {selectedTicket.issue_category}
              </span>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Customer Name</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedTicket.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Customer Email</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{selectedTicket.customer_email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Created Date</p>
                <p className="text-xs text-slate-700 mt-0.5">{formatDate(selectedTicket.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Due Date</p>
                <p className="text-xs text-slate-700 mt-0.5">{formatDate(selectedTicket.due_date)}</p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">Your Permission:</span>
                {Boolean(user?.id && selectedTicket.created_by && user.id === selectedTicket.created_by) ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    You are the Owner (Full Edit & Delete Access)
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Read-Only (Created by another agent)
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </p>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description}
              </div>
            </div>

            {/* Activity Timeline */}
            <ActivityTimeline ticketId={selectedTicket.id} />

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {Boolean(user?.id && selectedTicket.created_by && user.id === selectedTicket.created_by) ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setTicketToDelete(selectedTicket);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Ticket
                </Button>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Read-only ticket</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </Button>
                {Boolean(user?.id && selectedTicket.created_by && user.id === selectedTicket.created_by) && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/tickets/update/${selectedTicket.id}`)}
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    Edit Ticket
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Support Ticket"
        message={`Are you sure you want to permanently delete ticket #${String(ticketToDelete?.id).slice(0, 8)} for ${ticketToDelete?.customer_name}? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Ticket'}
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TicketList;