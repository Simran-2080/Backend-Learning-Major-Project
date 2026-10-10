import { Router } from "express";
import { loginUser, registerUser, logOut } from "../controllers/user.controller.js";
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


export default router;