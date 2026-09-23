const bcrypt = require('bcryptjs');

const depots = [
  {
    _id: 'depot_001',
    name: 'Colombo Central Bus Depot',
    code: 'DEP-CMB',
    city: 'Colombo',
    location: 'Bastian Mawatha, Pettah, Colombo 01',
    contactNumber: '011-2328901',
    capacity: 120,
    status: 'active',
    createdAt: new Date()
  },
  {
    _id: 'depot_002',
    name: 'Kandy Central Bus Depot',
    code: 'DEP-KDY',
    city: 'Kandy',
    location: 'Goods Shed Bus Stand, Kandy',
    contactNumber: '081-2234120',
    capacity: 85,
    status: 'active',
    createdAt: new Date()
  },
  {
    _id: 'depot_003',
    name: 'Galle Southern Depot',
    code: 'DEP-GLE',
    city: 'Galle',
    location: 'Main Bus Stand Road, Galle',
    contactNumber: '091-2232045',
    capacity: 65,
    status: 'active',
    createdAt: new Date()
  }
];

const users = [
  {
    _id: 'user_super_001',
    username: 'superadmin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'super_admin',
    name: 'National Transit Admin',
    depotId: 'depot_001',
    createdAt: new Date()
  },
  {
    _id: 'user_admin_001',
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'super_admin',
    name: 'System Admin',
    depotId: 'depot_001',
    createdAt: new Date()
  },
  {
    _id: 'user_depot_colombo',
    username: 'colombo_admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'depot_admin',
    name: 'Colombo Depot Manager',
    depotId: 'depot_001',
    createdAt: new Date()
  },
  {
    _id: 'user_depot_kandy',
    username: 'kandy_admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'depot_admin',
    name: 'Kandy Depot Manager',
    depotId: 'depot_002',
    createdAt: new Date()
  },
  {
    _id: 'user_staff_001',
    username: 'staff_colombo',
    password: bcrypt.hashSync('admin123', 10),
    role: 'staff',
    name: 'Colombo Dispatch Clerk',
    depotId: 'depot_001',
    createdAt: new Date()
  },
  {
    _id: 'user_driver_001',
    username: 'driver_kamal',
    password: bcrypt.hashSync('admin123', 10),
    role: 'driver',
    name: 'Kamal Perera (Driver)',
    depotId: 'depot_001',
    createdAt: new Date()
  }
];

const drivers = [
  {
    _id: 'driver_001',
    name: 'Kamal Perera',
    licenseNumber: 'B1234567',
    contact: '0771234567',
    licenseExpiry: new Date('2027-12-31'),
    assignedRoute: 'route_001',
    depotId: 'depot_001',
    userId: 'user_driver_001',
    workingHours: 42,
    status: 'active',
    createdAt: new Date()
  },
  {
    _id: 'driver_002',
    name: 'Nimal Silva',
    licenseNumber: 'B7654321',
    contact: '0719876543',
    licenseExpiry: new Date('2026-11-15'),
    assignedRoute: 'route_002',
    depotId: 'depot_002',
    workingHours: 38,
    status: 'active',
    createdAt: new Date()
  }
];

const vehicles = [
  {
    _id: 'veh_001',
    registrationNumber: 'NC-4589',
    type: 'Luxury Bus',
    capacity: 54,
    mileage: 145200,
    depotId: 'depot_001',
    status: 'on-route',
    createdAt: new Date()
  },
  {
    _id: 'veh_002',
    registrationNumber: 'WP-8921',
    type: 'Standard Bus',
    capacity: 48,
    mileage: 98400,
    depotId: 'depot_001',
    status: 'available',
    createdAt: new Date()
  },
  {
    _id: 'veh_003',
    registrationNumber: 'CP-3104',
    type: 'AC Express',
    capacity: 32,
    mileage: 210500,
    depotId: 'depot_002',
    status: 'maintenance',
    createdAt: new Date()
  }
];

