import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createDealDto, respondToDealDto, completeDealDto } from './deals.dto';
import * as dealsController from './deals.controller';

const router = Router();

// Create a new deal (buyer expresses interest)
router.post('/', authenticate, validate(createDealDto), dealsController.handleCreate);

// Get my deals as buyer
router.get('/my/buying', authenticate, dealsController.handleGetMyDealsAsBuyer);

// Get my deals as seller
router.get('/my/selling', authenticate, dealsController.handleGetMyDealsAsSeller);

// Get specific deal (with contact info if accepted)
router.get('/:id', authenticate, dealsController.handleGetById);

// Seller responds to deal (accept/reject)
router.post('/:id/respond', authenticate, validate(respondToDealDto), dealsController.handleRespond);

// Complete or cancel deal (after acceptance)
router.post('/:id/complete', authenticate, validate(completeDealDto), dealsController.handleComplete);

// Cancel pending deal
router.post('/:id/cancel', authenticate, dealsController.handleCancel);

export default router;
