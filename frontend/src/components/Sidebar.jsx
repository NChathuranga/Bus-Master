import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  CalendarClock, 
  Users, 
  BusFront, 
  Fuel, 
  Wrench, 
  BarChart3,
  Building2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

const Sidebar = () => {
  const [userRole, setUserRole] = useState('super_admin');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserRole(u.role || 'super_admin');
      setUserName(u.name || u.username || '');
    }
  }, []);

  const getLinks = () => {
    if (userRole === 'driver') {
      return [
        { to: '/driver-portal', label: 'Driver Duty Portal', icon: UserCheck },
        { to: '/fuel-logs', label: 'Fuel Logs & Requests', icon: Fuel },
        { to: '/maintenance', label: 'Maintenance Requests', icon: Wrench },
        { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 }
      ];
    }

    const baseLinks = [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/approvals', label: 'Approval Center', icon: CheckCircle2 },
      { to: '/routes', label: 'Routes', icon: Map },
      { to: '/schedules', label: 'Schedules', icon: CalendarClock },
      { to: '/drivers', label: 'Drivers', icon: Users },
      { to: '/vehicles', label: 'Vehicles', icon: BusFront },
      { to: '/fuel-logs', label: 'Fuel Logs', icon: Fuel },
      { to: '/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/reports', label: 'Reports', icon: BarChart3 }
    ];

    if (userRole === 'super_admin' || userRole === 'admin') {
      return [
        { to: '/depots', label: 'Depots (Super Admin)', icon: Building2 },
        ...baseLinks
      ];
    }

    return baseLinks;
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-[#0B1120] text-slate-300 h-screen sticky top-0 flex flex-col shrink-0 border-r border-slate-800/80 shadow-2xl transition-all duration-300 select-none">
      
      {/* Sidebar Header / Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60 shrink-0">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
          <BusFront className="w-5.5 h-5.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-wide text-white leading-tight">
            Bus<span className="text-blue-500">Master</span>
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            Enterprise
          </span>
        </div>
      </div>

      {/* Navigation Links - Distributed vertically to fill space, no scroll, no text hiding */}
      <nav className="flex-1 px-3 py-3 flex flex-col justify-evenly overflow-hidden">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-900/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 hover:translate-x-1'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                      isActive ? 'scale-110 drop-shadow-md text-white' : 'group-hover:scale-110 group-hover:text-blue-400'
                    }`} 
                  />
                  <span className="whitespace-nowrap font-medium text-sm">{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="p-3.5 border-t border-slate-800/60 bg-slate-950/40 shrink-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logged Role:</span>
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-800/40">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;