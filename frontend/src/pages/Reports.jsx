import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart4, Download, Fuel, Wrench, BusFront, Wallet, 
  TrendingUp, FileText, Loader2, Leaf, ShieldCheck
} from 'lucide-react';
import Layout from '../components/Layout';
import { useDepot } from '../context/DepotContext';
import api from '../api/axios';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const Reports = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [depots, setDepots] = useState([]);
  const { activeDepot } = useDepot();
  const [selectedDepot, setSelectedDepot] = useState(activeDepot);
  const [userRole, setUserRole] = useState('super_admin');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setSelectedDepot(activeDepot);
  }, [activeDepot]);


  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [f, m, v, d] = await Promise.all([
          api.get('/fuel-logs'),
          api.get('/maintenance'),
          api.get('/vehicles'),
          api.get('/depots')
        ]);
        setFuelLogs(f.data);
        setMaintenance(m.data);
        setVehicles(v.data);
        setDepots(d.data);

        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setUserRole(u.role || 'super_admin');
          if (u.role === 'depot_admin' && u.depotId) {
            setSelectedDepot(typeof u.depotId === 'object' ? u.depotId._id : u.depotId);
          }
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
      }
    };
    fetchAll();
  }, []);

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-100">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: Rs. {Number(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to safely extract ID whether string or populated object
  const getEntityId = (entity) => {
    if (!entity) return '';
    return typeof entity === 'object' ? String(entity._id || '') : String(entity);
  };

  // Filter Data based on selected depot
  const filteredVehicles = selectedDepot === 'all' 
    ? vehicles 
    : vehicles.filter(v => getEntityId(v.depotId) === String(selectedDepot));

  const vehicleIds = filteredVehicles.map(v => String(v._id));

  const filteredFuelLogs = selectedDepot === 'all'
    ? fuelLogs
    : fuelLogs.filter(f => vehicleIds.includes(getEntityId(f.vehicleId)));

  const filteredMaintenance = selectedDepot === 'all'
    ? maintenance
    : maintenance.filter(m => vehicleIds.includes(getEntityId(m.vehicleId)));

  const monthlySummary = (() => {
    const map = {};
    filteredFuelLogs.forEach((f) => {
      const month = f.date ? f.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      if (!map[month]) map[month] = { month, fuelCost: 0, maintenanceCost: 0, liters: 0 };
      map[month].fuelCost += f.cost || 0;
      map[month].liters += f.liters || 0;
    });
    filteredMaintenance.forEach((m) => {
      const month = m.date ? m.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      if (!map[month]) map[month] = { month, fuelCost: 0, maintenanceCost: 0, liters: 0 };
      map[month].maintenanceCost += m.cost || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => {
        const date = new Date(item.month + '-01');
        return {
          ...item,
          displayName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      });
  })();

  const serviceTypeBreakdown = (() => {
    const map = {};
    filteredMaintenance.forEach((m) => {
      const type = m.type || m.serviceType || 'Routine Servicing';
      map[type] = (map[type] || 0) + (m.cost || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const totalFuelCost = filteredFuelLogs.reduce((sum, f) => sum + (f.cost || 0), 0);
  const totalFuelLiters = filteredFuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalMaintenanceCost = filteredMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalExpenses = totalFuelCost + totalMaintenanceCost;
  const estimatedCarbonKg = Math.round(totalFuelLiters * 2.68);

  const activeDepotObj = depots.find(d => String(d._id) === String(selectedDepot));
  const depotTitle = selectedDepot === 'all' ? 'All Depots (National Overview)' : (activeDepotObj?.name || 'Colombo Central Depot');

  const exportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header Banner
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 28, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Smart Bus Master System (SRMSS)', 14, 16);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(`Official Executive Report: ${depotTitle} | Generated: ${new Date().toLocaleString()}`, 14, 23);

      // Section 1: Executive KPI Summary
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('1. Operational & Financial KPI Summary', 14, 36);
      
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`• Selected Scope: ${depotTitle}`, 14, 43);
      doc.text(`• Total Combined Fleet Expenses: Rs. ${formatMoney(totalExpenses)}`, 14, 49);
      doc.text(`• Total Fuel Consumption Cost: Rs. ${formatMoney(totalFuelCost)} (${totalFuelLiters.toLocaleString()} Liters)`, 14, 55);
      doc.text(`• Total Vehicle Maintenance Expense: Rs. ${formatMoney(totalMaintenanceCost)}`, 14, 61);
      doc.text(`• Estimated Carbon Footprint (CO2): ${estimatedCarbonKg.toLocaleString()} kg CO2`, 14, 67);
      doc.text(`• Registered Fleet Vehicles: ${filteredVehicles.length} Units`, 14, 73);

      // Table 1: Monthly Financial Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('2. Monthly Financial & Resource Breakdown', 14, 84);

      autoTable(doc, {
        startY: 88,
        head: [['Month', 'Fuel Cost (Rs.)', 'Fuel (L)', 'Maintenance (Rs.)', 'Total Expense (Rs.)']],
        body: monthlySummary.map((m) => [
          m.displayName, 
          formatMoney(m.fuelCost), 
          m.liters + ' L',
          formatMoney(m.maintenanceCost),
          formatMoney(m.fuelCost + m.maintenanceCost)
        ]),
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      let currentY = doc.lastAutoTable.finalY + 12;

      // Check if page overflow
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Table 2: Detailed Fuel Logs
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text('3. Fuel Log Records Summary', 14, currentY);

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Vehicle ID / Reg', 'Date', 'Refill Liters (L)', 'Total Cost (Rs.)', 'Cost/Liter']],
        body: filteredFuelLogs.slice(0, 15).map((f) => {
          const v = vehicles.find(veh => String(veh._id) === getEntityId(f.vehicleId));
          const reg = v ? v.registrationNumber : 'NC-Bus';
          const costPerL = f.liters > 0 ? (f.cost / f.liters).toFixed(2) : '0';
          const dateStr = f.date ? new Date(f.date).toLocaleDateString() : 'N/A';
          return [reg, dateStr, `${f.liters} L`, formatMoney(f.cost), `Rs. ${costPerL}`];
        }),
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [254, 252, 232] },
      });

      currentY = doc.lastAutoTable.finalY + 12;

      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Table 3: Maintenance Audit Records
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('4. Maintenance & Repair Audit Log', 14, currentY);

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Vehicle Reg', 'Service Category', 'Details', 'Cost (Rs.)', 'Status']],
        body: filteredMaintenance.slice(0, 15).map((m) => {
          const v = vehicles.find(veh => String(veh._id) === getEntityId(m.vehicleId));
          const reg = v ? v.registrationNumber : 'Bus Unit';
          return [
            reg,
            m.type || m.serviceType || 'Routine Maintenance',
            (m.description || m.notes || '-').substring(0, 30),
            formatMoney(m.cost),
            (m.status || 'completed').toUpperCase()
          ];
        }),
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [240, 253, 244] },
      });

      // Add Page Numbers Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages} | Bus Master System Reporting Engine`, 105, 290, { align: 'center' });
      }

      const fileName = `BusMaster_${depotTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      setIsExporting(false);
    }, 600);
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-inner">
            <BarChart4 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Reports & Financial Analytics</h2>
            <p className="text-slate-500 font-medium mt-1">Scope: <strong className="text-blue-600">{depotTitle}</strong></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Super Admin Depot Filter */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            <span className="text-xs font-black text-amber-900 uppercase">Depot:</span>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              disabled={userRole === 'depot_admin'}
              className="bg-white border border-amber-300 text-slate-800 font-bold text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="all">🌐 All Depots (National)</option>
              {depots.map(d => (
                <option key={d._id} value={d._id}>🏢 {d.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={exportPDF} 
            disabled={isExporting}
            className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />}
            {isExporting ? 'Generating Report...' : 'Export Depot PDF'}
          </button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-fade-in-up">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Wallet className="w-5 h-5" /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Expenses</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">Rs. {formatMoney(totalExpenses)}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Fuel className="w-5 h-5" /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Fuel Cost</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">Rs. {formatMoney(totalFuelCost)}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Leaf className="w-5 h-5" /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Carbon Footprint</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">{estimatedCarbonKg.toLocaleString()} <span className="text-xs text-slate-400 font-bold">kg CO₂</span></h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Wrench className="w-5 h-5" /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Maintenance</p>
          </div>
          <h3 className="text-2xl font-black text-slate-800">Rs. {formatMoney(totalMaintenanceCost)}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Fleet Status</p>
          </div>
          <h3 className="text-2xl font-black text-emerald-600">Active</h3>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Monthly Expense & Resource Trends</h3>
              <p className="text-xs text-slate-500 font-medium">Monthly fuel vs maintenance expenditure</p>
            </div>
          </div>
          
          {monthlySummary.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p>No financial data available yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlySummary} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Area type="monotone" dataKey="fuelCost" name="Fuel Expenses" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFuel)" />
                <Area type="monotone" dataKey="maintenanceCost" name="Maintenance" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorMaint)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Maintenance Service Breakdown</h3>
              <p className="text-xs text-slate-500 font-medium">Cost distribution by vehicle maintenance category</p>
            </div>
          </div>
          
          {serviceTypeBreakdown.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
              <Wrench className="w-12 h-12 mb-3 opacity-20" />
              <p>No maintenance data to analyze.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={serviceTypeBreakdown} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {serviceTypeBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;