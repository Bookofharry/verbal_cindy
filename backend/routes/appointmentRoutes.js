import express from 'express';
import Appointment from '../models/Appointment.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Helper function to generate appointment reference
const makeRef = () => {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const code = nanoid(4).toUpperCase(); // short id
  return `CEC-${yyyymmdd}-${code}`;
};

// GET /api/appointments - Get all appointments (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status, date, upcoming } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    // Filter upcoming appointments
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }
    
    const appointments = await Appointment.find(query)
      .sort({ date: 1, slot: 1 }) // Sort by date and time
      .lean();
    
    res.json({ ok: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id - Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ ok: true, appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      service,
      date,
      slot,
      contactPref,
      notes,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !service || !date || !slot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique reference
    let ref;
    let isUnique = false;
    while (!isUnique) {
      ref = makeRef();
      const existing = await Appointment.findOne({ ref });
      if (!existing) {
        isUnique = true;
      }
    }

    // Create appointment
    const appointment = new Appointment({
      ref,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      service: service.trim(),
      date: new Date(date),
      slot: slot.trim(),
      contactPref: contactPref || 'WhatsApp',
      notes: notes ? notes.trim() : '',
      status: 'pending',
    });

    await appointment.save();

    res.status(201).json({
      ok: true,
      appointment,
      message: 'Appointment booked successfully',
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate reference (shouldn't happen, but just in case)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Reference already exists. Please try again.' });
    }
    
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      service,
      date,
      slot,
      contactPref,
      notes,
      status,
    } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update fields if provided
    if (firstName !== undefined) appointment.firstName = firstName.trim();
    if (lastName !== undefined) appointment.lastName = lastName.trim();
    if (email !== undefined) appointment.email = email.trim().toLowerCase();
    if (phone !== undefined) appointment.phone = phone.trim();
    if (service !== undefined) appointment.service = service.trim();
    if (date !== undefined) appointment.date = new Date(date);
    if (slot !== undefined) appointment.slot = slot.trim();
    if (contactPref !== undefined) appointment.contactPref = contactPref;
    if (notes !== undefined) appointment.notes = notes.trim();
    if (status !== undefined) {
      if (['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        appointment.status = status;
      }
    }

    await appointment.save();

    res.json({ ok: true, appointment, message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id - Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ ok: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;

