import { Request, Response, NextFunction } from "express";
import { CustomError } from "./errorHandler";

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
};

export const rateLimiter = (
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    maxRequests: number = 100
) => {
    const requestCounts = new Map<
        string,
        { count: number; resetTime: number }
    >();

    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();

        const clientData = requestCounts.get(clientId);

        if (!clientData || now > clientData.resetTime) {
            requestCounts.set(clientId, {
                count: 1,
                resetTime: now + windowMs,
            });
            return next();
        }

        if (clientData.count >= maxRequests) {
            return next(new CustomError("Rate limit exceeded", 429));
        }

        clientData.count++;
        next();
    };
};
