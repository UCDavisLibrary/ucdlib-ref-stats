import express from 'express';
import picklist from './routes/picklist.js';
import field from './routes/field.js';

const router = express.Router();
router.use('/field', field);
router.use('/picklist', picklist);

export default router;