import "dotenv/config";
import express, { type Request, type Response } from "express";
import UserRouter from "./Routes/user.routes.js";
import TicketRouter from "./Routes/ticktes.routes.js";
import { supabaseClient } from "./DB/ConnectDB.js";
import verifyJwt from "./Middlewares/auth.middlewares.js";
import cookieParser from "cookie-parser";
import cors from "cors";



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use('/api/v1/auth', UserRouter);
app.use('/api/v1/ticket',verifyJwt, TicketRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});




app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    if (supabaseClient) {
        console.log("Supabase client initialized successfully");
    }
});
