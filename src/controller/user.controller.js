
import { asynchandler } from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { use } from "react";
import mongoose from "mongoose";



const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Smthng Went wrong while generating refresh and access token ")
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

const loginUser = asynchandler(async (req, res) => {
    // req body -> data
    // username or email 
    // find the user
    // password check 
    // access and refresh token
    // send cookies

    const { email, username, password } = req.body
    console.log(email)

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User do not exist")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
        throw new ApiError(401, "password invalid user credentials")
    }

    const { accessToken, refreshToken } = await
        generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshtoken").lean()

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged Inn Successfully"
            )
        )


})

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndDelete(
        req.user._id,
        {
            $set: {
                refreshtoken: undefined
            },

        }, {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out Successfully"))
})


const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRequestToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRequestToken) {
        throw new ApiError(401, "Unauthorized Request ")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRequestToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incomingRequestToken !== user?.refreshToken) {
            throw new ApiError(401, " Refresh Token is expired")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessandRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, newRefreshToken },
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refres Token")
    }



})

const changeCurrentPassword = asynchandler(async (req, res) => {

    const { oldPassword, NewPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = NewPassword
    await user.save({ validateBeforeSave: false })


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"))


})


const getCurrentUser = asynchandler(async (req, res) => {

    return res
        .status(200)
        .json(200, req.user, "Current User fetched successfully")

})


const UpdateAccountDetails = asynchandler(async (req, res) => {

    const { fullName, email } = req.body


    if (!fullName || !email) {
        throw new ApiError(400, "All fields Are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true }

    ).select("--password")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated Successfully"))

})


const updateUserAvatar = asynchandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary
        (avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findById(req.user?._id
        ,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Avatar  Updated Successfully")
        )

})

const updatUserCoverImage = asynchandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary
        (coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover Image")
    }

    const user = await User.findById(req.user?._id
        ,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Cover Image Updated Successfully")
        )
})


const getUserChannelProfile = asynchandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {

            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }

            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }

    ])

    console.log(channel);
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User Channel fetched successfully")
        )



})

const getWatchHistory = asynchandler(async(req,res)=>{
    const user =await User.aggregate([
        {
            $match :{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField : "watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]

            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user[0].watchHistory,
            "WatchHistory fetched Successfully"
        )
    )
})




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updatUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
