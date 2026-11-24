const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    status: { type: String, required: true, default: 'paid' },
    amount: { type: Number, required: true },
    method_id: { type: String, required: true },
    shipment_id: { type: mongoose.Schema.Types.Mixed },
    created_at: { type: Date, required: true, default: Date.now },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_document, value) => {
        delete value._id;
        return value;
      },
    },
  },
);

paymentSchema.statics.createPayment = async function createPayment({
  amount,
  methodId,
  shipmentId,
}) {
  const latest = await this.findOne({ id: /^pay_\d+$/ }).sort({ id: -1 }).select('id');
  const lastSequence = latest ? Number(latest.id.slice(4)) : 1000;

  return this.create({
    id: `pay_${lastSequence + 1}`,
    status: 'paid',
    amount,
    method_id: methodId,
    shipment_id: shipmentId,
    created_at: new Date(),
  });
};

module.exports = mongoose.model('Payment', paymentSchema);
