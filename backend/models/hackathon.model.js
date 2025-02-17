import mongoose from "mongoose";

const HackathonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    club: {
        type: String,
        required: true
    },
    skills_required: {
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
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Format date when converting to JSON
HackathonSchema.methods.toJSON = function () {
    const hackathon = this.toObject();
    
    // Format startDate & endDate as dd/mm/yyyy
    hackathon.startDate = hackathon.startDate.toLocaleDateString("en-GB"); 
    hackathon.endDate = hackathon.endDate.toLocaleDateString("en-GB");

    return hackathon;
};

const Hackathon = mongoose.model('Hackathon', HackathonSchema);
export default Hackathon;
