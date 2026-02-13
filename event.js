import db from '../db.js';

function toISODate(v) {
    if (v === undefined || v === null) return null;
    const t = Date.parse(v);
    return isNaN(t) ? null : new Date(t).toISOString();
}

export function createEvent({ title, description, address, date, userId, image }) {
    const createdAt = new Date().toISOString();
    const d = toISODate(date);
    const info = db.prepare('INSERT INTO events (title, description, address, date, createdAt, userId, image) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        title,
        description ?? null,
        address ?? null,
        d,
        createdAt,
        userId ?? null,
        image ?? null
    );
    return {
        id: info.lastInsertRowid,
        title,
        description: description ?? null,
        address: address ?? null,
        date: d,
        createdAt,
        userId: userId ?? null,
        image: image ?? null,
    };
}

export function getEventById(id) {
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id) || null;
}

export function getAllEvents() {
    return db.prepare('SELECT * FROM events ORDER BY date IS NULL, date ASC').all();
}

export function updateEvent(id, { title, description, address, date, image }) {
    const existing = getEventById(id);
    if (!existing) return null;
    const newTitle = title !== undefined ? title : existing.title;
    const newDescription = description !== undefined ? description : existing.description;
    const newAddress = address !== undefined ? address : existing.address;
    const newDate = date !== undefined ? toISODate(date) : existing.date;
    const newImage = image !== undefined ? image : existing.image;
    const info = db.prepare(
        'UPDATE events SET title = ?, description = ?, address = ?, date = ?, image = ? WHERE id = ?'
    ).run(
        newTitle,
        newDescription ?? null,
        newAddress ?? null,
        newDate,
        newImage ?? null,
        id
    );
    return info.changes > 0 ? getEventById(id) : null;
}

export function deleteEvent(id) {
    const info = db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return info.changes > 0;
}

/**
 * Register a user for an event.
 * Throws an error if the insert fails (e.g. UNIQUE constraint violation).
 * @param {number} eventId
 * @param {number} userId
 * @returns {Object} registration record
 */
export function register(eventId, userId) {
    const createdAt = new Date().toISOString();
    try {
        const info = db.prepare('INSERT INTO registrations (eventId, userId, createdAt) VALUES (?, ?, ?)').run(
            eventId,
            userId,
            createdAt
        );
        return {
            id: info.lastInsertRowid,
            eventId,
            userId,
            createdAt,
        };
    } catch (err) {
        // Log DB error for debugging and rethrow to be handled by controller
        console.error('DB register error:', err && err.stack ? err.stack : err);
        throw err;
    }
}

/**
 * Unregister a user from an event.
 * @param {number} eventId
 * @param {number} userId
 * @returns {boolean} true if a registration was deleted, false otherwise
 */
export function unregister(eventId, userId) {
    const info = db.prepare('DELETE FROM registrations WHERE eventId = ? AND userId = ?').run(eventId, userId);
    return info.changes > 0;
}

export default {
    createEvent,
    getEventById,
    getAllEvents,
    updateEvent,
    deleteEvent,
};
