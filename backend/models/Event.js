import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    image: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Event start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Event end date is required'],
    },
    location: {
      type: String,
      default: "D'Cindy Eyecare - Garki",
    },
    address: {
      type: String,
      default: 'Garki, Abuja, FCT, Nigeria',
    },
    city: {
      type: String,
      default: 'Abuja',
    },
    state: {
      type: String,
      default: 'FCT',
    },
    country: {
      type: String,
      default: 'Nigeria',
    },
    eventType: {
      type: String,
      enum: ['workshop', 'screening', 'promotion', 'seminar', 'health-fair', 'other'],
      default: 'workshop',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
    registrationRequired: {
      type: Boolean,
      default: false,
    },
    registrationLink: {
      type: String,
      default: '',
    },
    attendees: {
      type: Number,
      default: 0,
    },
    seoTitle: {
      type: String,
      maxlength: [60, 'SEO title should not exceed 60 characters'],
    },
    seoDescription: {
      type: String,
      maxlength: [160, 'SEO description should not exceed 160 characters'],
    },
    seoKeywords: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
eventSchema.index({ slug: 1 });
eventSchema.index({ published: 1, startDate: 1 });
eventSchema.index({ featured: 1, startDate: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ city: 1, state: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });

// Generate slug from title if not provided
eventSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date();
});

// Virtual for checking if event is past
eventSchema.virtual('isPast').get(function() {
  return this.endDate < new Date();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;

