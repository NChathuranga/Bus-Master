import { useEffect, useState } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Fuel, Wrench, BusFront, 
  User, Building2, AlertCircle, RefreshCw, FileText, Sparkles
} from 'lucide-react';
import Layout from '../components/Layout';
import { useDepot } from '../context/DepotContext';
import api from '../api/axios';

const ApprovalCenter = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'fuel' | 'maintenance'
  const [actionNotes, setActionNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const { activeDepot } = useDepot();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.put(`/requests/${id}/action`, {
        action,
        actionNotes: actionNotes[id] || ''
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to safely extract ID whether string or populated object
  const getEntityId = (entity) => {
    if (!entity) return '';
    return typeof entity === 'object' ? String(entity._id || '') : String(entity);
  };

  const filteredRequests = requests.filter(r => {
    const depotMatch = activeDepot === 'all' ? true : getEntityId(r.depotId) === String(activeDepot);
    const tabMatch = activeTab === 'all' ? true : r.status === activeTab;
    const typeMatch = filterType === 'all' ? true : r.requestType === filterType;
    return depotMatch && tabMatch && typeMatch;
  });

  const pendingCount = filteredRequests.filter(r => r.status === 'pending').length;


  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Approval & Request Center</h2>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-1 rounded-full animate-bounce shadow-md">
                  {pendingCount} PENDING
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium mt-1">Super Admin & Depot Admin verification panel for Fuel and Maintenance requests</p>
          </div>
        </div>

        <button 
          onClick={fetchRequests} 
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh Requests
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm animate-fade-in-up">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Approval', count: requests.filter(r => r.status === 'pending').length, color: 'text-amber-600 bg-amber-50' },
            { id: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: 'text-red-600 bg-red-50' },
            { id: 'all', label: 'All History', count: requests.length, color: 'text-slate-600 bg-slate-100' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : tab.color}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Request Type Selector */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Type:</span>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="all">All Request Types</option>
            <option value="fuel">Fuel Requests Only</option>
            <option value="maintenance">Maintenance Requests Only</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4 animate-fade-in-up">
        {filteredRequests.map((r) => {
          const isFuel = r.requestType === 'fuel';

          return (
            <div 
              key={r._id} 
              className={`bg-white rounded-2xl p-6 border transition-all shadow-md hover:shadow-lg ${
                r.status === 'pending' ? 'border-amber-200 bg-gradient-to-r from-amber-50/20 to-white' :
                r.status === 'approved' ? 'border-emerald-100' : 'border-red-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Left Info */}
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl shadow-inner ${isFuel ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {isFuel ? <Fuel className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        isFuel ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {isFuel ? 'Fuel Quota Request' : 'Vehicle Maintenance Work'}
                      </span>

                      <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold capitalize border ${
                        r.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <BusFront className="w-5 h-5 text-slate-400" />
                      Vehicle: <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-lg">{r.vehicleReg}</span>
                    </h3>

                    <p className="text-sm font-semibold text-slate-600 mt-1">{r.details.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-3">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Requested by: <strong className="text-slate-700">{r.requestedByName}</strong> ({r.requestedByRole})
                      </span>

                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action & Cost Box */}
                <div className="w-full lg:w-auto flex flex-col items-end gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estimated Cost</span>
                    <span className="text-2xl font-black text-slate-800">
                      Rs. {(r.details.estimatedCost || 0).toLocaleString()}
                    </span>
                    {isFuel && (
                      <span className="text-xs font-bold text-blue-600 block">
                        ({r.details.liters} Liters Diesel)
                      </span>
                    )}
                  </div>

                  {/* Actions for Pending Requests */}
                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => handleAction(r._id, 'approve')}
                        disabled={processingId === r._id}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Request
                      </button>

                      <button
                        onClick={() => handleAction(r._id, 'reject')}
                        disabled={processingId === r._id}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-right">
                      Processed by: <strong className="text-slate-700">{r.approvedByName || 'Admin'}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h4 className="text-lg font-bold text-slate-600">No Requests Found</h4>
            <p className="text-sm text-slate-400 mt-1">There are no requests matching your active filter criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApprovalCenter;
