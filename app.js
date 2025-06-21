// const express = require('express');
// const connectDB = require('./config/db');
// const session = require('express-session');
// const MongoStore = require('connect-mongo'); // 👈 new line
// require('dotenv').config(); // 👈 for .env usage

// // Connect to MongoDB
// connectDB();

// const app = express();
// app.use(express.json()); // Middleware to parse JSON

// // 🛡 Use MongoDB as session store
// app.use(
//   session({
//     secret: 'supersecretkey', // move to .env for safety
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGODB_URI, // from .env
//       collectionName: 'sessions',
//     }),
//     cookie: {
//       secure: false, // true if using HTTPS in production
//       maxAge: 1000 * 60 * 60, // 1 hour
//     },
//   })
// );

// // Routes
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

// // Start Server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));







const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Route Files
const authRoutes = require('./routes/authRoutes');
const earningRoutes = require('./routes/earningRoute');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/earn', earningRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Server mein kuch gadbad hai'
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chalu ho gaya port ${PORT} pe`);
  console.log('Available Routes:');
  console.log('- Authentication: /api/auth');
  console.log('- Earning System: /api/earn');
});