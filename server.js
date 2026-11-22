const app = require('./src/app');

const port = Number(process.env.PORT) || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`Haulr mock API running on http://localhost:${port}/v1`);
  console.log(
    `Android emulator: http://10.0.2.2:${port}/v1   Demo login: demo@haulr.com / password123`,
  );
});
