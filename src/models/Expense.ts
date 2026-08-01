import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
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
    category: {
      type: String,
      required: [true, 'Kategori wajib diisi'],
      enum: {
        values: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'],
        message: '{VALUE} bukan kategori yang valid'
      }
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

// Index for faster queries by date
expenseSchema.index({ date: -1 });

// Index for filtering by category
expenseSchema.index({ category: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
