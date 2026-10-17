import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/toastContext';
import Toast from './components/common/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import TicketList from './pages/TicketList';
import CreateTicket from './pages/CreateTicket';
import UpdateTicket from './pages/UpdateTicket';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
                <Route path="/tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
                <Route path="/tickets/create" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
                <Route path="/tickets/update/:id" element={<ProtectedRoute><UpdateTicket /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
          <Toast />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;