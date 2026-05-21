import { Router } from 'express';
import multer from 'multer';
import path from 'path';
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
  fileFilter: (_req, file, cb) => {
    // MIME header is client-controlled, so we validate both the declared
    // type and the actual file extension that lands on disk.
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExt.includes(ext)) {
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

// Increment download count (public - no auth required for downloading)
router.post('/:id/download', papersController.handleDownload);

export default router;
