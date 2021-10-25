const supertest = require('supertest');
const app = require('../src/app');

const request = supertest(app);

describe('App configuration', () => {
	it('should return 200 OK when route is /', async () => {
		const response = await request.get('/');
		expect(response.status).toBe(200);
	});

	it('should return Welcome message when route is /', async () => {
		const response = await request.get('/');
		expect(response.body.message).toBe('Welcome to FunkoPops');
	});

	it('should return 404 when route is not found', async () => {
		const response = await request.get('/funkopops');
		expect(response.status).toBe(404);
	});

	it('should return 404 not found message when route is not found', async () => {
		const response = await request.get('/funkopops');
		expect(response.body.message).toBe('Sorry! Route not found');
	});
});
