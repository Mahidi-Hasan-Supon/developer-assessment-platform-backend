import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";



const router = Router() 

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/getMe", auth(UserRole.ADMIN,UserRole.CANDIDATE,UserRole.COMPANY),authController.getMe);
router.post("/refresh-token", authController.refreshToken);

export const authRouter = router


