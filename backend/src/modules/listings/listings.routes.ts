import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { createListingDto, updateListingDto, searchListingsDto } from './listings.dto';
import * as listingsController from './listings.controller';

const router = Router();

router.get('/', validateQuery(searchListingsDto), listingsController.handleSearch);
router.get('/my', authenticate, listingsController.handleGetMyListings);
router.get('/:id', listingsController.handleGetListing);

router.post('/', authenticate, validate(createListingDto), listingsController.handleCreate);
router.put('/:id', authenticate, validate(updateListingDto), listingsController.handleUpdate);
router.delete('/:id', authenticate, listingsController.handleCancel);

router.post(
  '/:id/images',
  authenticate,
  upload.array('images', 5),
  listingsController.handleUploadImages
);

export default router;
