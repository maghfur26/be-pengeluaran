import mongoose, { Document, Schema } from 'mongoose';

export interface IIncome extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const incomeSchema = new Schema<IIncome>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Deskripsi wajib diisi'],
      trim: true,
      maxlength: [200, 'Deskripsi maksimal 200 karakter']
    },
    amount: {
      type: Number,
      required: [true, 'Jumlah uang wajib diisi'],
      min: [0, 'Jumlah uang tidak boleh negatif']
    },
    date: {
      type: Date,
      required: [true, 'Tanggal wajib diisi'],
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Catatan maksimal 500 karakter']
    }
  },
  {
    timestamps: true
  }
);

incomeSchema.index({ date: -1 });

export default mongoose.model<IIncome>('Income', incomeSchema);
