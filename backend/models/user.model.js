import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },

    fullName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    profileImg: {
        type: String,
        required: true // Profile image is now required
    },
    
    skills: {
        type: [String], // Array of strings
        enum: [
            "Linear Algebra",
            "Statistics",
            "Oop",
            "Dsa",
            "Os",
            "Version Control",
            "System Design",
            "UI/UX",
            "Networking Fundamentals",
            "Fundamental Database",
            "Scripting",
            "Python",
            "JavaScript",
            "Java",
            "SQL",
            "Bash/Shell Scripting",
            "Discrete Mathematics",
            "Computer Architecture",
            "Problem-Solving",
            "Cli"
        ],
        required: true
    },

    goal: {
        type: String,
        enum: [
            "Cloud Computing",
            "Cybersecurity",
            "Programming and Scripting",
            "Data Science",
            "DevOps",
            "Artificial Intelligence",
            "Networking",
            "Database Management",
            "IT Project Management",
            "Web Development",
            "Software Engineering",
            "Blockchain Technology",
            "Game Development",
            "Embedded Systems",
            "Robotics"
        ],
        required: true, // Goal is required
        validate: {
            validator: function (goal) {
                return goal !== undefined && goal !== null; // Ensure goal is not empty
            },
            message: "A goal must be selected."
        }
    },
    
    roadmap: {
        type: Map,
        of: [String],  // Each key is a learning topic, and its value is an array of connected topics/tools/resources.
        default: {} 
    },

    isAdmin: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

// Creating the model.
const User = mongoose.model("User", userSchema);

// Exporting the User model for use in other files.
export default User;
