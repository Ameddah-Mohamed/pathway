import express from "express";
import { signup, login, logout, getMe, getUsers, getSimilarUsers} from "../controllers/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";
const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe); // gets the current logged in user.

router.get("/all", protectRoute, getUsers); // gets all users except the current logged in user.
router.get("/similar-users", protectRoute, getSimilarUsers); //get users who have the same skills as the current logged in user. (to connect him/her with them)




export default router;