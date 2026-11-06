process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://placeholder';
process.env.JWT_ACCESS_SECRET = 'x'.repeat(40);
