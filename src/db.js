const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error(
      'MongoDB connection error: MONGO_URI is not set. Add it to .env or the environment.',
    );
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(mongoUri);

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );

  } catch (error) {
    console.error(
      `MongoDB connection error: ${error.message}`
    );

    process.exit(1);
  }
};

module.exports = connectDB;