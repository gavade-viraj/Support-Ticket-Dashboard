import asyncHandlers from "../Utils/utils.js";
import { type Request, type Response } from "express";
import { CustomApiError } from "../Utils/utils.js";
import { supabaseClient } from "../DB/ConnectDB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

const registerUser = asyncHandlers(async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const { data: existingUser } = await supabaseClient
            .from("users")
            .select()
            .eq("username", username)
            .maybeSingle();

        if (existingUser) { 
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: newUser, error: insertError } = await supabaseClient
            .from("users")
            .insert([{ username, password: hashedPassword }])
            .select();

        if (insertError) throw insertError;
        return res.status(201).json({ message: "User created successfully", user: newUser?.[0] });

    } catch (error: any) {
        throw new CustomApiError(error.statusCode || 500, error.message);
    }
});

const loginUser = asyncHandlers(async (req: Request, res: Response) => {
    const {username , password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const { data: user, error } = await supabaseClient
        .from("users")
        .select()
        .eq("username", username)
        .maybeSingle();
    if (error) throw error;
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
    }


    const payload = { userId: user.id , username :user.username};
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
        expiresIn: "60d",
    });

    res.cookie("AccessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "test",
        sameSite: "strict",
        maxAge: 60 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({ message: "User logged in successfully",AccessToken :  token});
});

const logoutUser = asyncHandlers(async (req: Request, res: Response) => {
    res.send("User Logout");    
});

export { loginUser, registerUser, logoutUser };