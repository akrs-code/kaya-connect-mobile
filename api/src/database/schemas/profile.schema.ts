import { Schema } from 'mongoose';
import { DAYS } from '../../common/constants/statuses';
export const ProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    biography: { type: String, maxlength: 500, default: '' },
    intent: { type: String, enum: ['provider', 'requester', 'both'], default: 'both' },
    skills: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    experience: [{ title: String, description: String, years: Number }],
    availability: [
      { day: { type: String, enum: DAYS }, from: String, to: String },
    ],
    serviceArea: [{ type: String, trim: true, lowercase: true }],
    portfolio: [
      {
        title: String,
        description: String,
        imageUrl: String,
        publicId: String,
      },
    ],
    visibility: {
      experience: { type: Boolean, default: true },
      availability: { type: Boolean, default: true },
      portfolio: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);
