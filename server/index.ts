import express, { type Request, type Response } from 'express';
import cors from 'cors';
import config from './config/config.ts';
import uploadRoutes from './routes/uploadRoute.ts';
import errorHandler from './middlewares/errorHandler';
import notFoundHandler from './middlewares/404handler';

const app = express();

app.use(cors({
    origin: "http://localhost:5173", 
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

app.use('/api/upload', uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});