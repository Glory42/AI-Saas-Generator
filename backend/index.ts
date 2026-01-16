import express, { type Request, type Response } from 'express';
import cors from 'cors';
import config from './config/config.ts';
import userRoutes from './routes/userRoute';
import uploadRoutes from './routes/uploadRoute.ts';
import generateRoutes from "./routes/generateRoute";
import errorHandler from './middlewares/errorHandler.ts';
import notFoundHandler from './middlewares/404handler.ts';

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://ai-saas-generator.vercel.app",
    ], 
    credentials: true
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send({
        status: "active",
        message: "AI Image Generator API is running",
        timestamp: new Date().toISOString()
    });
});

app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/generate', generateRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});