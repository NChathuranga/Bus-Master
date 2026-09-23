import { useEffect, useState } from 'react';
import { 
  Building2, MapPin, Phone, BusFront, Plus, Save, Pencil, 
  Trash2, AlertCircle, X, ShieldAlert, BadgeCheck, RotateCcw, Clock, AlertTriangle, User, CheckCircle2
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const emptyForm = { 
  name: '', code: '', city: '', location: '', contactNumber: '', capacity: 50,
  adminName: '', adminUsername: '', adminPassword: ''
};

const Depots = () => {
  const [depots, setDepots] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userRole, setUserRole] = useState('super_admin');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'inactive'

  const fetchDepots = async () => {
    try {
      const { data } = await api.get('/depots');
      setDepots(data);
    } catch (err) {
      console.error('Error fetching depots:', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserRole(u.role || 'super_admin');
    }
    fetchDepots();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editingId) {
        await api.put(`/depots/${editingId}`, payload);
        setSuccessMessage('Depot profile updated successfully!');
      } else {
        const { data } = await api.post('/depots', payload);
        if (data.adminUser) {
          setSuccessMessage(`Depot "${data.name}" added & Depot Admin ("${data.adminUser.username}") created successfully!`);
        } else {
          setSuccessMessage(`Depot "${data.name}" created successfully!`);
        }
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchDepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save depot');
    }
  };

  const handleEdit = (d) => {
    setForm({
      name: d.name,
      code: d.code,
      city: d.city,
      location: d.location,
      contactNumber: d.contactNumber,
      capacity: d.capacity,
      adminName: '',
      adminUsername: '',
      adminPassword: ''
    });
    setEditingId(d._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this depot?\n\nIt will be marked as INACTIVE and scheduled for permanent deletion in 10 days.\n(මෙම depot එක Inactive තත්වයට පත්වී දින 10කට පසු ස්වයංක්‍රීයව delete වේ.)')) return;
    try {
      await api.delete(`/depots/${id}`);
      fetchDepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete depot');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/depots/${id}/restore`);
      fetchDepots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore depot');
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const getRemainingDays = (inactivatedAt) => {
    if (!inactivatedAt) return 10;
    const elapsedMs = new Date() - new Date(inactivatedAt);
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 10 - elapsedDays);
  };

  const filteredDepots = depots.filter(d => {
    if (filterTab === 'active') return d.status !== 'inactive';
    if (filterTab === 'inactive') return d.status === 'inactive';
    return true;
  });

  const activeCount = depots.filter(d => d.status !== 'inactive').length;
  const inactiveCount = depots.filter(d => d.status === 'inactive').length;

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Depot Management</h2>
              <span className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Super Admin Only
              </span>
            </div>
            <p className="text-slate-500 font-medium mt-1">Manage public transport depots across Sri Lankan cities</p>
          </div>
        </div>

        {/* Stats & Filter Tabs */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          <button 
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterTab === 'all' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({depots.length})
          </button>
          <button 
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterTab === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button 
            onClick={() => setFilterTab('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
              filterTab === 'inactive' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pending Delete ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 w-6 h-6" />
            <p className="text-emerald-800 font-bold text-sm">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

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
          <Building2 className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-700">
            {editingId ? 'Update Depot Profile' : 'Register New Sri Lankan Bus Depot'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Depot Name</label>
            <input 
              name="name" value={form.name} onChange={handleChange} required 
              placeholder="e.g. Colombo Central Bus Depot" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Depot Code</label>
            <input 
              name="code" value={form.code} onChange={handleChange} required 
              placeholder="e.g. DEP-CMB" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City / Location Zone</label>
            <input 
              name="city" value={form.city} onChange={handleChange} required 
              placeholder="e.g. Colombo" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Physical Address</label>
            <input 
              name="location" value={form.location} onChange={handleChange} required 
              placeholder="e.g. Bastian Mawatha, Pettah" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Number</label>
            <input 
              name="contactNumber" value={form.contactNumber} onChange={handleChange} required 
              placeholder="e.g. 011-2328901" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bus Fleet Capacity</label>
            <input 
              name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required 
              placeholder="e.g. 120" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
          </div>

          {/* Optional Depot Admin Auto-Creation Section */}
          {!editingId && (
            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-4 mt-1">
              <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-amber-600" />
                <span>Assign Initial Depot Admin Credentials (Auto Create User Account)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Full Name</label>
                  <input 
                    name="adminName" value={form.adminName} onChange={handleChange}
                    placeholder="e.g. Matara Depot Manager"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Username</label>
                  <input 
                    name="adminUsername" value={form.adminUsername} onChange={handleChange}
                    placeholder="e.g. matara_admin"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Login Password</label>
                  <input 
                    type="password" name="adminPassword" value={form.adminPassword} onChange={handleChange}
                    placeholder="e.g. matara123"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

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
                editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
              }`}
            >
              {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Save Depot Changes' : 'Add New Depot & Create Admin'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid of Depots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
        {filteredDepots.map((d) => {
          const isInactive = d.status === 'inactive';
          const remainingDays = getRemainingDays(d.inactivatedAt);

          return (
            <div 
              key={d._id} 
              className={`bg-white rounded-2xl p-6 border transition-all group relative shadow-lg shadow-slate-200/50 ${
                isInactive 
                  ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400' 
                  : 'border-slate-100 hover:border-amber-300'
              }`}
            >
              {/* Inactive Countdown Banner */}
              {isInactive && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Inactive (Deletes in <strong className="text-amber-700 text-sm font-black">{remainingDays} days</strong>)</span>
                  </div>
                  <button 
                    onClick={() => handleRestore(d._id)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-2.5 py-1 rounded-lg transition-all shadow-sm active:scale-95"
                    title="Restore Depot to Active"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl font-black text-sm ${
                    isInactive ? 'bg-amber-200/60 text-amber-800' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {d.code}
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-lg transition-colors ${
                      isInactive ? 'text-slate-500 line-through' : 'text-slate-800 group-hover:text-amber-600'
                    }`}>{d.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {d.city}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  {!isInactive && (
                    <button 
                      onClick={() => handleEdit(d)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Depot"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {!isInactive ? (
                    <button 
                      onClick={() => handleDelete(d._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Inactivate Depot (10 Days Grace Period)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRestore(d._id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Restore Depot"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm font-medium text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs uppercase font-bold">Address:</span>
                  <span className="font-semibold text-slate-700">{d.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs uppercase font-bold">Hotline:</span>
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {d.contactNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 text-xs uppercase font-bold">Fleet Capacity:</span>
                  <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md font-extrabold text-xs flex items-center gap-1 border border-amber-100">
                    <BusFront className="w-3.5 h-3.5" /> {d.capacity} Buses
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDepots.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h4 className="text-lg font-bold text-slate-600">No Bus Depots Found</h4>
            <p className="text-sm text-slate-400 mt-1">There are no depots matching your current filter.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Depots;
