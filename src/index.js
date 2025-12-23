// require('dotenv').config({path: './.env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path: './.env'
})

connectDB()









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