import mongoose, { Document, Schema, Model } from 'mongoose';

export type JobStatus =
  | 'pending'
  | 'downloading'
  | 'processing'
  | 'uploading'
  | 'completed'
  | 'failed';

export type SourcePlatform = 'tiktok' | 'instagram' | 'facebook';
export type TargetPlatform = 'youtube';
export type PrivacyStatus = 'public' | 'unlisted' | 'private';

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  videoUrl: string;
  sourcePlatform: SourcePlatform;
  targetPlatform: TargetPlatform;
  status: JobStatus;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: PrivacyStatus;
  trimDuration: number;
  removeWatermark: boolean;
  outputVideoPath?: string;
  publishedVideoUrl?: string;
  publishedVideoId?: string;
  errorMessage?: string;
  attempts: number;
  queueJobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    sourcePlatform: {
      type: String,
      enum: ['tiktok', 'instagram', 'facebook'],
      required: true,
    },
    targetPlatform: {
      type: String,
      enum: ['youtube'],
      required: true,
      default: 'youtube',
    },
    status: {
      type: String,
      enum: ['pending', 'downloading', 'processing', 'uploading', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    privacyStatus: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    trimDuration: {
      type: Number,
      default: 60,
      min: 1,
      max: 180,
    },
    removeWatermark: {
      type: Boolean,
      default: true,
    },
    outputVideoPath: {
      type: String,
      default: null,
    },
    publishedVideoUrl: {
      type: String,
      default: null,
    },
    publishedVideoId: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    queueJobId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for common query patterns
JobSchema.index({ userId: 1, createdAt: -1 });
JobSchema.index({ userId: 1, status: 1 });

export const Job: Model<IJob> = mongoose.model<IJob>('Job', JobSchema);
