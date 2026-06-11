import mongoose, { Schema, Document, model } from 'mongoose';

interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
}

const AdminSchema: Schema<IAdmin> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || model<IAdmin>('Admin', AdminSchema);

export default Admin;