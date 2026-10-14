import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

//Create and accessToken and refreshToken
const createAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500, "Something went wrong while genereting refresh and access Token")
    }
}


//const register
const registerUser = asyncHandler(async (req, res) => {

    // 1. get user details from frontend
    // 2. validate-> not empty
    // 3. check if user already exist: username, email
    // 4. check for imaged, check for avatar
    // 5. upload them to cloudinary, avatar
    // 6. create user object -- create entry in db
    // 7. remove password and refresh token field from response
    // 8. check for creation
    // 9. return res

    const { userName, fullName, password, email } = req.body;
    // console.log("email: ", email); Check if data is reaching successfully

    if ([userName, fullName, password, email].some((field) => {
        return field?.trim === "";
    })) {
        throw new ApiError(400, "All fields are required!");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user already exist!!")
    }

    console.log(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path; //array of avatar and we want its first element
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        userName: userName.toLowerCase(),
        email,
        password
    })

    const createdUSer = await User.findById(user._id).select(" -password -refreshToken ")

    if (!createdUSer) {
        throw new ApiError(500, "something went while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUSer, "User registered successfully!")
    )
}
);


//Login

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    if (!(userName || email)) {
        throw new ApiError(400, "userName or email is required");
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "invalid userName or email")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "invalid password")
    }

    const {refreshToken, accessToken} = await createAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken")
    

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
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )

})


//logged out
const logOut = async(req, res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //This removes the field from the document
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
}


//refresh Token Access
const refreshTokenAccess = asyncHandler( async(req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized access");
    }

try {
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    
        const user = await User.findById(decodedToken._id);
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        const {accessToken, newRefreshToken} = generateAccessToken(decodedToken._id);
    
        res.status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken, refreshToken: newRefreshToken
            },
            "Access token refreshed"
        )
        )
    
} catch (error) {
    throw new ApiError(401, "unathorized Access", error.message)
}
})

const changeCurrentPassword = asyncHandler(async (req, res)=>{

    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(400, {}, "Wrong current password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200)
    .json(
        new ApiResponse(200, {}, "password changed successfully")
    )
})


const getCurrentUser = asyncHandler(async(req, res) =>{
    return res.
    status(200)
    .json(
        new ApiResponse(200, req.user, "User detail fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required while updating the user Details")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName: fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    await updatedUser.save({validateBeforeSave : false})

    return res.
    status(200)
    .json(
        new ApiResponse(200, updatedUser, "user details Updated")
    )
})

const updateAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file;
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required")
    }

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);

    if(!avatarResponse?.url){
        throw new ApiError(400, "something went wrong while updating avatar images on cloudinary")
    }

    const updatedUser =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatarResponse.url
            }
        },
        {
            new : true
        }
    )

    updatedUser.save({validateBeforeSave: false})
   
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Avatar Image updated Successfully")
    )
})

const updateCoverImage= asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file;
    if(!coverImageLocalPath){
        throw new ApiError(400, "avatar file is required")
    }

    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImageResponse?.url){
        throw new ApiError(400, "something went wrong while updating cover image on cloudinary")
    }

    const updatedUser =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImageResponse.url
            }
        },
        {
            new : true
        }
    )

    updatedUser.save({validateBeforeSave: false})
   
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Cover Image updated Successfully")
    )
})


const getUserChannelProfile = asyncHandler(async(req, res)=>{

    const {username} = req.params

    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if:{
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }    
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0],"user channel fetched successfully" )
    )
    
})

const getWatchHistory = asyncHandler(async(req, res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        userName: 1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logOut,
    refreshTokenAccess,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

