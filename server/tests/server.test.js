const request = require('supertest');
const { app, registry } = require('../server');
// Mock the server app structure for testing since server.js starts listening immediately
// We'll require the modules but might need to refactor server.js to export app for easier testing
// For now, let's create a testable app instance mirroring server.js logic or suppress console.log

// A better approach for now: verify the auxiliary modules and skip full server integration 
// if server.js isn't exported properly. 
// However, let's assume we can test the endpoints if we spin up our own express app with the same routes
// or just modify server.js to export.

// Let's create a simple test for the endpoints by redefining them here (unit test style)
// or try to require server.js (will start server, might conflict with port).
// Strategy: Test registry (already done) and Auth.

describe('Server API Checks', () => {

    test('GET /health should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    test('POST /token without ID should fail', async () => {
        const res = await request(app).post('/token').send({});
        expect(res.statusCode).toBe(400);
    });

    test('POST /token with ID should return token', async () => {
        const res = await request(app)
            .post('/token')
            .send({ id: 'test-device', name: 'Test Device' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();

        // Cleanup
        registry.remove('test-device');
    });
});
