// Haulr mock API for local testing. No packages needed, only the Dart SDK.
//   dart mock_server/mock_server.dart            (listens on port 8080)
// Demo login: demo@haulr.com / password123
import 'dart:async';
import 'dart:convert';
import 'dart:io';

const port = 8080;
const latency = Duration(milliseconds: 400);

final users = <Map<String, dynamic>>[
  {
    'id': 'u1',
    'name': 'Adaeze Okafor',
    'email': 'demo@haulr.com',
    'phone': '08012345678',
    'tier': 'Gold',
    'password': 'password123',
  },
];
final tokens = <String, String>{}; // token -> user id
final shipments = <Map<String, dynamic>>[];
final payments = <Map<String, dynamic>>[];
int shipmentSeq = 48230;
int paymentSeq = 1000;

Map<String, dynamic> addr(String line, String city) => {
      'line': line,
      'city': city,
      'lat': null,
      'lng': null,
    };
Map<String, dynamic> publicUser(Map<String, dynamic> u) => {
      'id': u['id'],
      'name': u['name'],
      'email': u['email'],
      'phone': u['phone'],
      'tier': u['tier'],
    };

void seed() {
  final now = DateTime.now();
  String iso(DateTime d) => d.toIso8601String();
  Map<String, dynamic> ev(String title, String loc, DateTime t, bool done) => {
        'title': title,
        'location': loc,
        'timestamp': iso(t),
        'done': done,
      };
  shipments.addAll([
    {
      'id': 'HLR-48213',
      'origin': addr('12 Allen Avenue', 'Ikeja'),
      'destination': addr('Wuse II', 'Abuja'),
      'status': 'inTransit',
      'size': 'medium',
      'speed': 'express',
      'weight_kg': 4.5,
      'price': 8500,
      'created_at': iso(now.subtract(const Duration(hours: 8))),
      'eta': iso(now.add(const Duration(hours: 24))),
      'courier': {
        'id': 'c1',
        'name': 'Musa Ibrahim',
        'vehicle': 'Toyota Hiace',
        'plate': 'LAG 482 KJ',
        'phone': '+2348000000000',
      },
      'events': [
        ev('Picked up', 'Ikeja', now.subtract(const Duration(hours: 8)), true),
        ev(
          'Sorted at hub',
          'Lagos hub',
          now.subtract(const Duration(hours: 5)),
          true,
        ),
        ev('In transit', 'Lokoja corridor', now, false),
        ev(
          'Out for delivery',
          'Abuja',
          now.add(const Duration(hours: 24)),
          false,
        ),
      ],
    },
    {
      'id': 'HLR-48230',
      'origin': addr('Herbert Macaulay Way', 'Yaba'),
      'destination': addr('Wuse II', 'Abuja'),
      'status': 'pending',
      'size': 'small',
      'speed': 'standard',
      'weight_kg': 1.2,
      'price': 6400,
      'created_at': iso(now),
      'eta': null,
      'courier': null,
      'events': <Map<String, dynamic>>[],
    },
    {
      'id': 'HLR-47790',
      'origin': addr('Herbert Macaulay Way', 'Yaba'),
      'destination': addr('Admiralty Way', 'Lekki'),
      'status': 'delivered',
      'size': 'small',
      'speed': 'standard',
      'weight_kg': 0.8,
      'price': 3200,
      'created_at': iso(now.subtract(const Duration(days: 5))),
      'eta': null,
      'courier': null,
      'events': <Map<String, dynamic>>[],
    },
    {
      'id': 'HLR-47511',
      'origin': addr('12 Allen Avenue', 'Ikeja'),
      'destination': addr('Admiralty Way', 'Lekki'),
      'status': 'delivered',
      'size': 'medium',
      'speed': 'standard',
      'weight_kg': 2.0,
      'price': 5100,
      'created_at': iso(now.subtract(const Duration(days: 13))),
      'eta': null,
      'courier': null,
      'events': <Map<String, dynamic>>[],
    },
  ]);
}

const sizeFee = {'small': 500, 'medium': 1500, 'large': 3000};

Map<String, dynamic> quote(
  String speed,
  String size,
  double kg,
  String? promo,
) {
  final express = speed == 'express';
  final base = express ? 4000 : 900;
  final dist = express ? 1200 : 0;
  final weight = (sizeFee[size] ?? 1500) + (kg * 400).round();
  final sub = base + dist + weight;
  final code = promo?.toUpperCase();
  final discount = code == 'HAULR10' ? (sub * 0.10).round() : 0;
  return {
    'id': 'q-$speed',
    'speed': speed,
    'size': size,
    'weight_kg': kg,
    'base_fee': base,
    'distance_fee': dist,
    'weight_fee': weight,
    'discount': discount,
    'estimated_days': express ? 1 : 3,
    'promo_code': discount > 0 ? code : null,
    'expires_at':
        DateTime.now().add(const Duration(minutes: 15)).toIso8601String(),
  };
}

int totalOf(Map<String, dynamic> q) =>
    (q['base_fee'] as int) +
    (q['distance_fee'] as int) +
    (q['weight_fee'] as int) -
    (q['discount'] as int);

Future<void> send(HttpResponse res, int code, Object body) async {
  res.statusCode = code;
  res.headers.contentType = ContentType.json;
  res.write(jsonEncode(body));
  await res.close();
}

Map<String, dynamic>? authUser(HttpRequest req) {
  final h = req.headers.value('authorization') ?? '';
  final id = tokens[h.replaceFirst('Bearer ', '')];
  if (id == null) return null;
  for (final u in users) {
    if (u['id'] == id) return u;
  }
  return null;
}

String newToken(String userId) {
  final t = 'mock-token-$userId-${DateTime.now().millisecondsSinceEpoch}';
  tokens[t] = userId;
  return t;
}

Future<void> handle(HttpRequest req) async {
  final res = req.response;
  res.headers
    ..set('Access-Control-Allow-Origin', '*')
    ..set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    ..set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method == 'OPTIONS') {
    res.statusCode = 204;
    await res.close();
    return;
  }
  try {
    await Future.delayed(latency);
    Map<String, dynamic> body = {};
    if (req.method == 'POST') {
      final raw = await utf8.decoder.bind(req).join();
      if (raw.isNotEmpty) {
        try {
          body = jsonDecode(raw) as Map<String, dynamic>;
        } catch (_) {
          return send(res, 400, {'message': 'Invalid JSON body'});
        }
      }
    }
    final seg = req.uri.pathSegments.where((s) => s.isNotEmpty).toList();
    print('${req.method} ${req.uri}');
    if (seg.isEmpty || seg.first != 'v1')
      return send(res, 404, {'message': 'Not found. Use /v1/...'});
    final route = '${req.method} /${seg.skip(1).join('/')}';

    // ---- public routes ----
    if (route == 'GET /health') return send(res, 200, {'status': 'ok'});

    if (route == 'POST /auth/sign-in') {
      final email = (body['email'] as String? ?? '').trim().toLowerCase();
      final pass = body['password'] as String? ?? '';
      for (final u in users) {
        if (u['email'] == email && u['password'] == pass) {
          return send(res, 200, {
            'token': newToken(u['id'] as String),
            'user': publicUser(u),
          });
        }
      }
      return send(res, 401, {'message': 'Invalid email or password'});
    }

    if (route == 'POST /auth/sign-up') {
      final name = (body['name'] as String? ?? '').trim();
      final email = (body['email'] as String? ?? '').trim().toLowerCase();
      final phone = (body['phone'] as String? ?? '').trim();
      final pass = body['password'] as String? ?? '';
      if (name.length < 2 ||
          !email.contains('@') ||
          phone.isEmpty ||
          pass.length < 8) {
        return send(res, 422, {
          'message':
              'Name, valid email, phone and a password of 8+ characters are required',
        });
      }
      if (users.any((u) => u['email'] == email))
        return send(res, 409, {
          'message': 'An account with this email already exists',
        });
      final u = {
        'id': 'u${users.length + 1}',
        'name': name,
        'email': email,
        'phone': phone,
        'tier': 'Standard',
        'password': pass,
      };
      users.add(u);
      return send(res, 201, {
        'token': newToken(u['id'] as String),
        'user': publicUser(u),
      });
    }

    if (route == 'POST /auth/forgot-password') {
      // Always 200 so the API never reveals which emails exist.
      return send(res, 200, {
        'message': 'If that email exists, a reset link has been sent',
      });
    }

    // ---- protected routes ----
    final user = authUser(req);
    if (user == null)
      return send(res, 401, {'message': 'Unauthorized. Sign in first.'});

    if (route == 'GET /me') return send(res, 200, publicUser(user));

    if (route == 'GET /shipments') {
      final status = req.uri.queryParameters['status'];
      final q = (req.uri.queryParameters['q'] ?? '').toLowerCase();
      final list = shipments.where((s) {
        final okStatus = status == null || s['status'] == status;
        final route =
            '${(s['origin'] as Map)['city']} ${(s['destination'] as Map)['city']}'
                .toLowerCase();
        final okQ = q.isEmpty ||
            (s['id'] as String).toLowerCase().contains(q) ||
            route.contains(q);
        return okStatus && okQ;
      }).toList();
      return send(res, 200, {'data': list});
    }

    if (route == 'POST /shipments/quote') {
      final size = body['size'] as String? ?? 'medium';
      final kg = (body['weight_kg'] as num?)?.toDouble() ?? 1.0;
      final promo = body['promo_code'] as String?;
      return send(res, 200, {
        'data': [
          quote('express', size, kg, promo),
          quote('standard', size, kg, promo),
        ],
      });
    }

    if (route == 'POST /shipments') {
      final origin = body['origin'], destination = body['destination'];
      if (origin is! Map || destination is! Map)
        return send(res, 422, {
          'message': 'origin and destination are required',
        });

      final speed = body['speed'] as String? ?? 'standard';
      final size = body['size'] as String? ?? 'medium';
      final kg = (body['weight_kg'] as num?)?.toDouble() ?? 1.0;
      final q = quote(speed, size, kg, body['promo_code'] as String?);
      final s = {
        'id': 'HLR-${++shipmentSeq}',
        'origin': origin,
        'destination': destination,
        'status': 'pending',
        'size': size,
        'speed': speed,
        'weight_kg': kg,
        'price': totalOf(q),
        'created_at': DateTime.now().toIso8601String(),
        'eta': null,
        'courier': null,
        'events': <Map<String, dynamic>>[],
      };
      shipments.insert(0, s);
      return send(res, 201, s);
    }

    if (seg.length == 3 && seg[1] == 'shipments' && req.method == 'GET') {
      for (final s in shipments) {
        if (s['id'] == seg[2]) return send(res, 200, s);
      }
      return send(res, 404, {'message': 'Shipment not found'});
    }

    if (route == 'GET /payments/methods') {
      return send(res, 200, {
        'data': [
          {
            'id': 'card',
            'type': 'card',
            'title': 'Card ····4417',
            'subtitle': 'Expires 08/28',
          },
          {
            'id': 'bank',
            'type': 'bank',
            'title': 'Bank transfer',
            'subtitle': 'Pay with account number',
          },
        ],
      });
    }

    if (route == 'POST /payments') {
      final amount = (body['amount'] as num?)?.toInt() ?? 0;
      final method = body['method_id'] as String? ?? '';
      if (amount <= 0 || method.isEmpty)
        return send(res, 422, {'message': 'amount and method_id are required'});
      if (method == 'fail')
        return send(res, 402, {'message': 'Payment declined (test method)'});
      final p = {
        'id': 'pay_${++paymentSeq}',
        'status': 'paid',
        'amount': amount,
        'method_id': method,
        'shipment_id': body['shipment_id'],
        'created_at': DateTime.now().toIso8601String(),
      };
      payments.add(p);
      return send(res, 201, p);
    }

    return send(res, 404, {'message': 'No route for $route'});
  } catch (e) {
    print('ERROR: $e');
    return send(res, 500, {'message': 'Mock server error'});
  }
}

Future<void> main() async {
  seed();
  final server = await HttpServer.bind(InternetAddress.anyIPv4, port);
  print('Haulr mock API running on http://localhost:$port/v1');
  print(
    'Android emulator: http://10.0.2.2:$port/v1   Demo login: demo@haulr.com / password123',
  );
  await for (final req in server) {
    unawaited(handle(req));
  }
}
