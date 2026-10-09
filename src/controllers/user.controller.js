import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res)=>{

    // 1. get user details from frontend
    // 2. validate-> not empty
    // 3. check if user already exist: username, email
    // 4. check for imaged, check for avatar
    // 5. upload them to cloudinary, avatar
    // 6. create user object -- create entry in db
    // 7. remove password and refresh token field from response
    // 8. check for creation
    // 9. return res

    const {userName, fullName, password, email} = req.body;
    // console.log("email: ", email); Check if data is reaching successfully

    if([userName, fullName, password, email].some((field)=>{
        return field?.trim === "";
    })) {
        throw new ApiError(400, "All fields are required!");
    }

    const existedUser = await User.findOne({
        $or : [{userName}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "user already exist!!")
    }

    console.log(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path; //array of avatar and we want its first element
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
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

    const createdUSer = await User.findById(user._id).select( " -password -refreshToken ")

    if(!createdUSer){
        throw new ApiError(500, "something went while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUSer, "User registered successfully!")
    )
}
);

export { registerUser }

