import mongoose from "mongoose";

export const connectDB = async() => {
    try {
        const connect = await mongoose.connect('mongodb://localhost:27017/popup_builder');
        console.log(`MongoDb connected: ${connect}`);
    } catch (error) {
        console.log(error);
    }
}

