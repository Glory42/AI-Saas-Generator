import express, { type Request, type Response } from 'express';
import cors from 'cors';

import config from './config/config.ts';
import uploadRoutes from './routes/uploadRoute.ts';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send({
        status: "active",
        message: "AI Image Generator API is running",
        timestamp: new Date().toISOString()
    });
});

app.post('/api/upload', uploadRoutes);

app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
});