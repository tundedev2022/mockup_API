const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    tier: { type: String, required: true, default: 'Standard' },
    password: { type: String, required: true, select: false },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_document, value) => {
        delete value._id;
        delete value.password;
        return value;
      },
    },
  },
);

userSchema.statics.seedDefaults = async function seedDefaults() {
  if (await this.exists({ email: 'demo@haulr.com' })) {
    return;
  }

  const userCount = await this.countDocuments();
  await this.create({
    id: `u${userCount + 1}`,
    name: 'Adaeze Okafor',
    email: 'demo@haulr.com',
    phone: '08012345678',
    tier: 'Gold',
    password: 'password123',
  });
};

module.exports = mongoose.model('User', userSchema);
