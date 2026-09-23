import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDepot } from '../context/DepotContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ShieldCheck, User as UserIcon, 
  Search, Bell, Menu, ChevronDown, Check, X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { activeDepot, setActiveDepot, depots } = useDepot();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  // Searchable Depot Selector state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // Get active depot object/label
  const currentDepotObj = depots.find(d => String(d._id) === String(activeDepot));
  const activeLabel = activeDepot === 'all' || !currentDepotObj
    ? 'All Depots (National Mode)'
    : `${currentDepotObj.name} (${currentDepotObj.city})`;

  // Filter depots based on search query
  const filteredDepots = depots.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name?.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q)
    );
  });

  const handleSelectDepot = (depotId) => {
    setActiveDepot(depotId);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClearSearch = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    setActiveDepot('all');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800 shadow-md transition-all duration-300">
      <div className="flex justify-between items-center px-4 sm:px-6 py-2.5">
        
        {/* Left Side - Greeting & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded-lg lg:hidden transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-200">
              {greeting}, <span className="text-blue-400">{user?.name || user?.username || 'Guest'}</span> 👋
            </p>
            <p className="text-xs font-medium text-slate-400">
              National Bus Management & Depot Operations
            </p>
          </div>
        </div>

        {/* Center - Standard Search Bar & Depot Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-sm md:max-w-md lg:max-w-lg">
          {/* Normal Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routes, buses, drivers..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-slate-100 text-xs sm:text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-100 p-0.5"
                title="Clear search"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Depot Selector Dropdown for Super Admin / Admin */}
          {isSuperAdmin && (
            <select
              value={activeDepot}
              onChange={(e) => setActiveDepot(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 text-blue-400 text-xs font-bold rounded-xl px-2.5 py-2 outline-none cursor-pointer hover:border-blue-500 transition-all shrink-0 max-w-[150px] sm:max-w-[180px] truncate"
            >
              <option value="all">🌐 All Depots</option>
              {depots.map(d => (
                <option key={d._id} value={d._id}>🏢 {d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button className="relative p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0B1120] animate-pulse"></span>
          </button>

          <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>

          {/* User Details */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden lg:block">
              <span className="text-slate-200 text-sm font-bold capitalize tracking-wide leading-tight">
                {user?.name || user?.username || 'Guest User'}
              </span>
              <div className="flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {(user?.role || 'User').replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-md shadow-blue-900/50 transform hover:scale-105 transition-transform duration-200 ring-2 ring-slate-700 cursor-pointer select-none">
              {userInitial}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full sm:rounded-xl text-sm font-bold hover:bg-rose-600 hover:text-white transition-all duration-300 active:scale-95 ml-1 sm:ml-0"
            title="Logout"
          >
            <span className="hidden sm:block mr-2">Logout</span>
            <LogOut className="w-4 h-4 sm:group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;