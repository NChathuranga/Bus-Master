import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDepot } from '../context/DepotContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ShieldCheck, Search, Bell, Menu, X, 
  Map, BusFront, Users, ArrowRight, Building2, Key, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { activeDepot, setActiveDepot, depots } = useDepot();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [allData, setAllData] = useState({ routes: [], vehicles: [], drivers: [], depots: [] });
  const [searchResults, setSearchResults] = useState({ routes: [], vehicles: [], drivers: [], depots: [] });
  
  // Password Change & Profile State for any logged in user
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ name: user?.name || '', currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const searchRef = useRef(null);

  // Fetch searchable datasets
  const loadSearchData = async () => {
    try {
      const [r, v, d, dp] = await Promise.all([
        api.get('/routes'),
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/depots')
      ]);
      setAllData({
        routes: Array.isArray(r.data) ? r.data : [],
        vehicles: Array.isArray(v.data) ? v.data : [],
        drivers: Array.isArray(d.data) ? d.data : [],
        depots: Array.isArray(dp.data) ? dp.data : []
      });
    } catch (err) {
      console.error('Failed to load search index:', err);
    }
  };

  useEffect(() => {
    loadSearchData();
  }, []);

  // Filter global search results when searchQuery changes
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setSearchResults({ routes: [], vehicles: [], drivers: [], depots: [] });
      setShowSearchMenu(false);
      return;
    }

    const matchedRoutes = allData.routes.filter(r => 
      r.startPoint?.toLowerCase().includes(q) ||
      r.endPoint?.toLowerCase().includes(q) ||
      (Array.isArray(r.stops) && r.stops.some(s => String(s).toLowerCase().includes(q)))
    ).slice(0, 3);

    const matchedVehicles = allData.vehicles.filter(v => 
      v.registrationNumber?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q) ||
      v.status?.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedDrivers = allData.drivers.filter(d => 
      d.name?.toLowerCase().includes(q) ||
      d.licenseNumber?.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedDepots = (allData.depots || []).filter(dp =>
      dp.name?.toLowerCase().includes(q) ||
      dp.code?.toLowerCase().includes(q) ||
      dp.city?.toLowerCase().includes(q) ||
      dp.location?.toLowerCase().includes(q)
    ).slice(0, 3);

    setSearchResults({
      routes: matchedRoutes,
      vehicles: matchedVehicles,
      drivers: matchedDrivers,
      depots: matchedDepots
    });
    setShowSearchMenu(true);
  }, [searchQuery, allData]);

  // Close search menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResultClick = (targetPath) => {
    setShowSearchMenu(false);
    setSearchQuery('');
    navigate(targetPath);
  };

  const cleanDisplayName = (user?.name || user?.username || 'User')
    .replace(/\s*\((?:Driver|Admin|Super Admin|Staff)\)/gi, '')
    .trim();

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const totalResults = searchResults.routes.length + searchResults.vehicles.length + searchResults.drivers.length + (searchResults.depots?.length || 0);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/50';
      case 'driver':
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50';
      case 'depot_admin':
      case 'admin':
        return 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/50 shadow-purple-950/50';
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/50 shadow-blue-950/50';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120] border-b border-slate-800 shadow-xl select-none">
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 w-full gap-2 sm:gap-4">
        
        {/* LEFT - Title */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg lg:hidden transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide leading-tight">
              Control Center
            </h2>
            <p className="text-[10px] font-medium text-slate-400 hidden md:block">
              Bus Operations Portal
            </p>
          </div>
        </div>

        {/* CENTER - Global Search Bar & Depot Selector */}
        <div className="flex items-center gap-2 flex-1 max-w-md min-w-0">
          
          {/* Live Search Input & Dropdown Popup */}
          <div className="relative flex-1 min-w-0" ref={searchRef}>
            <div className="relative flex items-center w-full">
              <Search className="w-3.5 h-3.5 text-blue-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => { if (searchQuery.trim()) setShowSearchMenu(true); }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search depots, routes, buses, drivers..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1.5 text-slate-100 text-xs font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 truncate"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowSearchMenu(false); }}
                  className="absolute right-2 text-slate-400 hover:text-white p-0.5"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Floating Live Search Dropdown Popup */}
            {showSearchMenu && (
              <div className="absolute left-0 w-[280px] sm:w-[380px] top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-bounce-in max-h-[380px] overflow-y-auto custom-scrollbar">
                
                <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Search Results</span>
                  <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {totalResults} Matches
                  </span>
                </div>

                {totalResults === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-medium">
                    No matching depots, routes, buses, or drivers found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    
                    {/* Depots */}
                    {searchResults.depots?.length > 0 && (
                      <div>
                        <div className="px-2 py-0.5 text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Depots
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {searchResults.depots.map(dp => (
                            <button
                              key={dp._id}
                              onClick={() => {
                                setActiveDepot(dp._id);
                                handleResultClick('/depots');
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between text-xs group"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                <span>🏢 {dp.name}</span>
                                <span className="text-[10px] font-black text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">
                                  {dp.code}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-400">View ➔</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Routes */}
                    {searchResults.routes.length > 0 && (
                      <div>
                        <div className="px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                          <Map className="w-3 h-3" /> Routes
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {searchResults.routes.map(r => (
                            <button
                              key={r._id}
                              onClick={() => handleResultClick('/routes')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between text-xs group"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                <span>{r.startPoint}</span>
                                <ArrowRight className="w-3 h-3 text-emerald-400" />
                                <span>{r.endPoint}</span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-400">View ➔</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicles */}
                    {searchResults.vehicles.length > 0 && (
                      <div>
                        <div className="px-2 py-0.5 text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1">
                          <BusFront className="w-3 h-3" /> Buses
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {searchResults.vehicles.map(v => (
                            <button
                              key={v._id}
                              onClick={() => handleResultClick('/vehicles')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="font-extrabold text-white">{v.registrationNumber} ({v.type})</span>
                              <span className="text-[10px] font-bold text-teal-400 uppercase bg-teal-950 px-1.5 py-0.5 rounded">
                                {v.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drivers */}
                    {searchResults.drivers.length > 0 && (
                      <div>
                        <div className="px-2 py-0.5 text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3" /> Drivers
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          {searchResults.drivers.map(d => (
                            <button
                              key={d._id}
                              onClick={() => handleResultClick('/drivers')}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="font-extrabold text-white">{d.name} ({d.licenseNumber})</span>
                              <span className="text-[10px] font-bold text-indigo-400">Info ➔</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </div>

          {/* Depot Selector Dropdown for Super Admin / Admin */}
          {isSuperAdmin && (
            <select
              value={activeDepot}
              onChange={(e) => setActiveDepot(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-blue-400 text-xs font-bold rounded-xl px-2 py-1.5 outline-none cursor-pointer hover:border-blue-500 transition-all shrink-0 w-28 sm:w-36 truncate"
            >
              <option value="all">🌐 All Depots</option>
              {depots.map(d => (
                <option key={d._id} value={d._id}>🏢 {d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* RIGHT - Notifications, User Profile & Logout Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Notification Bell */}
          <button className="relative p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-[#0B1120] animate-ping"></span>
          </button>

          {/* Single Highlighted Unified User Badge Pill */}
          <div className="hidden md:flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/90 px-3.5 py-1.5 rounded-xl shadow-lg ring-1 ring-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-extrabold text-white whitespace-nowrap tracking-wide">
              {cleanDisplayName}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border shadow-sm ${getRoleBadgeStyle(user?.role)}`}>
              {(user?.role || 'User').replace('_', ' ')}
            </span>
          </div>

          {/* Change Password Button for Logged In User */}
          <button
            onClick={() => setShowPasswordModal(true)}
            title="Change Password & Account Settings"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Password</span>
          </button>

          {/* PROMINENT VISIBLE LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
          >
            <span>Logout</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      {/* Global Password Change Modal for Logged In User */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up text-slate-800">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Change Password & Profile</h3>
                  <p className="text-xs text-slate-500">Update your security password or display name</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                <input
                  type="text"
                  value={pwdForm.name}
                  onChange={(e) => setPwdForm({ ...pwdForm, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  required
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
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
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 disabled:opacity-50"
                >
                  {passwordLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;