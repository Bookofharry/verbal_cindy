import express from 'express';
import Event from '../models/Event.js';
import { sanitizeInput } from '../middleware/validationMiddleware.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/events - Get all published events (public)
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      city, 
      state, 
      featured, 
      upcoming, 
      limit = 10, 
      page = 1 
    } = req.query;
    
    const query = { published: true };

    if (type) {
      query.eventType = type;
    }

    if (city) {
      query.city = city;
    }

    if (state) {
      query.state = state;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/featured - Get featured events (public)
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({
      published: true,
      featured: true,
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(5);

    res.json(events);
  } catch (error) {
    console.error('Error fetching featured events:', error);
    res.status(500).json({ error: 'Failed to fetch featured events' });
  }
});

// GET /api/events/:slug - Get single event (public)
router.get('/:slug', async (req, res) => {
  try {
    const event = await Event.findOne({ 
      slug: req.params.slug,
      published: true 
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// GET /api/events/admin/all - Get all events (admin only)
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create event (admin only)
router.post('/', authenticateAdmin, sanitizeInput, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Event with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update event (admin only)
router.put('/:id', authenticateAdmin, sanitizeInput, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;

