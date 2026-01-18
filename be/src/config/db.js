const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        return;
    }
};

export default connectDB;