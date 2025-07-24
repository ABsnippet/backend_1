import ApiError from "../utils/ApiError.js"
import {asynchandler} from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asynchandler(async(req,res,
    next)=>{
      try {
        const token =   req.cookies?.accessToken || req.header
          ("Authorizatiion")?.replace("Bearer","")
  
          if(!token){
              throw new ApiError(401,"unauthorized Request")
          }
          const DecodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  
          const user=await User.findById(DecodedToken?._id).select
          ("-password","-refreshtoken")
          
  
          if(!user){
              throw new ApiError(401,"Invalid access token")
  
  
              req.user()=user;
              next()
      }
     } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Access Token")
      }
        }
    )
