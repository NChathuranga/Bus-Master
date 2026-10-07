const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const seedDatabaseIfEmpty = async () => {
  try {
    const Depot = require('../models/Depot');
    const count = await Depot.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial records...');
      const seeder = require('../seeder');
    }
  } catch (err) {
    console.log('Seeding check note:', err.message);
  }
};

const connectDB = async () => {
  try {
    mongoose.set('bufferCommands', false);
    
    // 1. Try process.env.MONGO_URI if defined and not broken
    if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('cluster0.fyrkaur.mongodb.net')) {
      try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('✅ MongoDB Atlas Cloud database connected successfully.');
        await seedDatabaseIfEmpty();
        return;
      } catch (err) {
        console.log('⚠️ Configured MONGO_URI connection failed:', err.message);
      }
    }

    // 2. Try Local MongoDB on port 27017
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/bus_management', { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to local MongoDB instance (mongodb://127.0.0.1:27017/bus_management).');
      await seedDatabaseIfEmpty();
      return;
    } catch (err) {
      console.log('ℹ️ Local MongoDB service offline. Initializing embedded database...');
    }

    // 3. Fallback: Start MongoMemoryServer (Real standalone MongoDB instance in Node)
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ Database connected at ${uri}`);

    // Seed initial data into MongoMemoryServer
    try {
      const Depot = require('../models/Depot');
      const User = require('../models/User');
      const Vehicle = require('../models/Vehicle');
      const Driver = require('../models/Driver');
      const Route = require('../models/Route');
      const Schedule = require('../models/Schedule');

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

      const kuliyapitiyaDepot = await Depot.create({
        name: 'Kuliyapitiya Bus Depot',
        code: 'DEP-KUL',
        city: 'Kuliyapitiya',
        location: 'Main Bus Station, Madampe Road, Kuliyapitiya',
        contactNumber: '037-2281234',
        capacity: 75,
        status: 'active'
      });

      const kurunegalaDepot = await Depot.create({
        name: 'Kurunegala Central Depot',
        code: 'DEP-KNG',
        city: 'Kurunegala',
        location: 'Central Bus Stand, Dambulla Road, Kurunegala',
        contactNumber: '037-2222100',
        capacity: 110,
        status: 'active'
      });

      await User.create({
        username: 'superadmin',
        password: 'admin123',
        role: 'super_admin',
        name: 'System Administrator',
        depotId: colomboDepot._id
      });

      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'super_admin',
        name: 'System Admin',
        depotId: colomboDepot._id
      });

      await User.create({
        username: 'colombo_admin',
        password: 'admin123',
        role: 'depot_admin',
        name: 'Colombo Depot Manager',
        depotId: colomboDepot._id
      });

      await User.create({
        username: 'kandy_admin',
        password: 'admin123',
        role: 'depot_admin',
        name: 'Kandy Depot Manager',
        depotId: kandyDepot._id
      });

      await User.create({
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

      const route1 = await Route.create({
        startPoint: 'Colombo',
        endPoint: 'Kandy',
        stops: ['Kadawatha', 'Nittambuwa', 'Kegalle'],
        distance: 115,
        depotId: colomboDepot._id
      });

      const driver1 = await Driver.create({
        name: 'Kamal Perera',
        licenseNumber: 'B1234567',
        contact: '0771234567',
        licenseExpiry: new Date('2027-12-31'),
        depotId: colomboDepot._id,
        assignedRoute: route1._id,
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

      await Schedule.create({
        routeId: route1._id,
        vehicleId: bus1._id,
        driverId: driver1._id,
        departureTime: new Date(Date.now() + 1800000),
        arrivalTime: new Date(Date.now() + 12600000),
        status: 'on time',
        notes: 'Morning Intercity Service'
      });

      console.log('🎉 Embedded MongoDB populated with initial seed data!');
    } catch (seedErr) {
      console.log('Initial seed note:', seedErr.message);
    }
  } catch (err) {
    console.log('⚠️ MongoDB Connection Note:', err.message);
  }
};

module.exports = connectDB;

