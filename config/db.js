const mongoose = require('mongoose');
const User = require('../models/User'); // Import the User model

const MONGO_URI = "mongodb+srv://nadeemji:9120298775@cluster0.xrj1qki.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    try {
        // Connect to MongoDB
     await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected Successfully');
        // Create the empty User collection
        await User.createCollection();
        console.log('User collection created successfully');
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1); // Exit the process with failure
    }
};

// connectDB();

module.exports = connectDB;
 