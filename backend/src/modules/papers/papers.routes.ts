import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { createPaperDto, searchPapersDto } from './papers.dto';
import * as papersController from './papers.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow PDFs and images
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});

// Search papers (public)
router.get('/', validateQuery(searchPapersDto), papersController.handleSearch);

// Get paper by ID (public)
router.get('/:id', papersController.handleGetById);

// Upload paper (authenticated)
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validate(createPaperDto),
  papersController.handleCreate
);

// Increment download count (authenticated)
router.post('/:id/download', authenticate, papersController.handleDownload);

export default router;
