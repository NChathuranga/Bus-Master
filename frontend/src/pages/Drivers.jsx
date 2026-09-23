import { useEffect, useState } from 'react';
import { 
  Users, IdCard, Phone, CalendarClock, Activity, Clock,
  Plus, Save, Pencil, Trash2, AlertCircle, X, BadgeCheck, TriangleAlert
} from 'lucide-react';
import Layout from '../components/Layout';
import { useDepot } from '../context/DepotContext';
import api from '../api/axios';

const emptyForm = { name: '', licenseNumber: '', contact: '', licenseExpiry: '', workingHours: 40, status: 'active', depotId: '' };

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const { activeDepot, depots } = useDepot();

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/drivers');
      setDrivers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  // Helper to safely extract ID whether string or populated object
  const getEntityId = (entity) => {
    if (!entity) return '';
    return typeof entity === 'object' ? String(entity._id || '') : String(entity);
  };

  const getDepotName = (depotField) => {
    if (!depotField) return 'Central Depot';
    if (typeof depotField === 'object' && depotField.name) return depotField.name;
    const found = depots.find(dp => String(dp._id) === String(depotField));
    return found ? found.name : 'Central Depot';
  };

  const filteredDrivers = activeDepot === 'all'
    ? drivers
    : drivers.filter(d => getEntityId(d.depotId) === String(activeDepot));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const selectedDepotId = form.depotId || (activeDepot !== 'all' ? activeDepot : (depots[0]?._id || ''));
      const payload = {
        ...form,
        workingHours: Number(form.workingHours),
        depotId: selectedDepotId
      };
      if (editingId) {
        await api.put(`/drivers/${editingId}`, payload);
      } else {
        await api.post('/drivers', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save driver');
    }
  };


  const handleEdit = (d) => {
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      contact: d.contact,
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.substring(0, 10) : '',
      workingHours: d.workingHours || 40,
      status: d.status,
      depotId: getEntityId(d.depotId)
    });
    setEditingId(d._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete driver');
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const getLicenseStatus = (dateStr) => {
    if (!dateStr) return { label: 'No Data', color: 'text-slate-500', icon: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: 'Expired', color: 'text-red-600', icon: TriangleAlert };
    if (daysLeft < 30) return { label: `Expires in ${daysLeft}d`, color: 'text-orange-600', icon: TriangleAlert };
    return { label: 'Valid', color: 'text-emerald-600', icon: BadgeCheck };
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Driver Management Database</h2>
            <p className="text-slate-500 font-medium mt-1">Driver profiles, license validity, working hours & availability</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Total Drivers:</span>
          <span className="text-lg font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{drivers.length}</span>
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
          <Users className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-slate-700">
            {editingId ? 'Update Driver Profile' : 'Register New Driver'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <Users className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
              name="name" value={form.name} onChange={handleChange} required 
              placeholder="e.g. Kamal Perera" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">License Number</label>
            <IdCard className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
              name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required 
              placeholder="e.g. B1923456" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Number</label>
            <Phone className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
              name="contact" value={form.contact} onChange={handleChange} required 
              placeholder="e.g. 077 123 4567" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Depot</label>
            <select 
              name="depotId" 
              value={form.depotId || (activeDepot !== 'all' ? activeDepot : (depots[0]?._id || ''))} 
              onChange={handleChange} 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              {depots.map(dp => (
                <option key={dp._id} value={dp._id}>{dp.name}</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">License Expiry</label>
            <CalendarClock className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
              name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange} required 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Weekly Working Hours (hrs/week)</label>
            <Clock className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
              name="workingHours" type="number" min="1" max="168" value={form.workingHours} onChange={handleChange} required 
              placeholder="e.g. 40" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Working Status</label>
            <Activity className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <select name="status" value={form.status} onChange={handleChange} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
              }`}
            >
              {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Save Changes' : 'Add Driver'}
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
                <th className="px-6 py-4">Driver Info</th>
                <th className="px-6 py-4">Assigned Depot</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">License Details</th>
                <th className="px-6 py-4">Working Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredDrivers.map((d) => {
                const licStatus = getLicenseStatus(d.licenseExpiry);
                const LicIcon = licStatus.icon;

                return (
                  <tr key={d._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-200">
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-500 font-medium">ID: {String(d._id).substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-amber-200 uppercase tracking-wider inline-flex items-center gap-1">
                        🏢 {getDepotName(d.depotId)}
                      </span>
                    </td>


                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {d.contact}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 font-semibold">{d.licenseNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Exp: {new Date(d.licenseExpiry).toLocaleDateString()}
                          </span>
                          {LicIcon && (
                            <span className={`flex items-center gap-1 text-xs font-bold ${licStatus.color}`}>
                              <LicIcon className="w-3.5 h-3.5" />
                              {licStatus.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 w-fit border border-purple-100">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        {d.workingHours || 40} hrs/wk
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                        d.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {d.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(d)} 
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Driver"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(d._id)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-semibold text-slate-500">No drivers registered yet.</p>
                      <p className="text-sm">Use the form above to add a new driver.</p>
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

export default Drivers;