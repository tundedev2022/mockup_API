require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/db');
const User = require('./src/models/User');
const Shipment = require('./src/models/Shipment');

const port = Number(process.env.PORT) || 8080;

const startServer = async () => {
  await connectDB();
  await Promise.all([User.seedDefaults(), Shipment.seedDefaults()]);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}/v1`);
    console.log(
      `Android emulator: http://10.0.2.2:${port}/v1 `,
    );
  });
};

startServer();
