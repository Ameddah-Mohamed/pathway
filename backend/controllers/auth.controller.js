import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../lib/utils/generateToken.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from "cloudinary";

export const signup = async (req, res) => {
    try {
        const { username, fullName, email, password, skills, goal, profileImg, isAdmin } = req.body; // Add isAdmin
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Email Validation
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "ERROR: Invalid Email." });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: "ERROR: Username or Email Already Exists." });
        }

        // Password Validation
        if (password.length < 6) {
            return res.status(400).json({ error: "ERROR: Password must be at least 6 characters." });
        }

        // Profile Image Validation (Must be provided)
        if (!profileImg) {
            return res.status(400).json({ error: "ERROR: Profile image is required." });
        }

        // Upload profile image to Cloudinary
        const uploadedResponse = await cloudinary.uploader.upload(profileImg, {
            folder: "456", 
        });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Ensure skills is an array before applying .filter()
        const validSkills = Array.isArray(skills) ? skills.filter(skill => User.schema.path("skills").options.enum.includes(skill)) : [];
        
        // "goal" is now a single value, not an array
        const validGoal = goal && User.schema.path("goal").options.enum.includes(goal) ? goal : null;

        if (!validGoal) {
            return res.status(400).json({ error: "ERROR: Invalid Goal." });
        }

        // Ensure only one admin exists
        if (isAdmin) {
            const existingAdmin = await User.findOne({ isAdmin: true });
            if (existingAdmin) {
                return res.status(400).json({ error: "ERROR: Admin already exists!" });
            }
        }

        // Creating new User
        const newUser = new User({
            username,
            fullName,
            email,
            password: hashedPassword,
            skills: validSkills,
            goal: validGoal, 
            profileImg: uploadedResponse.secure_url, // Store Cloudinary URL
            isAdmin: isAdmin || false // Ensure admin status is saved
        });

        await newUser.save();

        // Generate Token and Set Cookie
        generateTokenAndSetCookie(newUser._id, res);

        // Prepare user data for the external API
        const userData = {
            profileImg: newUser.profileImg,
            username: newUser.username,
            skills: newUser.skills
        };

        // Send the user data to the external API
        const externalApiUrl = "https://gdghack-2.onrender.com/store-skills";
        try {
            const externalResponse = await fetch(externalApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (!externalResponse.ok) {
                console.error("ERROR: Failed to send user data to external API");
            }
        } catch (externalError) {
            console.error("ERROR Sending User Data to External API:", externalError.message);
        }

        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            fullName: newUser.fullName,
            email: newUser.email,
            skills: newUser.skills,
            goal: newUser.goal,
            isAdmin: newUser.isAdmin, 
            profileImg: newUser.profileImg
        });
    } catch (error) {
        console.error("ERROR Signing up:", error.message);
        res.status(500).json({ error });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            skills: user.skills,
            goal: user.goal,
            profileImg: user.profileImg,
            isAdmin: user.isAdmin,
            roadmap: user.roadmap
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = async (req, res) => {
    try {
        if (!req.cookies.jwt) {
            return res.status(400).json({ error: "You are already logged out." });
        }

        res.cookie("jwt", "", { maxAge: 0 });
        return res.status(200).json({ message: "Logged Out Successfully!" });
    } catch (error) {
        console.log("ERROR in Log out Controller", error.message);
        res.status(500).json({ error: "Error Logging out" });
    }
};

//get the current logged in user.
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            skills: user.skills,
            goal: user.goal,
            profileImg: user.profileImg,
            roadmap: user.roadmap
        });
    } catch (error) {
        console.log("ERROR in getMe Controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//get all users.
export const getUsers = async (req, res) => {
    try {
        // Exclude the currently logged-in user and select only _id and skills
        const users = await User.find({ _id: { $ne: req.user._id } }).select("_id skills");

        res.status(200).json(users);
    } catch (error) {
        console.error("ERROR Fetching Users:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//get users who have the same skills as 7bibna the current logged in user. (to connect him/her with them)
export const getSimilarUsers = async (req, res) => {
    try {
        const userId = req.user._id; // Extract user ID from the request (added by protectRoute middleware)

        // Fetch the user from the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "ERROR: User not found." });
        }
        
        // Prepare request data for external API
        const requestData = {
            profileImg: user.profileImg,
            username: user.username,
            skills: user.skills
        };

        // Define external API URL
        const externalApiUrl = "https://gdghack-2.onrender.com/find-similar";

        // Make POST request to the external API
        const externalResponse = await fetch(externalApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        // Check if the request was successful
        if (!externalResponse.ok) {
            throw new Error("Failed to fetch similar users from external API");
        }

        // Parse response JSON
        const similarUsers = await externalResponse.json();

        // Return similar users to the client
        res.status(200).json(similarUsers);
    } catch (error) {
        console.error("ERROR Fetching Similar Users:", error.message);
        res.status(500).json({ error: "ERROR: Internal Server Error" });
    }
};


//comments are not generated with ai :)








