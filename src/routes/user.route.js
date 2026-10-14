import { Router } from "express";
import { loginUser, registerUser, logOut, refreshTokenAccess, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {jwtVerify} from "../middlewares/jwtVerify.middleware.js";


const router = Router();


//register user
router.route("/register").post(
    upload.fields([
    {
        name: "avatar",
        maxCount: 1
 },
 {
    name: "coverImage",
    maxCount: 1
 }]),
 registerUser);

 //login user
 router.route("/login").post(loginUser);

 //secure:
 // Logout user
 router.route("/logout").post(jwtVerify, logOut);
router.route("/refresh-token").post(refreshTokenAccess);
router.route("/change-password").post(jwtVerify, changeCurrentPassword);
router.route("/current-user").get(jwtVerify, getCurrentUser);
router.route("/update-account").patch(jwtVerify, updateAccountDetails);
router.route("/avatar").patch(jwtVerify, upload.single("avatar"), updateAvatar);
router.route("/coverImage").patch(jwtVerify, upload.single("coverImage"), updateCoverImage);

router.route("/c/:userName").get(jwtVerify, getUserChannelProfile);
router.route("/watchHistory").get(jwtVerify, getWatchHistory);


export default router;