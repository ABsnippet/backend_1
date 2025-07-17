// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import app from './app.js';
import connectDB from "./db/index.js";

dotenv.config({
    path : './.env'
})
app.on("error",(error)=>{
    console.log("ERRROR :",error)
    throw error
   }), 
connectDB() 
.then(
   ()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server loading at port ${process.env.PORT}`);
    })

})
.catch((err)=>{
    console.log("MONGODB  CONNECTION FAILED !!! : ",err);
})





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