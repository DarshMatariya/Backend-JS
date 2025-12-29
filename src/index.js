import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

cloudinary.api.ping()
  .then(() => console.log("Cloudinary connected"))
  .catch(err => console.error("Cloudinary auth failed:", err.message));

import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT || 8000}`);
        
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})









/*
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on ${process.env.PORT}`);
            
        })

    } catch (error) {
        console.log("ERROR: ", error);
        throw error;
    }
} )()
*/