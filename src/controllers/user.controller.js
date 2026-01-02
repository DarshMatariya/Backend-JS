import { jwt } from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessandRefreshToken = async(userid) => {
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}

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


const loginUser = asyncHandler( async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and referesh token
    // send cookie


    // 1. req body -> data
    const {email, username, password} = req.body
    // console.log(email);


    // 2. username or email
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }


    // 3. find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exists")
    }


    // 4. password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }


    // 5. access and referesh token
    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            }, 
            "User logged In successfully !"
        )
    )  
} )


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = generateAccessandRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json((
        new ApiResponse(200, {}, "Password changed successfully" )
    ))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccoutDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                fullName: fullName, 
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Accout details updated successfully"))

});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const newAvatarImageLocalPath = await User.findById(req.file?.path)

    if (!newAvatarImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const newAvatarImage = await uploadOnCloudinary(newAvatarImageLocalPath)

    if(!newAvatarImage.url){
        throw new ApiError(400, "Error while uploading avatar image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar : newAvatarImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.
    status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )

});


const updateUserCoverImage = asyncHandler(async(req, res) => {
    const newCoverImageLocalPath = await User.findById(req.file?.path)

    if (!newCoverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }

    const newCoverImage = await uploadOnCloudinary(newCoverImageLocalPath)

    if(!newCoverImage.url){
        throw new ApiError(400, "Error while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage : newCoverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.
    status(200)
    .json(
        new ApiResponse(200, user, "coverImage updated successfully")
    )

});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccoutDetails,
    updateUserAvatar,
    updateUserCoverImage
}