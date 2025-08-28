import express from 'express';
import {
    changePassword,
    createApplicantProfileHandler,
    deleteApplicantProfileHandler,
    readApplicantProfile,
    submitApplicantPhoto,
    submitApplicantProfile,
    updateApplicantProfileHandler
} from '../controllers/applicantController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { upload, uploadPhoto } from '../middlewares/upload';


const router = express.Router();
router.post(
    '/profile',
    authMiddleware,
    upload.single('resume'),
    createApplicantProfileHandler
);
router.post('/profile/upload', authMiddleware, upload.single('resume'), submitApplicantProfile);
// router.post('/profile', authMiddleware, createApplicantProfileHandler);
router.get('/profile', authMiddleware, readApplicantProfile);
router.put('/profile', authMiddleware, updateApplicantProfileHandler);
router.delete('/profile', authMiddleware, deleteApplicantProfileHandler);
router.post(
    '/profile/photo',
    authMiddleware,
    uploadPhoto.single('photo'),
    submitApplicantPhoto
);

router.post("/profile/change-password", authMiddleware, changePassword);



export default router;
