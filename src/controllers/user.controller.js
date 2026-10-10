import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
            refreshToken: undefined
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

export {
    registerUser,
    loginUser,
    logOut
}

