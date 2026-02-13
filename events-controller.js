import * as EventModel from '../models/event.js';

export function createEvent(req, res) {
    try {
        const { title, description, address, date } = req.body ?? {};
        const file = req.file ?? null; // multer-style single file upload

        const trim = v => (typeof v === 'string' ? v.trim() : '');
        const t = trim(title), d = trim(description), a = trim(address), dateStr = trim(date);

        const errors = [];
        if (!t) errors.push('title is required and must not be empty');
        if (!d) errors.push('description is required and must not be empty');
        if (!a) errors.push('address is required and must not be empty');

        // Validate optional uploaded image (if provided)
        let imagePath = null;
        if (file) {
            const mimetype = String(file.mimetype ?? '');
            const size = Number(file.size ?? 0);

            if (!mimetype.startsWith('image/')) {
                errors.push('image must be an image file');
            }
            

            // Normalize stored path/filename depending on multer storage setup.
            // Prefer file.path (diskStorage) then file.filename (destination + filename).
            imagePath = file.path ?? file.filename ?? null;
        }

        // Use authenticated user id (req.user.id). Require authentication for creating events.
        const authUserId = Number(req.user?.id);
        if (!Number.isInteger(authUserId) || authUserId <= 0) {
            // If there's no authenticated user, respond with 401 rather than creating an unauthenticated event
            return res.status(401).json({ error: 'Unauthorized: valid Authorization token required' });
        }
        const uid = authUserId;

        let isoDate = null;
        if (!dateStr) {
            errors.push('date is required and must not be empty');
        } else {
            const parsed = new Date(dateStr);
            if (Number.isNaN(parsed.getTime())) errors.push('date must be a valid date string (e.g. ISO 8601)');
            else isoDate = parsed.toISOString();
        }

        if (errors.length) return res.status(400).json({ errors });

        const created = EventModel.createEvent({
            title: t,
            description: d,
            address: a,
            date: isoDate,
            userId: uid,
            // store image path/filename (null if none)
            image: imagePath,
        });
        return res.status(201).json(created);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to create event' });
    }
}

export function editEvent(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid event id' });

        const authUserId = Number(req.user?.id);
        if (!Number.isInteger(authUserId) || authUserId <= 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const event = EventModel.getEventById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.userId !== authUserId) {
            return res.status(403).json({ error: 'Forbidden: you are not allowed to modify this event' });
        }

        const body = req.body ?? {};
        const file = req.file ?? null; // multer single file upload
        const has = key => Object.prototype.hasOwnProperty.call(body, key);

        // Require at least one updatable field or an uploaded image
        const hasAny = file || ['title', 'description', 'address', 'date'].some(has);
        if (!hasAny) {
            return res.status(400).json({ error: 'Provide at least one field (title, description, address, date) or an image to update' });
        }

        const trim = v => (typeof v === 'string' ? v.trim() : '');
        const errors = [];
        const updates = {};

        const setText = key => {
            if (!has(key)) return;
            const v = trim(body[key]);
            if (!v) errors.push(`${key} must not be empty`);
            else updates[key] = v;
        };

        setText('title');
        setText('description');
        setText('address');

        if (has('date')) {
            const ds = trim(body.date);
            if (!ds) errors.push('date must not be empty');
            else {
                const parsed = new Date(ds);
                if (Number.isNaN(parsed.getTime())) errors.push('date must be a valid date string (e.g. ISO 8601)');
                else updates.date = parsed.toISOString();
            }
        }

        // Handle optional uploaded image
        if (file) {
            const mimetype = String(file.mimetype ?? '');

            if (!mimetype.startsWith('image/')) {
                errors.push('image must be an image file');
            }

            // Normalize stored path/filename depending on multer storage setup.
            // Prefer file.path (diskStorage) then file.filename (destination + filename).
            updates.image = file.path ?? file.filename ?? null;
        }

        if (errors.length) return res.status(400).json({ errors });

        const updated = EventModel.updateEvent(id, updates);
        if (!updated) return res.status(404).json({ error: 'Event not found' });
        return res.status(200).json(updated);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update event' });
    }
}

export function deleteEvent(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid event id' });
        }

        const authUserId = Number(req.user?.id);
        if (!Number.isInteger(authUserId) || authUserId <= 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const event = EventModel.getEventById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.userId !== authUserId) {
            return res.status(403).json({ error: 'Forbidden: you are not allowed to delete this event' });
        }

        const ok = EventModel.deleteEvent(id);
        if (!ok) return res.status(404).json({ error: 'Event not found' });
        // Return a JSON message instead of a 204 No Content
        return res.status(200).json({ success: true, message: 'Event deleted successfully', id });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete event' });
    }
}

export function getEventById(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid event id' });
        }
        const event = EventModel.getEventById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        return res.status(200).json(event);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to retrieve event' });
    }
}

export function getAllEvents(req, res) {
    try {
        const events = EventModel.getAllEvents();
        return res.status(200).json(events);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to retrieve events' });
    }
}

export function register(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid event id' });
        }

        const authUserId = Number(req.user?.id);
        if (!Number.isInteger(authUserId) || authUserId <= 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const event = EventModel.getEventById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Use model to create a registration. The model will throw on unique constraint.
        try {
            const registration = EventModel.register(id, authUserId);
            return res.status(201).json({ success: true, message: 'Registered for event', registration });
        } catch (err) {
            // Duplicate registration -> SQLite unique constraint
            const isUniqueErr = err && (err.code === 'SQLITE_CONSTRAINT' || (err.message && err.message.toLowerCase().includes('unique')));
            if (isUniqueErr) {
                return res.status(409).json({ success: false, message: 'Already registered for this event' });
            }
            // Log and return the DB error message for debugging (dev only)
            console.error('Registration DB error:', err && err.stack ? err.stack : err);
            return res.status(500).json({ success: false, message: 'Database error during registration', details: err && err.message ? err.message : String(err) });
        }
    } catch (err) {
        console.error('Register error:', err && err.stack ? err.stack : err);
        return res.status(500).json({ error: 'Failed to register for event' });
    }
}

export function unregister(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid event id' });
        }

        const authUserId = Number(req.user?.id);
        if (!Number.isInteger(authUserId) || authUserId <= 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const event = EventModel.getEventById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // If the model provides an unregister implementation, use it.
        if (typeof EventModel.unregister === 'function') {
            const ok = EventModel.unregister(id, authUserId);
            if (!ok) return res.status(404).json({ error: 'Registration not found' });
            return res.status(200).json({ success: true, message: 'Unregistered from event', id, userId: authUserId });
        }

        // Fallback: unregistration not implemented in model
        return res.status(501).json({ error: 'Event unregistration not implemented yet' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to unregister from event' });
    }
}