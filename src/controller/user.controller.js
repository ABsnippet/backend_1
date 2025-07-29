// import { asynchandler } from "../utils/asynchandler.js";
// import ApiError from "../utils/ApiError.js";
// import {User} from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/Cloudinary.js";
// import { ApiResponse } from "../utils/ApiResponse.js";



// const registerUser = asynchandler( async (req,res)=>{
//      //get users details from frontend
//      // validation - not empty
//      //check if user already exist - username,email
//      // check for images,avatar 
//      // upload  them to cloudinary, check for avatar
//      //create user object - create entry in db calls
//      //remove password and refresh token field from response
//      //check for user creation
//      //return res
// const {fullName,email,password,username} = req.body
//     console.log("Email:",email);
    
//     if (fullname==="") {
//         throw new ApiError(400,"Fullname is required")
//     }
//     if (
//         [fullName,email,username,password].some((field)=>
//         field.trim()==="")
//     ) {
//         throw new ApiError(400,"All fields are required")
//     }
//     if (email.includes("@")) {
//         return 
//     } else {
//         throw new ApiError(400,"email missing @")
//     }

//    const existed_user= await User.findOne({
//         $or:[{ email },{ username }]
//     })

//     if (existed_user) {
//         throw new ApiError(409,"User with username or email already exists")
//     }
//     const avatarLocalPath= req.files?.avatar[0]?.path;
//     console.log(avatarLocalPath);
//     const coverImageLocalPath=req.files?.coverImage[0]?.path;
//     console.log(coverImageLocalPath);

//     if(!avatarLocalPath){
//         throw new ApiError(400,"Avaatar file is required!!")
//     }
//     const avatar= await uploadOnCloudinary(avatarLocalPath);
//     const coverImage= await uploadOnCloudinary(coverImageLocalPath);
//     if (!avatar) {
//         throw new ApiError(400,"Avatar file is required")
//     }

//     const user=await User.create({
//         fullName,
//         avatar : avatar.url,
//         coverImage:coverImage.url || "",
//         email,
//         password,
//         username : username.tolowercase( )

//     })
//    const createduser= await User.findById(user._id).select(
//     "-password -refreshtoken"
//    )
//     if (!createduser) {
//         throw new ApiError(500,"Smthng went wrong while registering a user")
//     }
    
//     return res.status(201).json(
//         new ApiResponse(200,createduser,"User Registered Successfully")
//     )


// })

// export {registerUser};


























import { asynchandler } from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const generateAccessandRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken = refreshToken;
       await user.save({validateBeforeSave : false})

       return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Smthng Went wrong while generating refresh and access token ")
    }
}



const registerUser = asynchandler(async (req, res) => {
    // 1. Get user details from the request body
    const { fullName, email, username, password } = req.body;
    console.log(req.body);

    // 2. Validate that required fields are not empty
    if ([fullName, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check if user with the same email or username already exists
    const existingUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists"); // 409 Conflict
    }
    console.log(req.files);
    // 4. Handle file uploads (avatar and optional cover image)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
        // This check is important if the upload fails
        throw new ApiError(500, "Error uploading avatar, please try again");
    }

    // Handle optional cover image
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        // We don't throw an error if cover image fails, as it's optional
    }

    // 5. Create the user object and save to the database
    // IMPORTANT: The password is being saved in plaintext. It MUST be hashed before saving.
    // This is typically done in a pre-save hook in your Mongoose model.
    // Example in user.model.js:
  
    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        password, // The model's pre-save hook should handle hashing
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "" // Use optional chaining to prevent errors
    });

    // 6. Retrieve the created user without the password and refresh token
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 7. Return a success response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

const loginUser = asynchandler(async(req,res)=>{
    // req body -> data
    // username or email 
    // find the user
    // password check 
    // access and refresh token
    // send cookies

    const {email,username,password} = req.body
    console.log(email)

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User do not exist")
    }

    const isPasswordvalid= await user.isPasswordCorrect(password)

    if(!isPasswordvalid){
        throw new ApiError(401,"password invalid user credentials")
    }

    const {accessToken,refreshToken}=await 
    generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshtoken").lean()

    const options = {
        httpOnly : true,
        secure : true
    }

     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user : loggedInUser,accessToken,refreshToken
            },
            "User Logged Inn Successfully"
        )
    )   
    

})

const logoutUser = asynchandler(async(req,res)=>{
    await User.findByIdAndDelete(
        req.user._id,
        {
            $set:{
                refreshtoken : undefined
            },
           
        },{
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out Successfully"))
})


const refreshAccessToken = asynchandler(async(req,res)=>{
    const incomingRequestToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRequestToken){
        throw new ApiError(401,"Unauthorized Request ")
    }
    
    try {
        const decodedToken=jwt.verify(
           incomingRequestToken ,
           process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        
        if(incomingRequestToken !== user?.refreshToken)
        {
           throw new ApiError(401," Refresh Token is expired")
    
        }
    
        const options ={
            httpOnly : true,
            secure: true
        }
    
         const {accessToken,newRefreshToken} =   await generateAccessandRefreshTokens(user._id)
    
            return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken,newRefreshToken},
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refres Token")
    }



})




export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };