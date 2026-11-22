const payments = [];
let paymentSequence = 1000;

function create({ amount, methodId, shipmentId }) {
  const payment = {
    id: `pay_${++paymentSequence}`,
    status: 'paid',
    amount,
    method_id: methodId,
    shipment_id: shipmentId,
    created_at: new Date().toISOString(),
  };
  payments.push(payment);
  return payment;
}

module.exports = { create };
