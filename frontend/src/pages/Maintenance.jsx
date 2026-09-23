import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Wrench,
  BusFront,
  FileText,
  CalendarDays,
  CircleDollarSign,
  Plus,
  Trash2,
  AlertCircle,
  X,
  ClipboardList,
  Settings2,
  Tag,
  Download
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const emptyForm = { vehicleId: '', serviceType: '', cost: '', notes: '', date: '' };

const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const [m, v] = await Promise.all([api.get('/maintenance'), api.get('/vehicles')]);
      setRecords(m.data);
      setVehicles(v.data);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Bus Master System - Maintenance Audit Report', 14, 16);

    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 33);
    doc.text(`Total Maintenance Records: ${summary.totalRecords}`, 14, 39);
    doc.text(`Total Maintenance Expenditure: Rs. ${formatMoney(summary.totalCost)}`, 14, 45);

    autoTable(doc, {
      startY: 52,
      head: [['Vehicle Reg Number', 'Service Category', 'Details / Notes', 'Date', 'Cost (Rs.)', 'Status']],
      body: records.map((item) => {
        const v = vehicles.find(veh => String(veh._id) === String(typeof item.vehicleId === 'object' ? item.vehicleId?._id : item.vehicleId));
        const reg = v ? v.registrationNumber : 'Bus Unit';
        return [
          reg,
          item.type || item.serviceType || 'General Repair',
          (item.description || item.notes || '-').substring(0, 30),
          item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
          `Rs. ${formatMoney(item.cost)}`,
          (item.status || 'completed').toUpperCase()
        ];
      }),
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] }
    });

    doc.save(`Maintenance_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/maintenance', {
        ...form,
        cost: Number(form.cost) || 0
      });

      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save maintenance record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const summary = useMemo(() => {
    const totalCost = records.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const serviceTypes = new Set(records.map((r) => r.serviceType).filter(Boolean));
    return {
      totalRecords: records.length,
      totalCost,
      uniqueServices: serviceTypes.size,
      vehiclesCount: vehicles.length
    };
  }, [records, vehicles]);

  const formatMoney = (value) => {
    return new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-inner">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Maintenance Records
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Track repairs, servicing, and vehicle upkeep
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-500">Total Records:</span>
            <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {summary.totalRecords}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Records</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{summary.totalRecords}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Total Spend</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">
                Rs. {formatMoney(summary.totalCost)}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CircleDollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Service Types</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{summary.uniqueServices}</h3>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
              <Tag className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-semibold">Vehicles in Fleet</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{summary.vehiclesCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <BusFront className="w-6 h-6" />
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

      {/* Form Section */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Settings2 className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-700">Add Maintenance Record</h3>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {/* Vehicle */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Vehicle
            </label>
            <BusFront className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Service Type
            </label>
            <Wrench className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input
              name="serviceType"
              value={form.serviceType}
              onChange={handleChange}
              placeholder="e.g. Oil change"
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Cost */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cost
            </label>
            <CircleDollarSign className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input
              name="cost"
              type="number"
              step="0.01"
              value={form.cost}
              onChange={handleChange}
              placeholder="e.g. 12000"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Date */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Service Date
            </label>
            <CalendarDays className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Notes */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Notes
            </label>
            <FileText className="absolute left-3.5 top-[38px] w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Submit */}
          <div className="xl:col-span-5 flex justify-end pt-1">
            <button
              type="submit"
              className="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add Record
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
                <th className="px-6 py-4">Service Type</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Vehicle */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shadow-sm">
                        <BusFront className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {r.vehicleId?.registrationNumber || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {r.vehicleId?.type || 'Vehicle'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Service Type */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-bold">
                      <Wrench className="w-3.5 h-3.5" />
                      {r.serviceType}
                    </span>
                  </td>

                  {/* Cost */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      Rs. {formatMoney(Number(r.cost) || 0)}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(r.date)}
                    </span>
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-4">
                    {r.notes ? (
                      <p className="max-w-[260px] text-slate-600 text-sm bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        {r.notes}
                      </p>
                    ) : (
                      <span className="text-slate-400 italic">No notes</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Wrench className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-semibold text-slate-500">No maintenance records yet.</p>
                      <p className="text-sm">Use the form above to add your first maintenance entry.</p>
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

export default Maintenance;