import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, AlertCircle, Calendar, FileText, CheckCircle, Tag } from 'lucide-react';
import { ticketsAPI } from '../api/tickets';
import { validateTicketForm } from '../utils/validation';
import { useToast } from '../context/toastContext';
import Header from '../components/Layout/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const CATEGORIES = [
  { value: 'Technical', label: 'Technical', desc: 'Bugs, crashes, server issues' },
  { value: 'Billing', label: 'Billing', desc: 'Invoices, payments, refunds' },
  { value: 'Account', label: 'Account', desc: 'Login, permissions, profile' },
  { value: 'Other', label: 'Other', desc: 'General queries & feedback' },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400' },
  { value: 'Medium', label: 'Medium', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400' },
  { value: 'High', label: 'High', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400' },
];

const CreateTicket = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    issueCategory: 'Technical',
    priority: 'Medium',
    description: '',
    dueDate: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Get minimum date (today) in YYYY-MM-DD format for datepicker
  const minDate = new Date().toISOString().split('T')[0];

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

    const errors = validateTicketForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      addToast('Please fix the form errors before submitting', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await ticketsAPI.createTicket(formData);
      addToast(response.message || 'Ticket created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Failed to create ticket');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      addToast(err.message || 'Failed to create ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-8">
            <h1 className="text-2xl font-bold tracking-[-0.05em] text-slate-900 sm:text-3xl">Create New Ticket</h1>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the customer information and ticket details to open a new support request.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
            {serverError && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-900">Creation Failed</p>
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
                    placeholder="e.g. Jane Doe"
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
                    placeholder="e.g. jane@example.com"
                    error={fieldErrors.customerEmail}
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5 border-t border-slate-100 pt-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Ticket Classification
              </h2>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Issue Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                  {CATEGORIES.map((cat) => {
                    const isSelected = formData.issueCategory === cat.value;
                    return (
                      <button
                        type="button"
                        key={cat.value}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, issueCategory: cat.value }));
                          setFieldErrors((prev) => ({ ...prev, issueCategory: '' }));
                        }}
                        className={`rounded-2xl border p-3 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50/80 ring-2 ring-primary-500/15'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-xs font-bold ${isSelected ? 'text-primary-800' : 'text-slate-800'}`}>
                          {cat.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{cat.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.issueCategory && (
                  <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.issueCategory}</p>
                )}
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
                  placeholder="Provide detailed description of the customer's problem or inquiry (minimum 20 characters)..."
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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Ticket
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateTicket;