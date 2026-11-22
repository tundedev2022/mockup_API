const sizeFee = { small: 500, medium: 1500, large: 3000 };
const shipments = [];
let shipmentSequence = 48230;

function address(line, city) {
  return { line, city, lat: null, lng: null };
}

function event(title, location, timestamp, done) {
  return { title, location, timestamp: timestamp.toISOString(), done };
}

function seed() {
  const now = new Date();
  shipments.push(
    {
      id: 'HLR-48213',
      origin: address('12 Allen Avenue', 'Ikeja'),
      destination: address('Wuse II', 'Abuja'),
      status: 'inTransit',
      size: 'medium',
      speed: 'express',
      weight_kg: 4.5,
      price: 8500,
      created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      eta: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      courier: {
        id: 'c1',
        name: 'Musa Ibrahim',
        vehicle: 'Toyota Hiace',
        plate: 'LAG 482 KJ',
        phone: '+2348000000000',
      },
      events: [
        event('Picked up', 'Ikeja', new Date(now.getTime() - 8 * 60 * 60 * 1000), true),
        event('Sorted at hub', 'Lagos hub', new Date(now.getTime() - 5 * 60 * 60 * 1000), true),
        event('In transit', 'Lokoja corridor', now, false),
        event('Out for delivery', 'Abuja', new Date(now.getTime() + 24 * 60 * 60 * 1000), false),
      ],
    },
    {
      id: 'HLR-48230',
      origin: address('Herbert Macaulay Way', 'Yaba'),
      destination: address('Wuse II', 'Abuja'),
      status: 'pending',
      size: 'small',
      speed: 'standard',
      weight_kg: 1.2,
      price: 6400,
      created_at: now.toISOString(),
      eta: null,
      courier: null,
      events: [],
    },
    {
      id: 'HLR-47790',
      origin: address('Herbert Macaulay Way', 'Yaba'),
      destination: address('Admiralty Way', 'Lekki'),
      status: 'delivered',
      size: 'small',
      speed: 'standard',
      weight_kg: 0.8,
      price: 3200,
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      eta: null,
      courier: null,
      events: [],
    },
    {
      id: 'HLR-47511',
      origin: address('12 Allen Avenue', 'Ikeja'),
      destination: address('Admiralty Way', 'Lekki'),
      status: 'delivered',
      size: 'medium',
      speed: 'standard',
      weight_kg: 2,
      price: 5100,
      created_at: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      eta: null,
      courier: null,
      events: [],
    },
  );
}

function quote(speed, size, weightKg, promoCode) {
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
}

function totalOf(quoteResult) {
  return quoteResult.base_fee + quoteResult.distance_fee +
    quoteResult.weight_fee - quoteResult.discount;
}

function list({ status, query }) {
  return shipments.filter((shipment) => {
    const matchesStatus = !status || shipment.status === status;
    const route = `${shipment.origin.city} ${shipment.destination.city}`.toLowerCase();
    const matchesQuery = !query ||
      shipment.id.toLowerCase().includes(query) ||
      route.includes(query);
    return matchesStatus && matchesQuery;
  });
}

function findById(id) {
  return shipments.find((shipment) => shipment.id === id) || null;
}

function create({ origin, destination, speed, size, weightKg, promoCode }) {
  const quoteResult = quote(speed, size, weightKg, promoCode);
  const shipment = {
    id: `HLR-${++shipmentSequence}`,
    origin,
    destination,
    status: 'pending',
    size,
    speed,
    weight_kg: weightKg,
    price: totalOf(quoteResult),
    created_at: new Date().toISOString(),
    eta: null,
    courier: null,
    events: [],
  };
  shipments.unshift(shipment);
  return shipment;
}

seed();

module.exports = {
  create,
  findById,
  list,
  quote,
  totalOf,
};
