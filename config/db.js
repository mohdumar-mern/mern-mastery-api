import mongoose from "mongoose";
import Course from '../models/courseModel.js';


const connectDB = async () =>{
    try {
    mongoose.connect(process.env.MONGODB_URI)
        console.log('connect to database')
    } catch (error) {
        console.log('fail to connect to database', error.message)
        process.exit(1)
    }
}

export default connectDB
