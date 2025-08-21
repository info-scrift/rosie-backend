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
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
};

export const uploadPhoto = multer({
    storage,                       // <- same memory storage
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter,
});
export const upload = multer({ storage, fileFilter });
