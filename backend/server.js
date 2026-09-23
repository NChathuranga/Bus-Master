require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/depots', require('./routes/depotRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/fuel-logs', require('./routes/fuelRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));


app.get('/', (req, res) => {
  res.send('Bus Management System API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
