const mongoose = require('mongoose');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const Depot = require('../models/Depot');
const {
  depots: memoryDepots,
  routes: memoryRoutes,
  vehicles: memoryVehicles,
  drivers: memoryDrivers,
  schedules: memorySchedules,
  fuelLogs: memoryFuelLogs,
  maintenanceLogs: memoryMaintenanceLogs
} = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getStats = async (req, res) => {
  try {
    const { depotId } = req.query;

    if (isDbConnected()) {
      let filter = {};
      if (depotId && depotId !== 'all') {
        filter.depotId = depotId;
      }

      const totalDepots = await Depot.countDocuments();
      const totalRoutes = await Route.countDocuments(filter);
      const totalVehicles = await Vehicle.countDocuments(filter);
      const activeVehicles = await Vehicle.countDocuments({ ...filter, status: { $ne: 'maintenance' } });
      const totalDrivers = await Driver.countDocuments(filter);
      const totalSchedules = await Schedule.countDocuments(filter);

      const upcomingSchedules = await Schedule.find(filter)
        .sort('departureTime')
        .limit(6)
        .populate('routeId')
        .populate('vehicleId')
        .populate('driverId');

      const fuelByMonth = await FuelLog.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, totalLiters: { $sum: '$liters' }, totalCost: { $sum: '$cost' } } },
        { $sort: { _id: 1 } }
      ]);

      return res.json({
        totalDepots,
        totalRoutes,
        totalVehicles,
        activeVehicles,
        totalDrivers,
        totalSchedules,
        upcomingSchedules,
        fuelByMonth
      });
    }

    // In-Memory Fallback Implementation with Depot Filter
    const totalDepots = (memoryDepots || []).length;
    let filteredVehicles = memoryVehicles;
    let filteredDrivers = memoryDrivers;
    let filteredRoutes = memoryRoutes;
    let filteredSchedules = memorySchedules;
    let filteredFuel = memoryFuelLogs;
    let filteredMaintenance = memoryMaintenanceLogs;

    if (depotId && depotId !== 'all') {
      filteredVehicles = memoryVehicles.filter(v => String(v.depotId) === String(depotId));
      filteredDrivers = memoryDrivers.filter(d => String(d.depotId) === String(depotId));
      filteredRoutes = memoryRoutes.filter(r => String(r.depotId) === String(depotId));

      const vehicleIds = filteredVehicles.map(v => String(v._id));
      filteredSchedules = memorySchedules.filter(s => vehicleIds.includes(String(s.vehicleId)));
      filteredFuel = memoryFuelLogs.filter(f => vehicleIds.includes(String(f.vehicleId)));
      filteredMaintenance = memoryMaintenanceLogs.filter(m => vehicleIds.includes(String(m.vehicleId)));
    }

    const totalRoutes = filteredRoutes.length;
    const totalVehicles = filteredVehicles.length;
    const activeVehicles = filteredVehicles.filter(v => v.status !== 'maintenance').length;
    const totalDrivers = filteredDrivers.length;
    const totalSchedules = filteredSchedules.length;

    const totalFuelLiters = filteredFuel.reduce((sum, f) => sum + (f.liters || 0), 0);
    const totalFuelCost = filteredFuel.reduce((sum, f) => sum + (f.cost || 0), 0);
    const totalMaintenanceCost = filteredMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
    const estimatedCarbonKg = Math.round(totalFuelLiters * 2.68);

    const upcomingSchedules = filteredSchedules
      .slice(0, 6)
      .map(s => {
        const vehicleObj = memoryVehicles.find(v => v._id === String(s.vehicleId)) || s.vehicleId;
        const depotObj = (memoryDepots || []).find(d => String(d._id) === String(vehicleObj?.depotId || s.depotId));
        return {
          ...s,
          routeId: memoryRoutes.find(r => r._id === String(s.routeId)) || s.routeId,
          vehicleId: vehicleObj,
          driverId: memoryDrivers.find(d => d._id === String(s.driverId)) || s.driverId,
          depotName: depotObj?.name || 'Colombo Central Bus Depot',
          depotCode: depotObj?.code || 'DEP-CMB'
        };
      });

    const fuelByMonthMap = {};
    filteredFuel.forEach(l => {
      const d = new Date(l.date || l.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!fuelByMonthMap[monthKey]) {
        fuelByMonthMap[monthKey] = { _id: monthKey, totalLiters: 0, totalCost: 0 };
      }
      fuelByMonthMap[monthKey].totalLiters += Number(l.liters || 0);
      fuelByMonthMap[monthKey].totalCost += Number(l.cost || 0);
    });
    const fuelByMonth = Object.values(fuelByMonthMap);

    res.json({
      totalDepots,
      totalRoutes,
      totalVehicles,
      activeVehicles,
      totalDrivers,
      totalSchedules,
      totalFuelLiters,
      totalFuelCost,
      totalMaintenanceCost,
      estimatedCarbonKg,
      upcomingSchedules,
      fuelByMonth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


