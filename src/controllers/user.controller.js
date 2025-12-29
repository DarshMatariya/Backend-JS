import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler( async (req, res) => {
    // steps to create user

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    

    // 1. get user details from frontend
    const {fullName, username, email, password, } = req.body
    // console.log("email: ", email);

    // if(fullName === ""){
    //     throw new ApiError(400, "FULLNAME IS REQUIRED!")
    // }

    // 2.validation - not empty
    // For all fiels combined - validation
    if([fullName, username, email, password].some( (field) => field?.trim() === "" )){
        throw new ApiError(400, "All field are required !")
    }

    // 3. check if user already exists: username, email
    // if user exists
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists!")
    }

    // 4. check for images, check for avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // console.log("AVATAR PATH:", avatarLocalPath);

    // console.log("BODY:", req.body);
    // console.log("FILES:", req.files);

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Image is required !")
    }

    // 5. upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // console.log('Avatar: ', avatar);
    
    if (!avatar) {
        throw new ApiError(400, "Avatar Image is required !")
    }

    // 6. create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    // 7. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8. check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd successfully")
    )

})



export {registerUser}