const requests = [
  {
    _id: 'req_001',
    requestType: 'fuel',
    depotId: 'depot_001',
    requestedBy: 'user_driver_001',
    requestedByName: 'Kamal Perera (Driver)',
    requestedByRole: 'driver',
    vehicleId: 'veh_001',
    vehicleReg: 'NC-4589',
    details: {
      liters: 80,
      serviceType: '',
      description: 'Fuel quota request for Colombo - Kandy intercity run',
      estimatedCost: 28000
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'req_002',
    requestType: 'maintenance',
    depotId: 'depot_001',
    requestedBy: 'user_staff_001',
    requestedByName: 'Colombo Dispatch Clerk',
    requestedByRole: 'staff',
    vehicleId: 'veh_002',
    vehicleReg: 'WP-8921',
    details: {
      liters: 0,
      serviceType: 'Brake Pad & Oil Filter Change',
      description: 'Scheduled 100,000km routine brake inspection',
      estimatedCost: 35000
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000)
  }
];

const routes = [
  {
    _id: 'route_001',
    startPoint: 'Colombo',
    endPoint: 'Kandy',
    stops: ['Kadawatha', 'Nittambuwa', 'Kegalle'],
    distance: 115,
    depotId: 'depot_001',
    createdAt: new Date()
  },
  {
    _id: 'route_002',
    startPoint: 'Colombo',
    endPoint: 'Galle',
    stops: ['Panadura', 'Kalutara', 'Bentota'],
    distance: 126,
    depotId: 'depot_001',
    createdAt: new Date()
  },
  {
    _id: 'route_003',
    startPoint: 'Kandy',
    endPoint: 'Nuwara Eliya',
    stops: ['Gampola', 'Ramboda'],
    distance: 78,
    depotId: 'depot_002',
    createdAt: new Date()
  }
];

const schedules = [
  {
    _id: 'sched_001',
    routeId: 'route_001',
    vehicleId: 'veh_001',
    driverId: 'driver_001',
    departureTime: new Date(Date.now() + 1800000), // in 30 mins
    arrivalTime: new Date(Date.now() + 12600000),
    status: 'on time',
    notes: 'Morning Intercity Service',
    createdAt: new Date()
  },
  {
    _id: 'sched_002',
    routeId: 'route_002',
    vehicleId: 'veh_002',
    driverId: 'driver_002',
    departureTime: new Date(Date.now() + 7200000), // in 2 hours
    arrivalTime: new Date(Date.now() + 18000000),
    status: 'delayed',
    notes: 'Traffic delay near Kalutara',
    createdAt: new Date()
  },
  {
    _id: 'sched_003',
    routeId: 'route_003',
    vehicleId: 'veh_003',
    driverId: 'driver_001',
    departureTime: new Date(Date.now() - 14400000), // completed 4h ago
    arrivalTime: new Date(Date.now() - 3600000),
    status: 'completed',
    notes: 'Regular trip completed',
    createdAt: new Date()
  }
];

const fuelLogs = [
  {
    _id: 'fuel_001',
    vehicleId: 'veh_001',
    date: new Date(Date.now() - 86400000),
    liters: 75,
    cost: 26250,
    createdAt: new Date()
  },
  {
    _id: 'fuel_002',
    vehicleId: 'veh_002',
    date: new Date(Date.now() - 172800000),
    liters: 60,
    cost: 21000,
    createdAt: new Date()
  }
];

const maintenanceLogs = [
  {
    _id: 'maint_001',
    vehicleId: 'veh_003',
    type: 'Engine Service & Brake Replacement',
    description: 'Routine 200,000km overhaul',
    cost: 48500,
    status: 'in-progress',
    date: new Date(),
    createdAt: new Date()
  }
];

module.exports = {
  depots,
  users,
  drivers,
  vehicles,
  requests,
  routes,
  schedules,
  fuelLogs,
  maintenanceLogs
};

