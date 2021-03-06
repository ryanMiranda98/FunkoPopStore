const supertest = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const app = require('../src/app');
const FunkoPops = require('../src/models/FunkPop');
const dummyData = require('../data/dummy.js');

const request = supertest(app);
const dbConfig = config.get('database');

beforeAll(async () => {
	await mongoose.connect(dbConfig.url);
});

const addPopsToDB = async (length = 5) => {
	for (let i = 0; i < length; i++) {
		await FunkoPops.create(dummyData[i]);
	}
};

const getAllPops = async () => {
	const pops = await FunkoPops.find();
	return pops;
};

describe('Funko pops listing', () => {
	it('should return 200 OK when requesting for list of funko pops', async () => {
		const response = await request.get('/api/1.0/funkopops');
		expect(response.status).toBe(200);
	});

	it('should return 200 OK when requesting for list of funko pops and list size is 0', async () => {
		const response = await request.get('/api/1.0/funkopops');
		expect(response.status).toBe(200);
		expect(response.body.size).toBe(0);
	});

	it('should return fields id, name, price, quantity, description, instock, reviews when funko pops are present in DB', async () => {
		await addPopsToDB(5);
		const response = await request.get('/api/1.0/funkopops');
		expect(Object.keys(response.body.funkopops[0])).toEqual([
			'_id',
			'title',
			'price',
			'description',
			'quantity',
			'instock',
			'reviews'
		]);
	});

	it('should return size when funko pops are present in DB', async () => {
		await addPopsToDB(5);
		const response = await request.get('/api/1.0/funkopops');
		expect(response.body.size).toBe(5);
	});

	it('should return 200 OK for requested funko pop', async () => {
		await addPopsToDB(5);
		const pops = await getAllPops();

		const popID = pops[0].id;
		const response = await request.get(`/api/1.0/funkopops/${popID}`);
		expect(response.status).toBe(200);
	});

	it('should return fields id, name, price, quantity, description, instock, reviews for single funkopop', async () => {
		await addPopsToDB(5);
		const pops = await getAllPops();

		const popID = pops[0].id;
		const response = await request.get(`/api/1.0/funkopops/${popID}`);
		expect(Object.keys(response.body.funkopop)).toEqual([
			'_id',
			'title',
			'price',
			'description',
			'quantity',
			'instock',
			'reviews'
		]);
	});

	it('should return 404 OK if requested funko pop doesn\'t exist', async () => {
		const popID = '61503ae7f4a6fb0b9bb9a218';
		const response = await request.get(`/api/1.0/funkopops/${popID}`);
		expect(response.status).toBe(404);
	});

	it('should return message Funko Pop not found if requested funko pop doesn\'t exist', async () => {
		const popID = '61503ae7f4a6fb0b9bb9a218';
		const response = await request.get(`/api/1.0/funkopops/${popID}`);
		expect(response.body.message).toBe('Sorry! Requested Funko Pop not found');
	});

	it('should return 404 OK if requested funko pop has invalid id (CAST Error)', async () => {
		const popID = '61503ae7f4a6bb9a218';
		const response = await request.get(`/api/1.0/funkopops/${popID}`);
		expect(response.status).toBe(404);
	});

	it('should return Funko Pop with Invalid Id message if requested funko pop has invalid id (CAST Error)', async () => {
		const popID = '61503ae7f4a6bb9a218';
		const response = await request.get(`/api/1.0/funkopops/${popID}`);
		expect(response.body.message).toBe(
			'Sorry! You have provided an invalid resource ID'
		);
	});
});

afterEach(async () => {
	await FunkoPops.deleteMany();
});

afterAll(async () => {
	await mongoose.disconnect();
});
