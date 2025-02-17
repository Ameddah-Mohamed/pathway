import express from "express";
import connectMongoDB from "./db/connection.js";
import cookieParser from "cookie-parser";
import cors from "cors";

//routes imports.
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import hackathonRoutes from "./routes/hackathonRoutes.js";

//to use the process
import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


//app instance
const app = express();
const PORT = process.env.PORT;


//_: middlewares
app.use(express.json({ limit: "10mb" })); // note: For Parsing req.body when it's sent as raw json
app.use(express.urlencoded({ limit: "10mb", extended: true })); // note: For Parsing req.body when it's sent as x-www-form-urlencoded
app.use(cookieParser());




app.use(
    cors({
      origin: true,  // ⬅️ Allows requests from any origin
      credentials: true, // ⬅️ Allows cookies & authentication headers
    })
  );
  

//Routing
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/hackathon', hackathonRoutes);

app.listen(PORT, () => {
    console.log("server is running ...");
    //connecting to the database.
    connectMongoDB();
})

