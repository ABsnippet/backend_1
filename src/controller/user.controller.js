import { asynchandler } from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asynchandler( async (req,res)=>{
     //get users details from frontend
     // validation - not empty
     //check if user already exist - username,email
     // check for images,avatar 
     // upload  them to cloudinary, check for avatar
     //create user object - create entry in db calls
     //remove password and refresh token field from response
     //check for user creation
     //return res
const {fullname,email,password,username} = req.body
    console.log("Email:",email);
    
    // if (fullname==="") {
    //     throw new ApiError(400,"Fullname is required")
    // }
    if (
        [fullname,email,username,password].some((field)=>
        field.trim()==="")
    ) {
        throw new ApiError(400,"All fields are required")
    }
    if (email.includes("@")) {
        return 
    } else {
        throw new ApiError(400,"email missing @")
    }

   const existed_user= User.findOne({
        $or:[{ email },{ username }]
    })

    if (existed_user) {
        throw new ApiError(409,"User with username or email already exists")
    }
    const avatarLocalPath= req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    console.log(coverImageLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400,"Avaatar file is required!!")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    const user=await User.create({
        fullname,
        avatar : avatar.url,
        coverImage:coverImage.url || "",
        email,
        password,
        username : username.tolowercase( )

    })
   const createduser= await User.findById(user._id).select(
    "-password -refreshtoken"
   )
    if (!createduser) {
        throw new ApiError(500,"Smthng went wrong while registering a user")
    }
    
    return res.status(201).json(
        new ApiResponse(200,createduser,"User Registered Successfully")
    )


})

export {registerUser};