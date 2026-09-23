import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Fuel,
  Droplets,
  CircleDollarSign,
  CalendarDays,
  BusFront,
  Plus,
  Trash2,
  AlertCircle,
  X,
  ReceiptText,
  Gauge,
  Download
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const emptyForm = { vehicleId: '', liters: '', cost: '', date: '' };

const FuelLogs = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const [l, v] = await Promise.all([api.get('/fuel-logs'), api.get('/vehicles')]);
      setLogs(l.data);
      setVehicles(v.data);
    } catch (err) {
      console.error('Failed to load fuel logs:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Bus Master System - Fuel Log Report', 14, 16);

    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 33);
    doc.text(`Total Fuel Entries: ${summary.totalLogs}`, 14, 39);
    doc.text(`Total Fuel Consumption: ${summary.totalLiters.toLocaleString()} Liters`, 14, 45);
    doc.text(`Total Fuel Expenditure: Rs. ${formatMoney(summary.totalCost)}`, 14, 51);

    autoTable(doc, {
      startY: 57,
      head: [['Vehicle Reg Number', 'Date', 'Refill Liters (L)', 'Cost (Rs.)', 'Avg Cost/L']],
      body: logs.map((item) => {
        const v = vehicles.find(veh => String(veh._id) === String(typeof item.vehicleId === 'object' ? item.vehicleId?._id : item.vehicleId));
        const reg = v ? v.registrationNumber : 'Bus Unit';
        const costPerL = item.liters > 0 ? (item.cost / item.liters).toFixed(2) : '0';
        return [
          reg,
          item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
          `${item.liters} L`,
          `Rs. ${formatMoney(item.cost)}`,
          `Rs. ${costPerL}`
        ];
      }),
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [254, 252, 232] }
    });

    doc.save(`Fuel_Logs_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/fuel-logs', {
        ...form,
        liters: Number(form.liters),
        cost: Number(form.cost) || 0
      });

      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fuel log');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel log?')) return;
    try {
      await api.delete(`/fuel-logs/${id}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete fuel log');
    }
  };

  const summary = useMemo(() => {
    const totalLiters = logs.reduce((sum, item) => sum + (Number(item.liters) || 0), 0);
    const totalCost = logs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

    return {
      totalLogs: logs.length,
      totalLiters,
      totalCost,
      avgCostPerLiter
    };
  }, [logs]);

  const formatMoney = (value) => {
    return new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-inner">
            <Fuel className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Fuel Logs</h2>
            <p className="text-slate-500 font-medium mt-1">
              Track fuel usage, expenses, and vehicle refills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:from-amber-600 hover:to-orange-700 transition-all active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-500">Total Entries:</span>
            <span className="text-lg font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {summary.totalLogs}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Logs</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{summary.totalLogs}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <ReceiptText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Liters</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{summary.totalLiters.toFixed(1)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Cost</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">
                Rs. {formatMoney(summary.totalCost)}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
              <CircleDollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Avg. Cost / Liter</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">
                Rs. {formatMoney(summary.avgCostPerLiter)}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 w-6 h-6" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Fuel className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-700">Add Fuel Log</h3>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          {/* Vehicle */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Vehicle
            </label>
            <BusFront className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Liters */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Liters
            </label>
            <Droplets className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
            <input
              name="liters"
              type="number"
              step="0.1"
              value={form.liters}
              onChange={handleChange}
              placeholder="e.g. 45.5"
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Cost */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cost
            </label>
            <CircleDollarSign className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
            <input
              name="cost"
              type="number"
              step="0.01"
              value={form.cost}
              onChange={handleChange}
              placeholder="e.g. 12000"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Date */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Fuel Date
            </label>
            <CalendarDays className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Submit */}
          <div className="xl:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              className="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-md shadow-amber-200 hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add Fuel Log
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Liters</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {logs.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shadow-sm">
                        <BusFront className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {l.vehicleId?.registrationNumber || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {l.vehicleId?.type || 'Vehicle'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                      <Droplets className="w-3.5 h-3.5" />
                      {Number(l.liters).toFixed(1)} L
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-bold">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      Rs. {formatMoney(Number(l.cost) || 0)}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(l.date).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(l._id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Fuel Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Fuel className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-semibold text-slate-500">No fuel logs yet.</p>
                      <p className="text-sm">Use the form above to add your first fuel entry.</p>
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

export default FuelLogs;