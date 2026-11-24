const Payment = require('../models/Payment');

function methods(req, res) {
  return res.status(200).json({
    data: [
      {
        id: 'card',
        type: 'card',
        title: 'Card ····4417',
        subtitle: 'Expires 08/28',
      },
      {
        id: 'bank',
        type: 'bank',
        title: 'Bank transfer',
        subtitle: 'Pay with account number',
      },
    ],
  });
}

async function create(req, res) {
  const amount = typeof req.body.amount === 'number' ? Math.trunc(req.body.amount) : 0;
  const methodId = typeof req.body.method_id === 'string' ? req.body.method_id : '';

  if (amount <= 0 || !methodId) {
    return res.status(422).json({ message: 'amount and method_id are required' });
  }
  if (methodId === 'fail') {
    return res.status(402).json({ message: 'Payment declined (test method)' });
  }

  const payment = await Payment.createPayment({
    amount,
    methodId,
    shipmentId: req.body.shipment_id,
  });
  return res.status(201).json(payment);
}

module.exports = { create, methods };
