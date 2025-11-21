import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Blog slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Blog excerpt is required'],
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    image: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      default: "D'Cindy Eyecare",
    },
    category: {
      type: String,
      enum: ['eye-care', 'products', 'tips', 'news', 'health', 'technology'],
      default: 'eye-care',
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    views: {
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

// Indexes for better query performance
blogSchema.index({ slug: 1 });
blogSchema.index({ published: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdAt: -1 });

// Generate slug from title if not provided
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;

