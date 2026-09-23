import React from 'react';
import { Activity } from 'lucide-react';

const StatCard = ({ title, value, color, icon: Icon }) => {
  // Kalin thibba 'border-blue-500' wage colors modern bg/text colors walata map kireema
  const colorMap = {
    'border-blue-500': { bg: 'bg-blue-50', text: 'text-blue-600', solid: 'bg-blue-500', shadow: 'shadow-blue-200' },
    'border-green-500': { bg: 'bg-green-50', text: 'text-green-600', solid: 'bg-green-500', shadow: 'shadow-green-200' },
    'border-emerald-500': { bg: 'bg-emerald-50', text: 'text-emerald-600', solid: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
    'border-purple-500': { bg: 'bg-purple-50', text: 'text-purple-600', solid: 'bg-purple-500', shadow: 'shadow-purple-200' },
    'border-orange-500': { bg: 'bg-orange-50', text: 'text-orange-600', solid: 'bg-orange-500', shadow: 'shadow-orange-200' },
  };

  const theme = colorMap[color] || { bg: 'bg-slate-50', text: 'text-slate-600', solid: 'bg-slate-500', shadow: 'shadow-slate-200' };

  // Icon ekak dila nattam default icon eka widiyata Activity icon eka use wenawa
  const DisplayIcon = Icon || Activity;

  return (
    <div className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-default">
      
      {/* Background Decorative Element (Top Right Corner Hover Effect) */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${theme.solid}`}></div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
          {/* Title */}
          <p className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1.5">
            {title}
          </p>
          {/* Value */}
          <h3 className={`text-3xl font-black text-slate-800 transition-colors duration-300 group-hover:${theme.text}`}>
            {value}
          </h3>
        </div>
        
        {/* Icon Box */}
        <div className={`p-3 rounded-xl transition-all duration-300 ${theme.bg} ${theme.text} group-hover:shadow-md ${theme.shadow} group-hover:scale-110`}>
          <DisplayIcon className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
};

export default StatCard;