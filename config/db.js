import mongoose from "mongoose";

const connectDB = async () =>{
    try {
    mongoose.connect(process.env.MONGO_URI)
        console.log('connect to database')
    } catch (error) {
        console.log('fail to connect to database', error.message)
        process.exit(1)
    }
}

export default connectDB