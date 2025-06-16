const mongoose = require('mongoose');
const User = require('../models/User'); // Import the User model
require('dotenv').config(); // 👈 Load .env variables

const connectDB = async () => {
    try {
        // 👇 Get Mongo URI from .env
        const MONGO_URI = process.env.MONGODB_URI;

        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected Successfully');

        // Optional: create collection
        await User.createCollection();
        console.log('User collection created successfully');
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
