import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';

const storage = multer.memoryStorage(); // Store in memory for Supabase upload

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
        return cb(new Error('Only PDFs are allowed'));
    }
    cb(null, true);
};

export const upload = multer({ storage, fileFilter });
