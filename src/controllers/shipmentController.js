const Shipment = require('../models/Shipment');

function quote(req, res) {
  const size = typeof req.body.size === 'string' ? req.body.size : 'medium';
  const weightKg = typeof req.body.weight_kg === 'number' ? req.body.weight_kg : 1;
  const promoCode = req.body.promo_code;

  return res.status(200).json({
    data: [
      Shipment.quote('express', size, weightKg, promoCode),
      Shipment.quote('standard', size, weightKg, promoCode),
    ],
  });
}

async function list(req, res) {
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  const query = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : '';
  return res.status(200).json({ data: await Shipment.list({ status, query }) });
}

async function create(req, res) {
  const { origin, destination } = req.body;
  if (!origin || typeof origin !== 'object' || Array.isArray(origin) ||
      !destination || typeof destination !== 'object' || Array.isArray(destination)) {
    return res.status(422).json({ message: 'origin and destination are required' });
  }

  const speed = typeof req.body.speed === 'string' ? req.body.speed : 'standard';
  const size = typeof req.body.size === 'string' ? req.body.size : 'medium';
  const weightKg = typeof req.body.weight_kg === 'number' ? req.body.weight_kg : 1;
  const shipment = await Shipment.createShipment({
    origin,
    destination,
    speed,
    size,
    weightKg,
    promoCode: req.body.promo_code,
  });
  return res.status(201).json(shipment);
}

async function getById(req, res) {
  const shipment = await Shipment.findByApiId(req.params.id);
  if (!shipment) {
    return res.status(404).json({ message: 'Shipment not found' });
  }
  return res.status(200).json(shipment);
}

module.exports = { create, getById, list, quote };
