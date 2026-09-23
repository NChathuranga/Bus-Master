import { useEffect, useState } from 'react';
import { 
  BusFront, Hash, Users, Activity, Plus, Save, Pencil, Gauge,
  Trash2, AlertCircle, X, CheckCircle2, Navigation, Wrench, Settings2
} from 'lucide-react';
import Layout from '../components/Layout';
import { useDepot } from '../context/DepotContext';
import api from '../api/axios';

const emptyForm = { registrationNumber: '', type: 'Bus', capacity: '', mileage: 0, status: 'available' };

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const { activeDepot, activeDepotObj } = useDepot();

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  // Helper to safely extract ID whether string or populated object
  const getEntityId = (entity) => {
    if (!entity) return '';
    return typeof entity === 'object' ? String(entity._id || '') : String(entity);
  };

  const filteredVehicles = activeDepot === 'all' 
    ? vehicles 
    : vehicles.filter(v => getEntityId(v.depotId) === String(activeDepot));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { 
        ...form, 
        capacity: Number(form.capacity),
        mileage: Number(form.mileage),
        depotId: activeDepot !== 'all' ? activeDepot : (form.depotId || 'depot_001')
      };
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
  };


  const handleEdit = (v) => {
    setForm({ 
      registrationNumber: v.registrationNumber, 
      type: v.type, 
      capacity: v.capacity, 
      mileage: v.mileage || 0,
      status: v.status 
    });
    setEditingId(v._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'available': 
        return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Available', dot: true };
      case 'on-route': 
        return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Navigation, label: 'On Route', dot: false };
      case 'maintenance': 
        return { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Wrench, label: 'Maintenance', dot: false };
      default: 
        return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: BusFront, label: status, dot: false };
    }
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 text-teal-600 rounded-2xl shadow-inner">
            <BusFront className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Fleet & Vehicle Management Database</h2>
            <p className="text-slate-500 font-medium mt-1">Bus registration, seating capacity, total mileage & maintenance status</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Total Vehicles:</span>
          <span className="text-lg font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">{vehicles.length}</span>
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

      {/* Form Section */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Settings2 className="w-5 h-5 text-teal-500" />
          <h3 className="text-lg font-bold text-slate-700">
            {editingId ? 'Update Vehicle Record' : 'Register New Vehicle'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registration No</label>
            <Hash className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
            <input 
              name="registrationNumber" value={form.registrationNumber} onChange={handleChange} required 
              placeholder="e.g. NC-4589"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all uppercase" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vehicle Type</label>
            <BusFront className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
            <input 
              name="type" value={form.type} onChange={handleChange} required 
              placeholder="e.g. Luxury Bus"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Capacity (Seats)</label>
            <Users className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
            <input 
              name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required 
              placeholder="e.g. 54"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Mileage (km)</label>
            <Gauge className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
            <input 
              name="mileage" type="number" min="0" value={form.mileage} onChange={handleChange} required 
              placeholder="e.g. 145000"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Status</label>
            <Activity className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
            <select name="status" value={form.status} onChange={handleChange} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all cursor-pointer">
              <option value="available">Available (Ready)</option>
              <option value="on-route">On Route (Running)</option>
              <option value="maintenance">Maintenance (Garage)</option>
            </select>
          </div>

          <div className="flex items-end justify-end gap-3 lg:col-span-5 pt-2">
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
                editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
              }`}
            >
              {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Save Changes' : 'Register Vehicle'}
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
                <th className="px-6 py-4">Reg. Number</th>
                <th className="px-6 py-4">Assigned Depot</th>
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Mileage (Odometer)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredVehicles.map((v) => {
                const statusInfo = getStatusConfig(v.status);
                const StatusIcon = statusInfo.icon;


                return (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border-2 border-amber-300 text-amber-900 font-black rounded-md uppercase tracking-widest shadow-sm">
                        <span className="text-amber-500 font-serif">SL</span>
                        {v.registrationNumber}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-amber-200 uppercase tracking-wider inline-flex items-center gap-1">
                        🏢 {v.depotId === 'depot_002' ? 'Kandy Depot' : 'Colombo Depot'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                          <BusFront className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-700">{v.type}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Users className="w-4 h-4 text-slate-400" />
                        {v.capacity} <span className="text-slate-400 text-xs uppercase ml-1">Seats</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg w-fit font-bold border border-teal-100">
                        <Gauge className="w-4 h-4 text-teal-500" />
                        {(v.mileage || 0).toLocaleString()} km
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                        {statusInfo.dot ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        ) : (
                          <StatusIcon className="w-3.5 h-3.5" />
                        )}
                        {statusInfo.label}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(v)} 
                          className="p-2 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                          title="Edit Vehicle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(v._id)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <BusFront className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-semibold text-slate-500">No vehicles registered yet.</p>
                      <p className="text-sm">Use the form above to add your first vehicle.</p>
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

export default Vehicles;