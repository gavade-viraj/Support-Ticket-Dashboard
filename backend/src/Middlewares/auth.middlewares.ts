import asyncHandlers from "../Utils/utils.js";
import { supabaseClient } from "../DB/ConnectDB.js";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { CustomApiError } from "../Utils/utils.js";


const verifyJwt = asyncHandlers(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        // Extract token from cookies or Authorization header
        const token = req.cookies?.AccessToken || req.header('Authorization')?.replace('Bearer ','')
        // Redirect to signup if no token found
        if(!token){
           return res.status(401).json({message:"Unauthorized"})
        }

        // Verify token and decode user ID
        const decodeToken = await jwt.verify(token,process.env.JWT_SECRET as string) as {userId : string}

        // Find user while excluding sensitive fields
        const user = await supabaseClient.from("users").select().eq("id",decodeToken.userId).maybeSingle()
        
        // Redirect to signup if user not found 
        if(!user){
            return res.status(401).json({message:"Unauthorized"})
        }

        // Attach user to request for downstream middleware
        (req as any).user = user;
        next()
    } catch (error:any) {
        throw new CustomApiError(
            error.statusCode || 500,
            error.message || "Internal Server Error"
        )
    }
})

export default verifyJwt