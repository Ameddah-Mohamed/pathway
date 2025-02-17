import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../lib/utils/generateToken.js";
import {v2 as cloudinary} from "cloudinary";


// Function to fetch suggested users (users that have the same skills as the current logged in user)
//implemented with ----- AI -----


export const getRoadmap = async (req, res) => {
    try {
        if (!req.user?.id) return res.status(401).json({ message: "Unauthorized: User ID missing" });

        const currentUser = await User.findById(req.user.id).select("skills goal roadmap");
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        const payload = { skills: currentUser.skills, career_path: currentUser.goal };
        const response = await fetch("https://gdghack-2.onrender.com/get-roadmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) return res.status(response.status).json({ error: "Python API Error", details: await response.json() });

        const roadmapData = await response.json();
        if (typeof roadmapData !== "object" || !roadmapData.roadmap) {
            return res.status(500).json({ message: "Invalid roadmap format received" });
        }

        const roadmapObject = roadmapData.roadmap; // Extract the roadmap object

        // Convert roadmapObject to a Map<string, string[]> that only includes valid string arrays
        const roadmapMap = new Map();
        for (const key in roadmapObject) {
            if (Array.isArray(roadmapObject[key])) {
                // Extract only string values from the array
                const filteredArray = roadmapObject[key]
                    .filter(item => typeof item === "string"); 

                roadmapMap.set(key, filteredArray);
            } else {
                console.warn(`Invalid data for key "${key}": Expected an array, got ${typeof roadmapObject[key]}`);
            }
        }

        // Assign sanitized Map to currentUser.roadmap
        currentUser.roadmap = roadmapMap;
        await currentUser.save();

        res.json(Object.fromEntries(roadmapMap)); // Convert Map back to object for response
    } catch (error) {
        console.error("Error fetching/storing user roadmap:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//get resources for the user to learn from.
export const getResources = async (req, res) => {
    try {
        // Extract field from query parameters
        const { field } = req.body;

        if (!field) {
            return res.status(400).json({ error: "ERROR: 'field' parameter is required." });
        }

        // Define the external API endpoint
        const externalApiUrl = "https://gdghack-2.onrender.com/get-field-details"; 

        // Prepare request payload
        const payload = { field };

        // Send POST request to the external API
        const response = await fetch(externalApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        // Handle API response
        if (!response.ok) {
            throw new Error(`External API Error: ${response.status} - ${await response.text()}`);
        }

        const responseData = await response.json();

        // Return the response from the external API to the frontend
        res.status(200).json(responseData);
    } catch (error) {
        console.error("ERROR in sendField:", error.message);
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
};

// get a certain
export const testRoadmap = async (req, res) => {
    try {
        // Fetch the current user's roadmap from the database
        const currentUser = await User.findById(req.user.id).select("roadmap");

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user's roadmap
        res.json(currentUser.roadmap);
    } catch (error) {
        console.error("Error fetching user roadmap:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const generateQuiz = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ message: "Topic is required" });

        // Randomly select difficulty: easy, medium, or hard
        const difficulties = ["easy", "medium", "hard"];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

        // Prepare request payload
        const payload = { topic, difficulty };

        // Send request to Python API
        const response = await fetch("https://gdghack-2.onrender.com/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Python API Error", details: await response.json() });
        }

        const quizData = await response.json();

        res.json({ quiz: quizData });
    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};






