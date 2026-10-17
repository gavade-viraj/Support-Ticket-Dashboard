import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, AlertCircle, Calendar, Tag, Loader2, Lock, UserCheck } from 'lucide-react';
import { ticketsAPI } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import { validateTicketForm } from '../utils/validation';
import { useToast } from '../context/toastContext';
import Header from '../components/Layout/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const CATEGORIES = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Billing', label: 'Billing' },
  { value: 'Account', label: 'Account' },
  { value: 'Other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Medium', label: 'Medium', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'High', label: 'High', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const UpdateTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    issueCategory: 'Technical',
    priority: 'Medium',
    status: 'Open',
    description: '',
    dueDate: '',
  });

  const [ticketOwnerId, setTicketOwnerId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Minimum date today
  const minDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setInitialLoading(true);
    setServerError('');
    try {
      const response = await ticketsAPI.getSingleTicket(id);
      if (response.ticket) {
        const t = response.ticket;
        setTicketOwnerId(t.created_by || null);
        // Format due_date to YYYY-MM-DD
        let formattedDueDate = '';
        if (t.due_date) {
          const d = new Date(t.due_date);
          if (!isNaN(d.getTime())) {
            formattedDueDate = d.toISOString().split('T')[0];
          }
        }

        setFormData({
          customerName: t.customer_name || '',
          customerEmail: t.customer_email || '',
          issueCategory: t.issue_category || 'Technical',
          priority: t.priority || 'Medium',
          status: t.status || 'Open',
          description: t.description || '',
          dueDate: formattedDueDate,
        });
      } else {
        setServerError('Ticket not found');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to load ticket details');
      addToast('Failed to load ticket', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const isOwner = Boolean(user?.id && ticketOwnerId && user.id === ticketOwnerId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!isOwner) {
      addToast('You can only edit tickets you created', 'error');
      return;
    }

    const errors = validateTicketForm(formData, true);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast('Please fix the form errors before updating', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await ticketsAPI.updateTicket(id, formData);
      addToast(response.message || 'Ticket updated successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.status === 403
          ? 'You can only edit tickets you created.'
          : err.message || 'Failed to update ticket';
      setServerError(message);
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading ticket #{id}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <UserCheck className="h-3.5 w-3.5" />
                You are the Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Lock className="h-3.5 w-3.5" />
                Read-Only Ticket
              </span>
            )}
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-700">
              ID: {id}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-8">
            <h1 className="text-2xl font-bold tracking-[-0.05em] text-slate-900 sm:text-3xl">
              {isOwner ? 'Update Ticket' : 'Ticket Details (Read-Only)'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isOwner
                ? 'Edit customer details, update the ticket status, and adjust the priority or due date.'
                : 'This ticket was created by another team member. You are viewing it in read-only mode.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
            {!isOwner && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Read-Only Permission</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    You cannot modify this ticket because you are not the original creator. Only the owner can save changes or delete it.
                  </p>
                </div>
              </div>
            )}
            {serverError && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-900">Update Failed</p>
                  <p className="mt-0.5 text-xs text-rose-700">{serverError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Customer Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Customer Name"
                    error={fieldErrors.customerName}
                    icon={<User className="w-4 h-4" />}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Customer Email <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    error={fieldErrors.customerEmail}
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5 border-t border-slate-100 pt-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Ticket Classification & Status
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Issue Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="issueCategory"
                    value={formData.issueCategory}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.issueCategory && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.issueCategory}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Ticket Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.status && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.status}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map((p) => {
                      const isSelected = formData.priority === p.value;
                      return (
                        <button
                          type="button"
                          key={p.value}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, priority: p.value }));
                            setFieldErrors((prev) => ({ ...prev, priority: '' }));
                          }}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? `${p.badgeClass} ring-2 ring-offset-1 ring-primary-500/25 scale-[1.01]`
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.priority && (
                    <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.priority}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="dueDate"
                    type="date"
                    min={minDate}
                    value={formData.dueDate}
                    onChange={handleChange}
                    error={fieldErrors.dueDate}
                    icon={<Calendar className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Issue Description <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      formData.description.length < 20 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {formData.description.length} / 20 min chars
                  </span>
                </div>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description (min 20 characters)..."
                  className={`w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/15 ${
                    fieldErrors.description ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-primary-500'
                  }`}
                  required
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                disabled={submitting}
              >
                {isOwner ? 'Cancel' : 'Back to Dashboard'}
              </Button>
              {isOwner ? (
                <Button type="submit" loading={submitting}>
                  Save Changes
                </Button>
              ) : (
                <Button type="button" disabled variant="secondary" className="opacity-50 cursor-not-allowed">
                  <Lock className="w-4 h-4 mr-1.5" />
                  Read-Only Mode
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default UpdateTicket;