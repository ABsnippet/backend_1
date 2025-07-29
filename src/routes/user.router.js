import { Router } from "express";
import{loginUser,logoutUser, registerUser,refreshAccessToken} from "../controller/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount :1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),//inject middlewares
    registerUser);
router.route("/login").post(loginUser)

//secured Routes

router.route("/logout").post(verifyJWT,logoutUser)//INJECTED MIDDLEWARES


router.route("/refresh-token").post(refreshAccessToken)

export default router;