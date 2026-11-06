import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';

let repl: MongoMemoryReplSet;
let app: INestApplication;

beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); // transactions need a replica set
  process.env.MONGODB_URI = repl.getUri();
  const { AppModule } = await import('../../src/app.module'); // import AFTER the URI is set
  const { configureApp } = await import('../../src/app.setup');
  const mod = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = mod.createNestApplication();
  configureApp(app);
  await app.init();
  const { default: mongoose } = await import('mongoose');
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build the unique/partial indexes
});
afterAll(async () => {
  await app?.close();
  await repl?.stop();
});

const http = () => request(app.getHttpServer());
const signup = async (email: string) =>
  (
    await http()
      .post('/api/v1/auth/register')
      .send({ fullName: 'Test User', email, password: 'Passw0rd!x' })
  ).body.accessToken as string;
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('SRD negative tests', () => {
  it('retires recommendation endpoints while keeping opportunity browsing available', async () => {
    const token = await signup('recommendations-retired@t.com');
    const headers = auth(token);
    const opportunityId = '507f1f77bcf86cd799439011';

    expect(
      (await http().get('/api/v1/recommendations/opportunities').set(headers))
        .status,
    ).toBe(404);
    expect(
      (
        await http()
          .get(`/api/v1/opportunities/${opportunityId}/recommended-providers`)
          .set(headers)
      ).status,
    ).toBe(404);
    expect(
      (await http().get('/api/v1/opportunities').set(headers)).status,
    ).toBe(200);
  });

  it('only one of two concurrent selections wins, and duplicates are blocked', async () => {
    const [owner, p1, p2] = await Promise.all([
      signup('o@t.com'),
      signup('p1@t.com'),
      signup('p2@t.com'),
    ]);
    const cat = await app
      .get(getModelToken('Category'))
      .create({ name: 'Cleaning' });
    const day = 864e5;
    const opp = await http()
      .post('/api/v1/opportunities')
      .set(auth(owner))
      .send({
        title: 'Clean my garage',
        description: 'Need two people to clean a garage this weekend.',
        category: cat.id,
        opportunityType: 'gig',
        location: { area: 'marawi' },
        schedule: {
          start: new Date(Date.now() + day),
          end: new Date(Date.now() + 2 * day),
        },
        compensationType: 'paid',
        compensationAmount: 500,
        compensationUnit: 'per_task',
        qualifications: [],
        publish: true,
      });
    expect(opp.status).toBe(201);
    const a1 = await http()
      .post(`/api/v1/opportunities/${opp.body._id}/applications`)
      .set(auth(p1))
      .send({});
    const a2 = await http()
      .post(`/api/v1/opportunities/${opp.body._id}/applications`)
      .set(auth(p2))
      .send({});
    expect(
      (
        await http()
          .post(`/api/v1/opportunities/${opp.body._id}/applications`)
          .set(auth(p1))
          .send({})
      ).status,
    ).toBe(409);
    expect(
      (
        await http()
          .post(`/api/v1/opportunities/${opp.body._id}/applications`)
          .set(auth(owner))
          .send({})
      ).status,
    ).toBe(403);

    const [r1, r2] = await Promise.all([
      http()
        .post(`/api/v1/applications/${a1.body._id}/select`)
        .set(auth(owner)),
      http()
        .post(`/api/v1/applications/${a2.body._id}/select`)
        .set(auth(owner)),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([201, 409]);
  });

  it('rejects NoSQL operators, unauthenticated calls and non-admins', async () => {
    expect(
      (
        await http()
          .post('/api/v1/auth/login')
          .send({ email: { $ne: null }, password: 'x' })
      ).status,
    ).toBe(400);
    expect((await http().get('/api/v1/opportunities')).status).toBe(401);
    const t = await signup('plain@t.com');
    expect(
      (await http().get('/api/v1/admin/reports').set(auth(t))).status,
    ).toBe(403);
  });

  it('ignores role: "admin" at registration', async () => {
    const res = await http().post('/api/v1/auth/register').send({
      fullName: 'Sneaky',
      email: 'sneaky@t.com',
      password: 'Passw0rd!x',
      role: 'admin',
    });
    expect(res.body.user.role).toBe('user');
  });
});
