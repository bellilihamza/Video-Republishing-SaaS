import mongoose, { Document, Schema, Model } from 'mongoose';

export type AccountPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook';

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: string;
  platform: AccountPlatform;
  providerAccountId: string;
  accessToken: string;       // AES-256-GCM encrypted
  refreshToken: string;      // AES-256-GCM encrypted
  expiresAt: Date;
  scope: string;
  tokenType: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'google',
    },
    platform: {
      type: String,
      enum: ['youtube', 'tiktok', 'instagram', 'facebook'],
      required: true,
    },
    providerAccountId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    scope: {
      type: String,
      default: '',
    },
    tokenType: {
      type: String,
      default: 'Bearer',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to prevent duplicate accounts per user per platform
AccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const Account: Model<IAccount> = mongoose.model<IAccount>('Account', AccountSchema);
