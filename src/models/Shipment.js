const mongoose = require('mongoose');

const sizeFee = { small: 500, medium: 1500, large: 3000 };

const addressSchema = new mongoose.Schema(
  {
    line: String,
    city: String,
    lat: Number,
    lng: Number,
  },
  { _id: false, strict: false },
);

const courierSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    vehicle: String,
    plate: String,
    phone: String,
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    title: String,
    location: String,
    timestamp: Date,
    done: Boolean,
  },
  { _id: false },
);

const shipmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    origin: { type: addressSchema, required: true },
    destination: { type: addressSchema, required: true },
    status: { type: String, required: true },
    size: { type: String, required: true },
    speed: { type: String, required: true },
    weight_kg: { type: Number, required: true },
    price: { type: Number, required: true },
    created_at: { type: Date, required: true },
    eta: { type: Date, default: null },
    courier: { type: courierSchema, default: null },
    events: { type: [eventSchema], default: [] },
    sort_order: { type: Number, required: true },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_document, value) => {
        delete value._id;
        delete value.sort_order;
        return value;
      },
    },
  },
);

function makeAddress(line, city) {
  return { line, city, lat: null, lng: null };
}

function makeEvent(title, location, timestamp, done) {
  return { title, location, timestamp, done };
}

shipmentSchema.statics.seedDefaults = async function seedDefaults() {
  if (await this.exists({})) {
    return;
  }

  const now = new Date();
  await this.insertMany([
    {
      id: 'HLR-48213',
      origin: makeAddress('12 Allen Avenue', 'Ikeja'),
      destination: makeAddress('Wuse II', 'Abuja'),
      status: 'inTransit',
      size: 'medium',
      speed: 'express',
      weight_kg: 4.5,
      price: 8500,
      created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      eta: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      courier: {
        id: 'c1',
        name: 'Musa Ibrahim',
        vehicle: 'Toyota Hiace',
        plate: 'LAG 482 KJ',
        phone: '+2348000000000',
      },
      events: [
        makeEvent('Picked up', 'Ikeja', new Date(now.getTime() - 8 * 60 * 60 * 1000), true),
        makeEvent('Sorted at hub', 'Lagos hub', new Date(now.getTime() - 5 * 60 * 60 * 1000), true),
        makeEvent('In transit', 'Lokoja corridor', now, false),
        makeEvent('Out for delivery', 'Abuja', new Date(now.getTime() + 24 * 60 * 60 * 1000), false),
      ],
      sort_order: 0,
    },
    {
      id: 'HLR-48230',
      origin: makeAddress('Herbert Macaulay Way', 'Yaba'),
      destination: makeAddress('Wuse II', 'Abuja'),
      status: 'pending',
      size: 'small',
      speed: 'standard',
      weight_kg: 1.2,
      price: 6400,
      created_at: now,
      eta: null,
      courier: null,
      events: [],
      sort_order: 1,
    },
    {
      id: 'HLR-47790',
      origin: makeAddress('Herbert Macaulay Way', 'Yaba'),
      destination: makeAddress('Admiralty Way', 'Lekki'),
      status: 'delivered',
      size: 'small',
      speed: 'standard',
      weight_kg: 0.8,
      price: 3200,
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      eta: null,
      courier: null,
      events: [],
      sort_order: 2,
    },
    {
      id: 'HLR-47511',
      origin: makeAddress('12 Allen Avenue', 'Ikeja'),
      destination: makeAddress('Admiralty Way', 'Lekki'),
      status: 'delivered',
      size: 'medium',
      speed: 'standard',
      weight_kg: 2,
      price: 5100,
      created_at: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
      eta: null,
      courier: null,
      events: [],
      sort_order: 3,
    },
  ]);
};

shipmentSchema.statics.quote = function quote(speed, size, weightKg, promoCode) {
  const express = speed === 'express';
  const baseFee = express ? 4000 : 900;
  const distanceFee = express ? 1200 : 0;
  const weightFee = (sizeFee[size] ?? 1500) + Math.round(weightKg * 400);
  const subtotal = baseFee + distanceFee + weightFee;
  const code = typeof promoCode === 'string' ? promoCode.toUpperCase() : null;
  const discount = code === 'HAULR10' ? Math.round(subtotal * 0.1) : 0;

  return {
    id: `q-${speed}`,
    speed,
    size,
    weight_kg: weightKg,
    base_fee: baseFee,
    distance_fee: distanceFee,
    weight_fee: weightFee,
    discount,
    estimated_days: express ? 1 : 3,
    promo_code: discount > 0 ? code : null,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
};

shipmentSchema.statics.totalOf = function totalOf(quote) {
  return quote.base_fee + quote.distance_fee + quote.weight_fee - quote.discount;
};

shipmentSchema.statics.list = async function list({ status, query }) {
  const filter = status ? { status } : {};
  if (query) {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const search = new RegExp(escapedQuery, 'i');
    filter.$or = [
      { id: search },
      { 'origin.city': search },
      { 'destination.city': search },
    ];
  }

  return this.find(filter).sort({ sort_order: 1 });
};

shipmentSchema.statics.findByApiId = function findByApiId(id) {
  return this.findOne({ id });
};

shipmentSchema.statics.createShipment = async function createShipment({
  origin,
  destination,
  speed,
  size,
  weightKg,
  promoCode,
}) {
  const [latest, firstInList] = await Promise.all([
    this.findOne({ id: /^HLR-\d+$/ }).sort({ id: -1 }).select('id'),
    this.findOne().sort({ sort_order: 1 }).select('sort_order'),
  ]);
  const lastSequence = latest ? Number(latest.id.slice(4)) : 48230;
  const quote = this.quote(speed, size, weightKg, promoCode);

  return this.create({
    id: `HLR-${lastSequence + 1}`,
    origin,
    destination,
    status: 'pending',
    size,
    speed,
    weight_kg: weightKg,
    price: this.totalOf(quote),
    created_at: new Date(),
    eta: null,
    courier: null,
    events: [],
    sort_order: (firstInList?.sort_order ?? 0) - 1,
  });
};

module.exports = mongoose.model('Shipment', shipmentSchema);
