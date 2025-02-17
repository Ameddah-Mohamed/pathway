import Hackathon from "../models/hackathon.model.js"; // Import the Hackathon model
import User from "../models/user.model.js"; // Import the User model

export const postHackathon = async (req, res) => {
    try {
        const { name, club, skills_required, level, startDate, endDate } = req.body;
        const userId = req.user._id; // Extract user ID from the request (added by protectRoute middleware)

        // Fetch the user from the database
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "ERROR: User not found." });

        // Check if the user is an admin
        if (!user.isAdmin) {
            return res.status(403).json({ error: "ERROR: Only admins can create hackathons." });
        }

        // Validate level
        const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
        if (!validLevels.includes(level)) {
            return res.status(400).json({ error: "ERROR: Invalid level. Choose from 'Beginner', 'Intermediate', or 'Advanced'." });
        }

        // Validate skills
        const validSkills = Hackathon.schema.path("skills_required").options.enum; // Get allowed skills
        const filteredSkills = Array.isArray(skills_required)
            ? skills_required.filter(skill => validSkills.includes(skill))
            : [];

        if (filteredSkills.length !== skills_required.length) {
            return res.status(400).json({
                error: "ERROR: Some skills are invalid. Allowed skills: " + validSkills.join(", ")
            });
        }
        

        // Function to parse dates (Supports both "dd/mm/yyyy" & ISO formats)
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes("/")) {
                const [day, month, year] = dateStr.split("/").map(Number);
                return new Date(year, month - 1, day); // Month is 0-based in JavaScript Dates
            }
            return new Date(dateStr); // Handles ISO format
        };

        const formattedStartDate = parseDate(startDate);
        const formattedEndDate = parseDate(endDate);

        if (isNaN(formattedStartDate) || isNaN(formattedEndDate)) {
            return res.status(400).json({ error: "ERROR: Invalid date format. Use 'dd/mm/yyyy' or ISO 8601 format." });
        }

        // Ensure startDate is before endDate
        if (formattedStartDate >= formattedEndDate) {
            return res.status(400).json({ error: "ERROR: Start date must be before end date." });
        }

        // Create the hackathon
        const newHackathon = new Hackathon({
            name,
            club,
            skills_required: filteredSkills,
            level,
            startDate: formattedStartDate,
            endDate: formattedEndDate
        });

        await newHackathon.save();

        // Prepare the payload for the external API
        const hackathonData = {
            name,
            required_skills: filteredSkills,
        };

        // Send the created hackathon to the external API
        const externalApiUrl = "https://gdghack-2.onrender.com/add-hackathon";
        try {
            const externalResponse = await fetch(externalApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(hackathonData)
            });

            if (!externalResponse.ok) {
                console.error("ERROR: Failed to send hackathon to external API");
            }
        } catch (externalError) {
            console.error("ERROR Sending Hackathon to External API:", externalError.message);
        }

        res.status(201).json(newHackathon);
    } catch (error) {
        console.error("ERROR Creating Hackathon:", error.message);
        res.status(500).json({ error: "ERROR: Internal Server Error" });
    }
};

export const getSuggestedHackathons = async (req, res) => {
    try {
        // Fetch the current user
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }


        const payload = { username: currentUser.username, skills: currentUser.skills };


        const pythonApiUrl = "https://gdghack-2.onrender.com/find-hackathons"; 

        // Send request to Python API
        const response = await fetch(pythonApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        // Handle response
        if (!response.ok) {
            throw new Error("Failed to fetch suggested hackathons from Python API");
        }

        const suggestedHackathons = await response.json();

        // Send the suggested hackathons back to the frontend
        res.status(200).json(suggestedHackathons);
    } catch (error) {
        console.error("Error fetching suggested hackathons:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

