import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
    statusCode: number;
    isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { statusCode = 500, message } = err;

    console.error(`[ERROR] ${req.method} ${req.path} - ${message}`);
    if (statusCode === 500) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        error: {
            message: statusCode === 500 ? "Internal Server Error" : message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        },
    });
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        error: {
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};
