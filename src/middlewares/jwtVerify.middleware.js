import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";


export const jwtVerify = async(req, res, next)=>{

    const refreshToken = req.cookies?.refreshToken;

    if(!refreshToken){
        throw new ApiError(401, "You do not have token");
    }

    const decodedUser = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById( decodedUser._id );

    if(!user){
        throw new ApiError(401, "unathorized access ");
    }

    req.user = user;
    next()
}