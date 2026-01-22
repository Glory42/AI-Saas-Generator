import env from "../config/config";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const StartupService = {
    async checkDatabaseConnection() {
        let retries = 0;
        while (retries < 5) {
            try {
                console.log(`Connecting to Database (Attempt ${retries + 1})...`);
                
                const { error } = await supabase.from("users").select("count", { count: "exact", head: true });
                if (error) throw error;

                console.log("Database Connection: Healthy (SSL Verified)");
                return true;
            } catch (error: any) {
                retries ++;
                const waitTime = Math.pow(2, retries) * 1000;
                console.error(`DB Connection Failed: ${error.message}. Retrying in ${waitTime}ms...`);
                
                if (retries >= 5) {
                  console.error("🚨 Critical Error: Could not connect to Database after multiple attempts.");
                  process.exit(1); // Hard crash is better than a zombie server
                } 

                await delay(waitTime);
            }
        }
    },

    async validateExternalKeys() {
        try {
            console.log("Validating AI Service Keys...");
            const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
            await model.generateContent("Test");
      
            console.log("AI Service: Online & Authorized");
        } catch (error: any) {
            console.error("AI Service Error: Invalid API Key or Quota Exceeded.");
            console.error(`Details: ${error.message}`);
        }
    }

}


export default StartupService;