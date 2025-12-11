import express from 'express';
import picklist from './routes/picklist.js';

const router = express.Router();

router.use('/picklist', picklist);

export default router;