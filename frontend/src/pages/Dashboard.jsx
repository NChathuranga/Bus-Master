import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Map, BusFront, CheckCircle2, Users, CalendarClock, Building2,
  TrendingUp, Fuel, Clock, AlertCircle, ArrowRight, Gauge, AlertTriangle, Leaf, Wrench, ShieldCheck
} from 'lucide-react';
import Layout from '../components/Layout';
import { useDepot } from '../context/DepotContext';
import api from '../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const { activeDepot, setActiveDepot, depots } = useDepot();
  const [userRole, setUserRole] = useState('super_admin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const fetchStats = async (depotIdFilter = 'all') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/dashboard/stats?depotId=${depotIdFilter}`);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let role = 'super_admin';
    let userDepot = activeDepot;

    if (userStr) {
      const u = JSON.parse(userStr);
      role = u.role || 'super_admin';
      setUserRole(role);
      if (role === 'depot_admin' && u.depotId) {
        userDepot = typeof u.depotId === 'object' ? u.depotId._id : u.depotId;
        setActiveDepot(userDepot);
      }
    }

    fetchStats(userDepot);
  }, [activeDepot]);

  const handleDepotChange = (e) => {
    const dId = e.target.value;
    setActiveDepot(dId);
    fetchStats(dId);
  };


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-100">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on time':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200">On Time</span>;
      case 'delayed':
        return <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Delayed</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-200">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-200">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-slate-200">Scheduled</span>;
    }
  };

  const utilizationRate = stats?.totalVehicles > 0 
    ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) 
    : 0;

  return (
    <Layout>
      {/* Top Header & Depot Selector Console */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 animate-fade-in bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Depot Management Dashboard
            </h2>
            <span className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              {userRole.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-1">{today}</p>
        </div>

        {/* Super Admin Depot Selector */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl w-full lg:w-auto shadow-sm">
            <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider whitespace-nowrap">Filter Depot:</span>
            <select
              value={activeDepot}
              onChange={handleDepotChange}
              disabled={userRole === 'depot_admin'}
              className="bg-white border border-amber-300 text-slate-800 font-extrabold text-sm rounded-xl px-3 py-1.5 outline-none cursor-pointer w-full focus:ring-2 focus:ring-amber-500/20"
            >

              <option value="all">🌐 All Depots (National Overview)</option>
              {depots.map(d => (
                <option key={d._id} value={d._id}>
                  🏢 {d.name} ({d.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-bounce">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {stats && (
        <div className="space-y-8 animate-fade-in-up">
          
          {/* Stat Cards Grid (6 Metric Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { title: 'Total Depots', value: stats.totalDepots || 3, icon: Building2, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200' },
              { title: 'Total Routes', value: stats.totalRoutes, icon: Map, color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-200' },
              { title: 'Fleet Buses', value: stats.totalVehicles, icon: BusFront, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-200' },
              { title: 'Utilization Rate', value: `${utilizationRate}%`, icon: Gauge, color: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-200' },
              { title: 'Active Drivers', value: stats.totalDrivers, icon: Users, color: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-200' },
              { title: 'CO₂ Footprint', value: `${(stats.estimatedCarbonKg || 576).toLocaleString()} kg`, icon: Leaf, color: 'from-rose-400 to-pink-500', shadow: 'shadow-pink-200' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        {stat.value || 0}
                      </h3>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} shadow-md ${stat.shadow} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts & Schedules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Fuel & Efficiency Chart */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 transition-all hover:shadow-2xl hover:shadow-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Monthly Fuel Consumption</h3>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Fuel Analytics</span>
              </div>
              
              {stats.fuelByMonth.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                  <Fuel className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No fuel log entries recorded yet for this depot.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.fuelByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="totalLiters" fill="url(#colorLiters)" name="Liters (L)" radius={[6, 6, 0, 0]} barSize={30} />
                    <Bar dataKey="totalCost" fill="url(#colorCost)" name="Cost (LKR)" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Real-time Ongoing & Upcoming Schedules with Depot Badges */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Ongoing & Scheduled Depot Trips</h3>
                    <p className="text-xs text-slate-500 font-medium">Live driver shifts & vehicle dispatches</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">
                  Real-time Depot Status
                </span>
              </div>

              {stats.upcomingSchedules.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <CalendarClock className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No active or upcoming schedules for this selection.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[280px]">
                  {stats.upcomingSchedules.map((s, idx) => {
                    const dateObj = new Date(s.departureTime);
                    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                    return (
                      <div key={s._id || idx} className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex flex-col items-center justify-center min-w-[70px] bg-white border border-slate-200 rounded-lg py-2 mr-4 group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors">
                            <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">{dateString}</span>
                            <span className="text-sm font-black text-slate-800">{timeString}</span>
                          </div>

                          <div>
                            {/* Depot Badge */}
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider mb-1 inline-block">
                              🏢 {s.depotName || 'Colombo Central Bus Depot'}
                            </span>

                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800">{s.routeId?.startPoint || 'Depot'}</span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <span className="font-bold text-slate-800">{s.routeId?.endPoint || 'Destination'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                              <span className="flex items-center gap-1 bg-slate-200/50 px-2 py-0.5 rounded-md text-slate-600 font-bold">
                                <BusFront className="w-3 h-3 text-blue-500" /> {s.vehicleId?.registrationNumber || 'Bus'}
                              </span>
                              <span className="flex items-center gap-1 bg-slate-200/50 px-2 py-0.5 rounded-md text-slate-600 font-bold">
                                <Users className="w-3 h-3 text-purple-500" /> {s.driverId?.name || 'Driver'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          {getStatusBadge(s.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
