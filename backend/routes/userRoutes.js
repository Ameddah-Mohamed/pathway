import express from "express";
import {getRoadmap, getResources, testRoadmap, generateQuiz } from "../controllers/user.controller.js";
import protectRoute from "../middleware/protectRoute.js";
const router = express.Router();


router.get("/roadmap", protectRoute, getRoadmap); // get the  roadmap from the ai for the user.
router.get("/resources", protectRoute, getResources); // get resources for the user to learn from.
router.get("/getRoadmap", protectRoute, testRoadmap); //get a certain user roadmap
router.get("/quiz", protectRoute, generateQuiz); //generate a quiz for a certain topic.
export default router;