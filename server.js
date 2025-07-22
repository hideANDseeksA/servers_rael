

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require("http");
const helmet = require('helmet');
 const path = require('path');

const registrationRoutes = require('./routes/Registration');
const authRoutes = require('./routes/authRoutes');
const pingRoutes = require('./routes/ping');
const schoolRoutes = require('./routes/schools');
const eventsRoutes = require('./routes/events');
const attendanceRoutes = require('./routes/attendance');
const Is = require('./routes/Is');
const certificatesRoutes = require('./routes/certificatesRoutes');

 
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);



app.set('trust proxy', 1);



// 🌍 Express CORS Setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));


// 🔒 Security Middleware
app.use(express.json());
app.use(helmet());
app.disable('x-powered-by');


// 🔑 API Key Middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// 📦 Routes
app.use('/api/registration',authenticate,  registrationRoutes);
app.use('/api/auth', authenticate, authRoutes);
app.use('/api/schools',authenticate, schoolRoutes);
app.use('/api/server',pingRoutes);
app.use('/api/events', authenticate,eventsRoutes);
app.use('/api/attendance',authenticate, attendanceRoutes);
app.use('/api/IS',authenticate,Is);
app.use('/api/certificates', certificatesRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🚀 Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

