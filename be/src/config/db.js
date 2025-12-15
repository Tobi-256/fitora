import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI )
        console.log(`Connection successful`);
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }
}
export default connectDB;