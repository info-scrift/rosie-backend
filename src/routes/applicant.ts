import express from 'express';
import {
    createApplicantProfileHandler,
    deleteApplicantProfileHandler,
    readApplicantProfile,
    submitApplicantProfile,
    updateApplicantProfileHandler
} from '../controllers/applicantController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload';


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




export default router;
