import { useEffect, useState } from 'react';
import { 
  Map, MapPin, Flag, Milestone, Ruler, Plus, 
  Save, Pencil, Trash2, AlertCircle, X, Navigation, Eye
} from 'lucide-react';
import Layout from '../components/Layout';
import RouteMap from '../components/RouteMap';
import api from '../api/axios';

const emptyForm = { startPoint: '', endPoint: '', stops: '', distance: '' };

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [error, setError] = useState('');

  const fetchRoutes = async () => {
    try {
      const { data } = await api.get('/routes');
      setRoutes(data);
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        startPoint: form.startPoint,
        endPoint: form.endPoint,
        distance: Number(form.distance),
        stops: form.stops ? form.stops.split(',').map((s) => s.trim()) : []
      };
      if (editingId) {
        await api.put(`/routes/${editingId}`, payload);
      } else {
        await api.post('/routes', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchRoutes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save route');
    }
  };

  const handleEdit = (route) => {
    setForm({
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      stops: (route.stops || []).join(', '),
      distance: route.distance
    });
    setEditingId(route._id);
    setSelectedRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.delete(`/routes/${id}`);
      if (selectedRoute?._id === id) setSelectedRoute(null);
      fetchRoutes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete route');
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-inner">
            <Map className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Route Planning & Visual Mapping</h2>
            <p className="text-slate-500 font-medium mt-1">Create, modify, and visually map bus routes across depot networks</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Total Routes:</span>
          <span className="text-lg font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{routes.length}</span>
        </div>
      </div>

      {/* Visual Interactive Map Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Interactive Route Map Visualizer: <span className="text-blue-600">{selectedRoute ? `${selectedRoute.startPoint} ➔ ${selectedRoute.endPoint}` : 'Select a Route'}</span>
            </h3>
          </div>
          {selectedRoute && (
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              {selectedRoute.distance} km total distance
            </span>
          )}
        </div>
        <RouteMap route={selectedRoute || (routes.length > 0 ? routes[0] : null)} />
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
        <div className="flex items-center gap-2 mb-5">
          <Plus className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-slate-700">
            {editingId ? 'Update Existing Route' : 'Create New Route'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="relative group">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              name="startPoint" value={form.startPoint} onChange={handleChange} required 
              placeholder="Start point (e.g. Colombo)" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              name="endPoint" value={form.endPoint} onChange={handleChange} required 
              placeholder="End point (e.g. Kandy)" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <Milestone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              name="stops" value={form.stops} onChange={handleChange} 
              placeholder="Stops (comma separated)" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="relative group">
            <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              name="distance" type="number" step="0.1" value={form.distance} onChange={handleChange} required 
              placeholder="Distance (km)" 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-3 pt-2">
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
              className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${
                editingId ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Save Changes' : 'Add New Route'}
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
                <th className="px-6 py-4">Start Point</th>
                <th className="px-6 py-4">End Point</th>
                <th className="px-6 py-4">Stops</th>
                <th className="px-6 py-4">Distance</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {routes.map((r) => (
                <tr 
                  key={r._id} 
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    selectedRoute?._id === r._id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                  }`}
                  onClick={() => setSelectedRoute(r)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      {r.startPoint}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      {r.endPoint}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {r.stops && r.stops.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {r.stops.map((stop, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                            {stop}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic font-normal">Direct route</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                      {r.distance} km
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedRoute(r)} 
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Map"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(r)} 
                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Edit Route"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(r._id)} 
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Map className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-semibold text-slate-500">No routes found.</p>
                      <p className="text-sm">Use the form above to create your first route.</p>
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

export default RoutesPage;