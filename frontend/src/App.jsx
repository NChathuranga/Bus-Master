import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DepotProvider } from './context/DepotContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoutesPage from './pages/Routes';
import Schedules from './pages/Schedules';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import FuelLogs from './pages/FuelLogs';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Depots from './pages/Depots';
import ApprovalCenter from './pages/ApprovalCenter';
import DriverPortal from './pages/DriverPortal';

function App() {
  return (
    <AuthProvider>
      <DepotProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/depots" element={<ProtectedRoute><Depots /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute><ApprovalCenter /></ProtectedRoute>} />
          <Route path="/driver-portal" element={<ProtectedRoute><DriverPortal /></ProtectedRoute>} />

          <Route path="/routes" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
          <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/fuel-logs" element={<ProtectedRoute><FuelLogs /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        </Routes>
      </DepotProvider>
    </AuthProvider>
  );
}

export default App;


