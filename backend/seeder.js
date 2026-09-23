require('dotenv').config();
const mongoose = require('mongoose');

const Depot = require('./models/Depot');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const Route = require('./models/Route');
const Schedule = require('./models/Schedule');
const FuelLog = require('./models/FuelLog');
const Maintenance = require('./models/Maintenance');
const Request = require('./models/Request');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bus_management';

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri} ...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connection established!');

    // Clear existing data
    console.log('Clearing old database records...');
    await Promise.all([
      Depot.deleteMany({}),
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Route.deleteMany({}),
      Schedule.deleteMany({}),
      FuelLog.deleteMany({}),
      Maintenance.deleteMany({}),
      Request.deleteMany({})
    ]);

    // 1. Seed Depots
    console.log('Seeding Depots...');
    const colomboDepot = await Depot.create({
      name: 'Colombo Central Bus Depot',
      code: 'DEP-CMB',
      city: 'Colombo',
      location: 'Bastian Mawatha, Pettah, Colombo 01',
      contactNumber: '011-2328901',
      capacity: 120,
      status: 'active'
    });

    const kandyDepot = await Depot.create({
      name: 'Kandy Central Bus Depot',
      code: 'DEP-KDY',
      city: 'Kandy',
      location: 'Goods Shed Bus Stand, Kandy',
      contactNumber: '081-2234120',
      capacity: 85,
      status: 'active'
    });

    const galleDepot = await Depot.create({
      name: 'Galle Southern Depot',
      code: 'DEP-GLE',
      city: 'Galle',
      location: 'Main Bus Stand Road, Galle',
      contactNumber: '091-2232045',
      capacity: 65,
      status: 'active'
    });

    // 2. Seed Users
    console.log('Seeding Users...');
    const superAdminUser = await User.create({
      username: 'superadmin',
      password: 'admin123',
      role: 'super_admin',
      name: 'National Transit Admin',
      depotId: colomboDepot._id
    });

    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
      name: 'System Admin',
      depotId: colomboDepot._id
    });

    const colomboAdminUser = await User.create({
      username: 'colombo_admin',
      password: 'admin123',
      role: 'depot_admin',
      name: 'Colombo Depot Manager',
      depotId: colomboDepot._id
    });

    const kandyAdminUser = await User.create({
      username: 'kandy_admin',
      password: 'admin123',
      role: 'depot_admin',
      name: 'Kandy Depot Manager',
      depotId: kandyDepot._id
    });

    const staffUser = await User.create({
      username: 'staff_colombo',
      password: 'admin123',
      role: 'staff',
      name: 'Colombo Dispatch Clerk',
      depotId: colomboDepot._id
    });

    const driverUser = await User.create({
      username: 'driver_kamal',
      password: 'admin123',
      role: 'driver',
      name: 'Kamal Perera (Driver)',
      depotId: colomboDepot._id
    });

    // 3. Seed Vehicles
    console.log('Seeding Vehicles...');
    const bus1 = await Vehicle.create({
      registrationNumber: 'NC-4589',
      type: 'Luxury Bus',
      capacity: 54,
      mileage: 145200,
      depotId: colomboDepot._id,
      status: 'on-route'
    });

    const bus2 = await Vehicle.create({
      registrationNumber: 'WP-8921',
      type: 'Standard Bus',
      capacity: 48,
      mileage: 98400,
      depotId: colomboDepot._id,
      status: 'available'
    });

    const bus3 = await Vehicle.create({
      registrationNumber: 'CP-3104',
      type: 'AC Express',
      capacity: 32,
      mileage: 210500,
      depotId: kandyDepot._id,
      status: 'maintenance'
    });

    // 4. Seed Drivers
    console.log('Seeding Drivers...');
    const driver1 = await Driver.create({
      name: 'Kamal Perera',
      licenseNumber: 'B1234567',
      contact: '0771234567',
      licenseExpiry: new Date('2027-12-31'),
      depotId: colomboDepot._id,
      userId: driverUser._id,
      workingHours: 42,
      status: 'active'
    });

    const driver2 = await Driver.create({
      name: 'Nimal Silva',
      licenseNumber: 'B7654321',
      contact: '0719876543',
      licenseExpiry: new Date('2026-11-15'),
      depotId: kandyDepot._id,
      workingHours: 38,
      status: 'active'
    });

    // 5. Seed Routes
    console.log('Seeding Routes...');
    const route1 = await Route.create({
      startPoint: 'Colombo',
      endPoint: 'Kandy',
      stops: ['Kadawatha', 'Nittambuwa', 'Kegalle'],
      distance: 115,
      depotId: colomboDepot._id
    });

    const route2 = await Route.create({
      startPoint: 'Colombo',
      endPoint: 'Galle',
      stops: ['Panadura', 'Kalutara', 'Bentota'],
      distance: 126,
      depotId: colomboDepot._id
    });

    const route3 = await Route.create({
      startPoint: 'Kandy',
      endPoint: 'Nuwara Eliya',
      stops: ['Gampola', 'Ramboda'],
      distance: 78,
      depotId: kandyDepot._id
    });

    // 6. Seed Schedules
    console.log('Seeding Schedules...');
    await Schedule.create({
      routeId: route1._id,
      vehicleId: bus1._id,
      driverId: driver1._id,
      departureTime: new Date(Date.now() + 1800000),
      arrivalTime: new Date(Date.now() + 12600000),
      status: 'on time',
      notes: 'Morning Intercity Service'
    });

    await Schedule.create({
      routeId: route2._id,
      vehicleId: bus2._id,
      driverId: driver2._id,
      departureTime: new Date(Date.now() + 7200000),
      arrivalTime: new Date(Date.now() + 18000000),
      status: 'delayed',
      notes: 'Traffic delay near Kalutara'
    });

    // 7. Seed Fuel Logs & Maintenance
    console.log('Seeding Fuel Logs & Maintenance...');
    await FuelLog.create({
      vehicleId: bus1._id,
      date: new Date(Date.now() - 86400000),
      liters: 75,
      cost: 26250
    });

    await Maintenance.create({
      vehicleId: bus3._id,
      type: 'Engine Service & Brake Replacement',
      description: 'Routine 200,000km overhaul',
      cost: 48500,
      status: 'in-progress',
      date: new Date()
    });

    // 8. Seed Requests
    console.log('Seeding Requests...');
    await Request.create({
      requestType: 'fuel',
      depotId: colomboDepot._id,
      requestedBy: driverUser._id,
      requestedByName: 'Kamal Perera (Driver)',
      requestedByRole: 'driver',
      vehicleId: bus1._id,
      vehicleReg: 'NC-4589',
      details: {
        liters: 80,
        description: 'Fuel quota request for Colombo - Kandy intercity run',
        estimatedCost: 28000
      },
      status: 'pending'
    });

    console.log('🎉 Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
