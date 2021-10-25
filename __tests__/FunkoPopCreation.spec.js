const supertest = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const app = require('../src/app');
const FunkoPops = require('../src/models/FunkPop');
const User = require('../src/models/User');
const { hashPassword, generateJWT } = require('../src/utils/generators');

const request = supertest(app);
const dbConfig = config.get('database');

beforeAll(async () => {
	await mongoose.connect(dbConfig.url);
});

const funkoPopItem = {
	title: 'Marvel: WandaVision - Halloween Wanda',
	price: 7.2,
	description: 'Funko pop of halloween wanda',
	quantity: '100'
};

const validUser = {
	email: 'johndoe@test.com',
	password: 'test1234'
};

const createAdmin = async () => {
	const hash = await hashPassword(validUser.password);
	return User.create({
		...validUser,
		password: hash,
		role: 'admin'
	});
};

const createUser = async () => {
	const hash = await hashPassword(validUser.password);
	return User.create({
		...validUser,
		password: hash,
		role: 'user'
	});
};

const createFunkoPopRequest = async (body, options = {}) => {
	const agent = request.post('/api/1.0/funkopops');
	if (options.token) {
		agent.set('authorization', options.token);
	}

	return agent.send(body);
};

describe('Create funko pops', () => {
	it('should return 201 when funko pop is created when role is admin', async () => {
		const admin = await createAdmin();
		const jwtToken = await generateJWT(admin.id);
		const token = `Bearer ${jwtToken}`;

		const response = await createFunkoPopRequest(funkoPopItem, {
			token: token
		});
		expect(response.status).toBe(201);
	});

	it('should return fields title, price, description, quantity, instock, reviews, _id and __v when creating funkopop with valid body and role is admin', async () => {
		const admin = await createAdmin();
		const jwtToken = await generateJWT(admin.id);
		const token = `Bearer ${jwtToken}`;

		const response = await createFunkoPopRequest(funkoPopItem, {
			token: token
		});
		expect(Object.keys(response.body.funkopop)).toEqual([
			'title',
			'price',
			'description',
			'quantity',
			'instock',
			'reviews',
			'_id',
			'__v'
		]);
	});

	it('should return 400 when funko pop is being created and body is not valid and role is admin', async () => {
		const admin = await createAdmin();
		const jwtToken = await generateJWT(admin.id);
		const token = `Bearer ${jwtToken}`;

		const response = await createFunkoPopRequest(null, { token: token });
		expect(response.status).toBe(400);
	});

	it('should return path, timestamp, message and validationErrors field when funkopop is being created and body is not valid and role is admin', async () => {
		const admin = await createAdmin();
		const jwtToken = await generateJWT(admin.id);
		const token = `Bearer ${jwtToken}`;

		const preRequestTimestamp = new Date().getTime();
		const response = await createFunkoPopRequest(null, { token: token });
		expect(Object.keys(response.body)).toEqual([
			'path',
			'timestamp',
			'message',
			'validationErrors'
		]);

		expect(response.body.path).toBe('/api/1.0/funkopops');
		expect(response.body.message).toBe('Validation Failure');
		expect(response.body.timestamp).toBeGreaterThan(preRequestTimestamp);
	});

	it('should return 403 when funko pop is being created and body is valid and role is user', async () => {
		const user = await createUser();
		const jwtToken = await generateJWT(user.id);
		const token = `Bearer ${jwtToken}`;

		const response = await createFunkoPopRequest(funkoPopItem, {
			token: token
		});
		expect(response.status).toBe(403);
	});

	it('should return path, timestamp and message field when funkopop is being created and body is not valid and role is user', async () => {
		const user = await createUser();
		const jwtToken = await generateJWT(user.id);
		const token = `Bearer ${jwtToken}`;

		const preRequestTimestamp = new Date().getTime();
		const response = await createFunkoPopRequest(null, { token: token });
		expect(Object.keys(response.body)).toEqual([
			'path',
			'timestamp',
			'message',
			'validationErrors'
		]);

		expect(response.body.path).toBe('/api/1.0/funkopops');
		expect(response.body.message).toBe(
			'You are forbidden to access this route'
		);
		expect(response.body.timestamp).toBeGreaterThan(preRequestTimestamp);
		expect(Object.keys(response.body.validationErrors).length).toBe(0);
	});

	it.each`
    field            | value              | message
    ${'title'}       | ${null}            | ${'Cannot create funko pop without title!'}
    ${'title'}       | ${''}              | ${'Cannot create funko pop without title!'}
    ${'title'}       | ${'h3fh34'}        | ${'Title has to be 10-50 characters long'}
    ${'title'}       | ${'h'.repeat(51)}  | ${'Title has to be 10-50 characters long'}
    ${'price'}       | ${null}            | ${'Cannot create funko pop without price!'}
    ${'price'}       | ${'asb3'}          | ${'Price has to be numeric'}
    ${'description'} | ${null}            | ${'Cannot create funko pop without decription!'}
    ${'description'} | ${'Testdesc'}      | ${'Description has to be 10-250 characters long'}
    ${'description'} | ${'T'.repeat(251)} | ${'Description has to be 10-250 characters long'}
    ${'quantity'}    | ${null}            | ${'Cannot create funko pop without quantity!'}
    ${'quantity'}    | ${'asb4'}          | ${'Quantity has to be numeric'}
  `(
		'returns $message when creating funko pop with $value as value in field $field when role is admin',
		async ({ field, value, message }) => {
			const invalidBody = { ...funkoPopItem };
			invalidBody[field] = value;

			const admin = await createAdmin();
			const jwtToken = await generateJWT(admin.id);
			const token = `Bearer ${jwtToken}`;

			const response = await createFunkoPopRequest(invalidBody, {
				token: token
			});
			expect(response.body.validationErrors[field]).toBe(message);
		}
	);
});

afterEach(async () => {
	await FunkoPops.deleteMany();
	await User.deleteMany();
});

afterAll(async () => {
	await mongoose.disconnect();
});
