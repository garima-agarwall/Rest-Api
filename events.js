import express from 'express';
import * as events from '../controllers/events-controller.js';
import { authenticateToken } from '../util/auth.js';
import {upload} from '../util/upload.js';

const router = express.Router();

router.post('/', authenticateToken,upload.single('image'),  events.createEvent);
// Register/unregister endpoints for events
router.post('/:id/register', authenticateToken, events.register);
router.delete('/:id/register', authenticateToken, events.unregister);

// moved GET / before GET /:id to avoid route shadowing
router.get('/', events.getAllEvents);

router.get('/:id', events.getEventById);
router.put('/:id', authenticateToken, upload.single('image'), events.editEvent);
router.delete('/:id', authenticateToken, events.deleteEvent);
router.post('/:id/register', authenticateToken, events.register);
router.delete('/:id/unregister', authenticateToken, events.unregister);

export default router;
