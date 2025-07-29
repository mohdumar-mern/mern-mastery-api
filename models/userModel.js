import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  progress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  }],
});

userSchema.index({ email: 1, username: 1 });

export default mongoose.model('User', userSchema);