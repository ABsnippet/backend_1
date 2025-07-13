import mongoose from "mongoose";

import { Db_Name } from "../constants.js";



const connectDB = async()=>{
    try {
        const connectioninstance = await mongoose.connect(`${process.env.MONGODB_URL}/${Db_Name}`)
        // console.log(connectioninstance);
        console.log(`\n MongoDb connected !! DB host : ${connectioninstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection failed",error);
        process.exit(1)
        
    }
}

export default  connectDB;