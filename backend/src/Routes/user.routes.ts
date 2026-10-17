import express from "express";
import { type Request, type Response } from "express";
import { loginUser, registerUser, logoutUser } from "../Controllers/users.controller.js";


const UserRouter = express.Router();

UserRouter.post('/login', loginUser);
UserRouter.post('/register', registerUser);
UserRouter.post('/logout', logoutUser);

export default UserRouter;