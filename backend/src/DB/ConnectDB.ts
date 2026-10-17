import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const superBaseURI = process.env.SUPABASE_URL as string;
const superBaseKey = process.env.SUPABASE_KEY as string;

if (!superBaseURI || !superBaseKey) {
    throw new Error("Supabase URL or Key is not defined");
}

const supabaseClient = createClient(superBaseURI, superBaseKey);

export { supabaseClient };