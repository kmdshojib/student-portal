import dbConnect from "../db/db.config";
import Attendance from "../model/attendanceModel";

(async () => {
  try {
    await dbConnect();
    const res = await Attendance.updateMany({}, { $set: { isPaid: false } });
    console.log(`reset isPaid for ${res.modifiedCount ?? 0} documents`);
    process.exit(0);
  } catch (err) {
    console.error("resetPaid error:", err);
    process.exit(1);
  }
})();