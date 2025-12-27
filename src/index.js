// require('dotenv').config({path: './.env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

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