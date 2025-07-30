import mongoose, { version } from 'mongoose';

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  fileUrl: { type: String, required: true },
  publicId: { type: String },
  fileType: { type: String, enum: ['video', 'pdf'], required: true },
  order: { type: Number, required: true }, // To maintain lecture order (1, 2, 3, etc.)
  version: { type: String },
});

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  introduction: {
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    fileType: { type: String, enum: ['video', 'pdf'], required: true },
    version: { type: String,  },
  },
  lectures: [lectureSchema],
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
});

// Indexes for performance
courseSchema.index({ createdBy: 1, title: 1, category: 1, 'units._id': 1, 'units.lectures._id': 1 });
export default mongoose.model('Course', courseSchema);