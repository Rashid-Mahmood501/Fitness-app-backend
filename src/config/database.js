const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://Fitness-app:raza.dev@fitness-app.yat6emt.mongodb.net/?retryWrites=true&w=majority&appName=Fitness-App');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
};

module.exports = connectDB; 