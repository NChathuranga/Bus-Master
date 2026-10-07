import { useEffect, useState } from 'react';
import { 
  BusFront, Route, CalendarClock, ShieldAlert, Plus, 
  Fuel, Wrench, CheckCircle2, Clock, X, AlertCircle, FileText, Download, Loader2,
  Building2, CheckCircle, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../components/Layout';
import api from '../api/axios';

const DriverPortal = () => {
  const [driverInfo, setDriverInfo] = useState(null);
  const [depots, setDepots] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('fuel'); // 'fuel' | 'maintenance'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'fuel' | 'maintenance'
  const [isExporting, setIsExporting] = useState(false);

  // Profile & Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ name: '', currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [form, setForm] = useState({
    vehicleId: '',
    liters: 60,
    serviceType: 'Brake Servicing & Engine Check',
    description: '',
    estimatedCost: 20000
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    try {
      if (pwdForm.name && pwdForm.name !== driverInfo?.name) {
        const pRes = await api.put('/auth/profile', { name: pwdForm.name });
        const updatedUser = { ...driverInfo, name: pRes.data.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setDriverInfo(updatedUser);
      }

      if (pwdForm.currentPassword && pwdForm.newPassword) {
        await api.put('/auth/change-password', {
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword
        });
        setPasswordSuccess('Account profile and password updated successfully!');
      } else {
        setPasswordSuccess('Account display name updated successfully!');
      }

      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdForm({ name: '', currentPassword: '', newPassword: '' });
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update account credentials');
    }
  };

  const fetchDriverPortalData = async () => {
    try {
      const [dRes, sRes, vRes, rRes] = await Promise.all([
        api.get('/depots'),
        api.get('/schedules'),
        api.get('/vehicles'),
        api.get('/requests')
      ]);
      setDepots(dRes.data);
      setSchedules(sRes.data);
      setVehicles(vRes.data);
      setMyRequests(rRes.data);

      const userStr = localStorage.getItem('user');
      if (userStr) {
        setDriverInfo(JSON.parse(userStr));
      }
    } catch (err) {
      console.error('Error loading driver portal data:', err);
    }
  };

  useEffect(() => {
    fetchDriverPortalData();
  }, []);

  // Determine Driver's assigned Depot
  const driverDepotId = driverInfo?.depotId 
    ? (typeof driverInfo.depotId === 'object' ? driverInfo.depotId._id : driverInfo.depotId) 
    : 'depot_001';

  const assignedDepotObj = depots.find(d => String(d._id) === String(driverDepotId));
  const assignedDepotName = assignedDepotObj?.name || (driverDepotId === 'depot_002' ? 'Kandy Central Bus Depot' : 'Colombo Central Bus Depot');

  // Strict Depot & Driver Duty Filtering
  const depotVehicles = vehicles.filter(v => {
    const vDepot = typeof v.depotId === 'object' ? v.depotId?._id : v.depotId;
    return String(vDepot) === String(driverDepotId);
  });

  // Filter schedules strictly for THIS logged-in driver
  const driverDutySchedules = schedules.filter(s => {
    if (!s.driverId) return false;
    const dObj = typeof s.driverId === 'object' ? s.driverId : null;
    const dId = dObj ? (dObj._id || dObj.userId) : String(s.driverId);
    const dName = dObj?.name || '';
    const myName = driverInfo?.name || driverInfo?.username || '';
    const myUserId = driverInfo?._id || '';

    // Match driver ID, userId, or driver name
    const isMe = (dId && (String(dId) === String(myUserId) || String(dObj?.userId) === String(myUserId))) ||
                 (dName && myName && dName.toLowerCase().replace(/\s*\((?:driver|admin)\)/i,'').trim() === myName.toLowerCase().replace(/\s*\((?:driver|admin)\)/i,'').trim());

    if (isMe) return true;

    // Fallback: match schedules assigned to driver's depot if driver name matches
    const dDepot = s.driverId?.depotId ? (typeof s.driverId.depotId === 'object' ? s.driverId.depotId._id : s.driverId.depotId) : null;
    const isMyDepot = dDepot && String(dDepot) === String(driverDepotId);
    return isMyDepot && dName.toLowerCase().includes('kamal');
  });

  // Filter requests strictly for THIS logged-in driver account
  const filteredMyRequests = myRequests.filter(r => {
    if (!driverInfo?._id) return true;
    return String(r.requestedBy) === String(driverInfo._id) || 
           r.requestedByName === driverInfo.username || 
           r.requestedByName === driverInfo.name;
  });

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openModal = (type) => {
    setRequestType(type);
    setForm({
      vehicleId: depotVehicles[0]?._id || vehicles[0]?._id || '',
      liters: type === 'fuel' ? 60 : 0,
      serviceType: type === 'maintenance' ? 'Brake & Oil Filter Service' : '',
      description: type === 'fuel' ? 'Fuel refill for assigned route trip' : 'Routine maintenance check request',
      estimatedCost: type === 'fuel' ? 25000 : 35000
    });
    setError('');
    setShowRequestModal(true);
  };

  const exportDriverPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const rawName = driverInfo?.name || driverInfo?.username || 'Kamal Perera';
      const driverName = rawName.replace(/\s*\((?:Driver|Admin)\)/gi, '').trim();

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Bus Master System - Personal Driver Duty Report', 14, 18);
      
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(`Driver Name: ${driverName} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 25);

      // Section 1: Personal Operational Summary
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Personal Driver Summary & Quotas', 14, 40);
      
      const fuelReqs = filteredMyRequests.filter(r => r.requestType === 'fuel');
      const maintReqs = filteredMyRequests.filter(r => r.requestType === 'maintenance');
      const totalFuelLiters = fuelReqs.reduce((sum, r) => sum + (r.details?.liters || 0), 0);
      const totalFuelCost = fuelReqs.reduce((sum, r) => sum + (r.details?.estimatedCost || 0), 0);
      const totalMaintCost = maintReqs.reduce((sum, r) => sum + (r.details?.estimatedCost || 0), 0);
      const grandTotalCost = totalFuelCost + totalMaintCost;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`• Driver Account Name: ${driverName}`, 14, 48);
      doc.text(`• Assigned Bus Depot: ${assignedDepotName}`, 14, 54);
      doc.text(`• Personal Fuel Requested: ${totalFuelLiters} Liters (Est. Cost: Rs. ${totalFuelCost.toLocaleString()})`, 14, 60);
      doc.text(`• Personal Maintenance Work Requested: Rs. ${totalMaintCost.toLocaleString()}`, 14, 66);
      doc.text(`• Total Personal Financial Quota Requested: Rs. ${grandTotalCost.toLocaleString()}`, 14, 72);

      // Section 2: Personal Duty Schedules
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('2. My Assigned Personal Duty Timetable', 14, 84);

      autoTable(doc, {
        startY: 88,
        head: [['Route Path', 'Vehicle Reg', 'Departure Time', 'Shift Status']],
        body: driverDutySchedules.map(s => [
          `${s.routeId?.startPoint || 'Depot'} -> ${s.routeId?.endPoint || 'Destination'}`,
          s.vehicleId?.registrationNumber || 'Bus',
          new Date(s.departureTime).toLocaleString(),
          (s.status || 'On Time').toUpperCase()
        ]),
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      const nextY = doc.lastAutoTable.finalY + 12;

      // Section 3: Personal Fuel & Maintenance Requests Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('3. My Personal Fuel & Maintenance Requests History', 14, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Category', 'Bus Reg Number', 'Details / Reason', 'Est. Cost (Rs.)', 'Approval Status']],
        body: filteredMyRequests.map((r) => [
          r.requestType.toUpperCase(),
          r.vehicleReg || 'Bus',
          r.requestType === 'fuel' 
            ? `${r.details?.liters || 0} Liters - ${r.details?.description || ''}`
            : `${r.details?.serviceType || ''} - ${r.details?.description || ''}`,
          'Rs. ' + (r.details?.estimatedCost || 0).toLocaleString(),
          r.status.toUpperCase()
        ]),
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`My_Driver_Report_${driverName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsExporting(false);
    }, 800);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.vehicleId) {
      setError('Please select a bus vehicle from your assigned depot.');
      return;
    }

    try {
      const selectedVehicle = vehicles.find(v => String(v._id) === String(form.vehicleId));
      
      const payload = {
        requestType,
        depotId: driverDepotId,
        vehicleId: form.vehicleId,
        vehicleReg: selectedVehicle?.registrationNumber || 'Bus',
        details: {
          liters: requestType === 'fuel' ? Number(form.liters) : 0,
          serviceType: requestType === 'maintenance' ? form.serviceType : '',
          description: form.description,
          estimatedCost: Number(form.estimatedCost)
        }
      };

      await api.post('/requests', payload);
      setSuccess(`Your ${requestType === 'fuel' ? 'Fuel Quota' : 'Maintenance'} request has been submitted to ${assignedDepotName} Depot Management!`);
      setShowRequestModal(false);
      fetchDriverPortalData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const filteredRequests = myRequests.filter(r => {
    if (activeTab === 'fuel') return r.requestType === 'fuel';
    if (activeTab === 'maintenance') return r.requestType === 'maintenance';
    return true;
  });

  const totalFuelLiters = myRequests.filter(r => r.requestType === 'fuel').reduce((sum, r) => sum + (r.details?.liters || 0), 0);
  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;
  const approvedRequestsCount = myRequests.filter(r => r.status === 'approved').length;

  const rawDriverName = driverInfo?.name || driverInfo?.username || 'Kamal Perera';
  const cleanDriverName = rawDriverName.replace(/\s*\((?:Driver|Admin|Super Admin|Staff)\)/gi, '').trim();

  return (
    <Layout>
      {/* Header Banner - Dark Purple Theme with Perfect Filled Rectangle 3-Button Grid */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#1E1035] text-white rounded-3xl p-7 mb-8 shadow-xl border border-purple-900/40 relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[11px] font-extrabold px-3 py-1 rounded-full tracking-wide flex items-center gap-1.5 shadow-sm">
                <BusFront className="w-3.5 h-3.5 text-purple-300" /> Driver Operations Console
              </span>
              <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-amber-300" /> Assigned Depot: <strong>{assignedDepotName}</strong>
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Welcome back, {cleanDriverName}!
            </h2>
            <p className="text-slate-300 text-sm font-medium mt-1 max-w-2xl leading-relaxed">
              Manage your daily driving shifts, submit fuel refill or vehicle maintenance requests, and download your duty performance reports for <strong>{assignedDepotName}</strong>.
            </p>
          </div>

          {/* Filled Rectangle 3-Button Grid: 2 equal buttons top row, 1 full-width button bottom row */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-[380px] shrink-0">
            {/* Row 1, Col 1: + Fuel Request */}
            <button
              onClick={() => openModal('fuel')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs px-3.5 py-3 rounded-2xl shadow-lg shadow-blue-950/50 border border-blue-400/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Fuel className="w-4 h-4 text-cyan-200 shrink-0" />
              <span>+ Fuel Request</span>
            </button>

            {/* Row 1, Col 2: + Maintenance Request */}
            <button
              onClick={() => openModal('maintenance')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs px-3.5 py-3 rounded-2xl shadow-lg shadow-indigo-950/50 border border-indigo-400/30 transition-all active:scale-95 whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 text-purple-200 shrink-0" />
              <span>+ Maintenance Request</span>
            </button>

              {/* Row 2, Col 1 & 2: Download Report (PDF) & Change Password */}
              <button
                onClick={exportDriverPDF}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3.5 py-3 rounded-2xl shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all active:scale-95 whitespace-nowrap disabled:opacity-70"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Download className="w-4 h-4 text-emerald-200 shrink-0" />}
                <span>{isExporting ? 'Report...' : 'Report (PDF)'}</span>
              </button>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs px-3.5 py-3 rounded-2xl shadow-lg shadow-amber-950/50 border border-amber-400/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0" />
                <span>Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Password & Profile Settings Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Account Security & Profile</h3>
                    <p className="text-xs text-slate-500">Change password or update display name</p>
                  </div>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    value={pwdForm.name}
                    onChange={(e) => setPwdForm({ ...pwdForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                  <input
                    type="password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    required
                    placeholder="Enter current login password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500 w-6 h-6" />
            <p className="text-emerald-800 font-bold">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-fade-in-up">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Assigned Duty Shifts</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{driverDutySchedules.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarClock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuel Liters Requested</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{totalFuelLiters} <span className="text-sm font-bold text-slate-400">L</span></h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Fuel className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Requests</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{approvedRequestsCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{pendingRequestsCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Duty Schedule + My Submitted Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
        {/* Left: My Duty Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">My Personal Duty Schedule</h3>
              <p className="text-xs text-slate-500 font-medium">Timetables & routes assigned to you at <strong>{assignedDepotName}</strong></p>
            </div>
          </div>

          <div className="space-y-4">
            {driverDutySchedules.map((s) => (
              <div key={s._id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 hover:border-purple-300 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-purple-600" />
                    <span className="font-extrabold text-slate-800">
                      {s.routeId?.startPoint || 'Colombo'} ➔ {s.routeId?.endPoint || 'Kandy'}
                    </span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 font-bold text-xs px-2.5 py-0.5 rounded-full capitalize">
                    {s.status || 'On Time'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 mt-2">
                  <div>
                    <span className="text-slate-400 block">Assigned Bus:</span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                      {s.vehicleId?.registrationNumber || 'NC-4589'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Departure Time:</span>
                    <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-0.5 inline-block font-mono text-[11px]">
                      📅 {new Date(s.departureTime).toLocaleDateString()} - ⏰ {new Date(s.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {driverDutySchedules.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No duty shifts assigned for your account.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: My Submitted Requests (with Category Filters) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">My Fuel & Maintenance Requests</h3>
                <p className="text-xs text-slate-500 font-medium">Submitted requests for {assignedDepotName}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('fuel')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'fuel' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Fuel className="w-3 h-3" /> Fuel
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'maintenance' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench className="w-3 h-3" /> Maintenance
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredRequests.map((r) => (
              <div key={r._id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 hover:border-slate-300 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase">
                    {r.requestType === 'fuel' ? <Fuel className="w-4 h-4 text-blue-500" /> : <Wrench className="w-4 h-4 text-purple-500" />}
                    {r.requestType} Request ({r.vehicleReg})
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black capitalize ${
                    r.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    r.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium mt-1">
                  {r.requestType === 'fuel' 
                    ? `Requested Fuel: ${r.details?.liters} Liters - ${r.details?.description}` 
                    : `Service: ${r.details?.serviceType} - ${r.details?.description}`}
                </p>

                <div className="flex justify-between items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200/50">
                  <span>Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className="font-black text-slate-800">Estimated: Rs. {(r.details?.estimatedCost || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No {activeTab} requests found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Submit New Fuel / Maintenance Request */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setShowRequestModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-black text-slate-800 mb-1">
              Submit {requestType === 'fuel' ? 'Fuel Quota' : 'Maintenance'} Request
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Send your request directly to <strong>{assignedDepotName}</strong> Management for authorization
            </p>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Category Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('fuel')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    requestType === 'fuel' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Fuel className="w-4 h-4 text-blue-500" /> Fuel Quota Request
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('maintenance')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    requestType === 'maintenance' 
                      ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-purple-500" /> Breakdown / Service
                </button>
              </div>

              {/* Vehicle Select - STRICTLY FILTERED BY DRIVER'S ASSIGNED DEPOT */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Select Bus Vehicle ({assignedDepotName} Fleet)
                </label>
                <select
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">-- Choose Bus from {assignedDepotName} --</option>
                  {depotVehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      🚌 {v.registrationNumber} ({v.type} - {v.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              {requestType === 'fuel' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fuel Quota Needed (Liters)</label>
                  <input
                    type="number"
                    name="liters"
                    value={form.liters}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. 60"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                  />
                </div>
              )}

              {requestType === 'maintenance' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Maintenance Service Type</label>
                  <input
                    type="text"
                    name="serviceType"
                    value={form.serviceType}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Brake Replacement, Engine Oil"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Reason</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  rows="3"
                  placeholder="Provide detailed description or reason for this request..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estimated Cost (Rs.)</label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={form.estimatedCost}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 25000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 active:scale-95"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DriverPortal;
