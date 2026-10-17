import type { NextFunction, Request, Response } from "express";

const asyncHandlers = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };
};

class CustomApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = "CustomApiError";
    }
}
export default asyncHandlers;
export { CustomApiError };
