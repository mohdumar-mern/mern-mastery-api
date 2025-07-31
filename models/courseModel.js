import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  fileUrl: { type: String, required: true, select: false }, // Exclude from queries by default
  publicId: { type: String, required: true }, // Required for Cloudinary
  fileType: { type: String, enum: ['video', 'pdf'], required: true },
  order: { type: Number, required: true },
  version: { type: String, required: true }, // Required for Cloudinary versioning
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  introduction: {
    fileUrl: { type: String, required: true, select: false },
    publicId: { type: String, required: true },
    fileType: { type: String, enum: ['video', 'pdf'], required: true },
    version: { type: String, required: true },
  },
  lectures: [lectureSchema],
}, {
  timestamps: true,
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 1000 },
  category: { type: String, trim: true, default: 'Uncategorized', maxlength: 50 },
  units: [unitSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, trim: true, maxlength: 500, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Optimized indexes for common queries
courseSchema.index({ createdBy: 1 }); // Index for creator-based queries
courseSchema.index({ title: 'text', description: 'text' }); // Text index for search
courseSchema.index({ 'units._id': 1 }); // Index for unit lookups
courseSchema.index({ 'units.lectures._id': 1 }); // Index for lecture lookups

export default mongoose.model('Course', courseSchema);
