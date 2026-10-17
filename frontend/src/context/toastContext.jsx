import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((input, type = 'info', options = {}) => {
    const toast =
      typeof input === 'object' && input !== null
        ? input
        : {
            message: String(input || 'Notification'),
            type,
            duration: options.duration ?? 4000,
          };

    const normalizedToast = {
      id: Date.now() + Math.random(),
      type: toast.type || 'info',
      message: toast.message || 'Notification',
      duration: typeof toast.duration === 'number' ? toast.duration : 4000,
      ...toast,
    };

    setToasts((prev) => [...prev, normalizedToast]);

    if (normalizedToast.duration > 0) {
      setTimeout(() => removeToast(normalizedToast.id), normalizedToast.duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};