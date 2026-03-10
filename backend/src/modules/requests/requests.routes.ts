import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { createRequestDto, updateRequestDto, findMatchesDto } from './requests.dto';
import * as requestsController from './requests.controller';

const router = Router();

// Create a new book request
router.post('/', authenticate, validate(createRequestDto), requestsController.handleCreate);

// Find matching listings for request criteria (before creating)
router.post('/find-matches', authenticate, validate(findMatchesDto), requestsController.handleFindMatches);

// Get my requests
router.get('/my', authenticate, requestsController.handleGetMyRequests);

// Get matches for a specific request
router.get('/:id/matches', authenticate, requestsController.handleGetMatches);

// Update request
router.put('/:id', authenticate, validate(updateRequestDto), requestsController.handleUpdate);

// Cancel request
router.post('/:id/cancel', authenticate, requestsController.handleCancel);

export default router;
