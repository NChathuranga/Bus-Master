import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CalendarDays, CalendarClock, Map, BusFront, User, 
  Clock, ArrowRight, Plus, Save, Pencil, Trash2, AlertCircle, X, Filter, AlertTriangle, Download
} from 'lucide-react';
import Layout from '../components/Layout';
import { useDepot } from '../context/DepotContext';
import api from '../api/axios';

const emptyForm = { routeId: '', vehicleId: '', driverId: '', departureTime: '', arrivalTime: '', status: 'on time', notes: '' };

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'daily', 'weekly', 'monthly'
  const [error, setError] = useState('');
  const { activeDepot } = useDepot();

  const fetchAll = async () => {
    try {
      const [s, r, v, d] = await Promise.all([
        api.get('/schedules'),
        api.get('/routes'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setSchedules(s.data);
      setRoutes(r.data);
      setVehicles(v.data);
      setDrivers(d.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Bus Master System - Bus Dispatch Timetable', 14, 16);

    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 33);
    doc.text(`Total Schedules: ${filteredSchedules.length}`, 14, 39);

    autoTable(doc, {
      startY: 45,
      head: [['Route (Start -> End)', 'Bus Reg', 'Driver Name', 'Departure Time', 'Arrival Time', 'Status']],
      body: filteredSchedules.map((s) => {
        const routeObj = typeof s.routeId === 'object' ? s.routeId : routes.find(r => String(r._id) === String(s.routeId));
        const vehicleObj = typeof s.vehicleId === 'object' ? s.vehicleId : vehicles.find(v => String(v._id) === String(s.vehicleId));
        const driverObj = typeof s.driverId === 'object' ? s.driverId : drivers.find(d => String(d._id) === String(s.driverId));

        const routeText = routeObj ? `${routeObj.startPoint} -> ${routeObj.endPoint}` : 'Intercity Line';
        const busText = vehicleObj ? vehicleObj.registrationNumber : 'Bus Unit';
        const driverText = driverObj ? driverObj.name : 'Assigned Driver';
        const depTime = s.departureTime ? new Date(s.departureTime).toLocaleString() : 'TBD';
        const arrTime = s.arrivalTime ? new Date(s.arrivalTime).toLocaleString() : 'TBD';

        return [routeText, busText, driverText, depTime, arrTime, (s.status || 'scheduled').toUpperCase()];
      }),
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 237] }
    });

    doc.save(`Bus_Timetable_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/schedules/${editingId}`, form);
      } else {
        await api.post('/schedules', form);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule. Check for time conflicts.');
    }
  };

  const handleEdit = (s) => {
    setForm({
      routeId: s.routeId?._id || s.routeId,
      vehicleId: s.vehicleId?._id || s.vehicleId,
      driverId: s.driverId?._id || s.driverId,
      departureTime: s.departureTime ? s.departureTime.substring(0, 16) : '',
      arrivalTime: s.arrivalTime ? s.arrivalTime.substring(0, 16) : '',
      status: s.status || 'on time',
      notes: s.notes || ''
    });
    setEditingId(s._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusQuickChange = async (id, newStatus) => {
    try {
      await api.put(`/schedules/${id}`, { status: newStatus });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trip status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Filter schedules based on activeDepot and Daily/Weekly/Monthly view
  const filteredSchedules = schedules.filter((s) => {
    if (activeDepot !== 'all') {
      const v = vehicles.find(veh => String(veh._id) === String(s.vehicleId?._id || s.vehicleId));
      if (v && String(v.depotId) !== String(activeDepot)) return false;
    }

    if (timeFilter === 'all') return true;
    const depDate = new Date(s.departureTime);
    const now = new Date();

    if (timeFilter === 'daily') {
      return depDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'weekly') {
      const oneWeekAway = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return depDate >= now && depDate <= oneWeekAway;
    } else if (timeFilter === 'monthly') {
      return depDate.getMonth() === now.getMonth() && depDate.getFullYear() === now.getFullYear();
    }
    return true;
  });


  const getStatusBadge = (status) => {
    switch (status) {
      case 'on time':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-200">On Time</span>;
      case 'delayed':
        return <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Delayed</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded-full border border-blue-200">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-full border border-rose-200">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-1 rounded-full border border-slate-200">Scheduled</span>;
    }
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
            <CalendarDays className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schedule & Timetable Management</h2>
            <p className="text-slate-500 font-medium mt-1">Conflict-free route scheduling & real-time trip status tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:from-orange-600 hover:to-amber-700 transition-all active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Total Timetables:</span>
            <span className="text-lg font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{schedules.length}</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 w-6 h-6" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Timetable View Mode Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Timetable View:</span>
        </div>
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl gap-1">
          {[
            { key: 'all', label: 'All Schedules' },
            { key: 'daily', label: 'Today (Daily)' },
            { key: 'weekly', label: 'This Week' },
            { key: 'monthly', label: 'This Month' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeFilter(tab.key)}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                timeFilter === tab.key
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <CalendarClock className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-slate-700">
            {editingId ? 'Update Existing Timetable Schedule' : 'Create New Timetable Schedule'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Route</label>
            <Map className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
            <select name="routeId" value={form.routeId} onChange={handleChange} required className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer">
              <option value="">-- Choose a Route --</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>{r.startPoint} ➔ {r.endPoint} ({r.distance} km)</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Vehicle</label>
            <BusFront className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
            <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer">
              <option value="">-- Choose a Bus --</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber} ({v.type} - {v.capacity} seats)</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Driver</label>
            <User className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
            <select name="driverId" value={form.driverId} onChange={handleChange} required className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer">
              <option value="">-- Choose a Driver --</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.contact})</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Departure Time</label>
            <input 
              name="departureTime" type="datetime-local" value={form.departureTime} onChange={handleChange} required 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Arrival Time</label>
            <input 
              name="arrivalTime" type="datetime-local" value={form.arrivalTime} onChange={handleChange} required 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Trip Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer">
              <option value="on time">On Time</option>
              <option value="scheduled">Scheduled</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex items-end justify-end gap-3 pt-2">
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${
                editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
              }`}
            >
              {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Save Changes' : 'Add Timetable Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Vehicle & Driver</th>
                <th className="px-6 py-4">Timetable Window</th>
                <th className="px-6 py-4">Real-Time Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredSchedules.map((s) => {
                const dep = formatDateTime(s.departureTime);
                const arr = formatDateTime(s.arrivalTime);
                
                return (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{s.routeId?.startPoint || 'Depot'}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-800">{s.routeId?.endPoint || 'Destination'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 w-fit px-2 py-1 rounded-md">
                          <BusFront className="w-3.5 h-3.5 text-blue-500" /> {s.vehicleId?.registrationNumber || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <User className="w-3.5 h-3.5 text-orange-500" /> {s.driverId?.name || 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-semibold uppercase">Dep</span>
                          <span className="text-sm font-black text-emerald-600">{dep.time}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{dep.date}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-semibold uppercase">Arr</span>
                          <span className="text-sm font-black text-rose-600">{arr.time}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{arr.date}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div>{getStatusBadge(s.status)}</div>
                        <select
                          value={s.status || 'on time'}
                          onChange={(e) => handleStatusQuickChange(s._id, e.target.value)}
                          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="on time">Mark On Time</option>
                          <option value="delayed">Mark Delayed</option>
                          <option value="completed">Mark Completed</option>
                          <option value="cancelled">Mark Cancelled</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(s)} 
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Schedule"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s._id)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <CalendarDays className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-semibold text-slate-500">No timetables match the selected filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Schedules;