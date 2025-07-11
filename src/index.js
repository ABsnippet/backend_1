// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path : './.env'
})

connectDB() 






/*
import express from "express";
const app = express()

1st approach//ifee used ()()

( async ()=>{
   try {
   await mongoose.connect(`${process.env.MONGODB_URL}/${Db_Name}`)
   app.on("error",(error)=>{
    console.log("ERRROR :",error)
    throw error
   })

   app.listen(process.env.PORT, ()=>{
    console.log(`APP is listening on port ${PORT}`);
    
   })
   } catch (error) {
    console.error("ERROR :" ,error)
    throw err
   }
})()

*/