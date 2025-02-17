import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { postHackathon } from "../controllers/hackathon.controller.js";
import { getSuggestedHackathons } from "../controllers/hackathon.controller.js";

const router = express.Router();

router.post("/create", protectRoute, postHackathon);
router.get("/user-hackathons", protectRoute, getSuggestedHackathons);





export default router;