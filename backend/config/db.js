const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://abhisurvey174_db_user:CWV1XktuwIA2OOss@cluster0.axfqc97.mongodb.net/ai_startup_validation"
    );
    console.log("MongoDB Atlas connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
