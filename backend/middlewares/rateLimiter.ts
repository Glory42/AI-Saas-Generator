import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per IP
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 Hour Window
        keyGenerator: (req: any) => req.user?.id || req.ip, 
    
    max: (req: any) => {
        const role = req.user?.role || 'user';
        
        if (role === 'admin') return 1000;
        
        return 10; 
    },
    
    message: { 
        error: "Hourly generation limit reached (10 images/hour). Please try again later." 
    },
});