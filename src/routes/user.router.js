import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  UpdateAccountDetails,
  updateUserAvatar,
  updatUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), //inject middlewares
  registerUser
);
router.route("/login").post(loginUser);

//secured Routes

router.route("/logout").post(verifyJWT, logoutUser); //INJECTED MIDDLEWARES
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/Update-account").patch(verifyJWT, UpdateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updatUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default router;
