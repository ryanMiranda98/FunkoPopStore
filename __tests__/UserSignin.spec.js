const supertest = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const app = require('../src/app');
const User = require('../src/models/User');
const { hashPassword, generateJWT } = require('../src/utils/generators');
const { isAuthenticated } = require('../src/middleware/auth');

const request = supertest(app);
const dbConfig = config.get('database');

const validUser = {
	email: 'johndoe@test.com',
	password: 'test1234'
};

beforeAll(async () => {
	await mongoose.connect(dbConfig.url);
});

describe('User signin - JWT Strategy', () => {
	it('should return 200 OK when user signs in with valid request', async () => {
		const hash = await hashPassword(validUser.password);
		await User.create({ ...validUser, password: hash });

		const response = await request.post('/api/1.0/auth/signin').send(validUser);
		expect(response.status).toBe(200);
	});

	it('should return token and user with fields email, role, active, _id and __v in the response', async () => {
		const hash = await hashPassword(validUser.password);
		await User.create({ ...validUser, password: hash });

		const response = await request.post('/api/1.0/auth/signin').send(validUser);
		expect(response.body.token).toBeDefined();
		expect(Object.keys(response.body.user)).toEqual([
			'_id',
			'email',
			'role',
			'active',
			'__v'
		]);
	});

	it('should return 400 when request body is invalid', async () => {
		const response = await request.post('/api/1.0/auth/signin').send();
		expect(response.status).toBe(400);
	});

	it('should return path, timestamp, message and validationErrors field when signin request body is not valid', async () => {
		const preRequestTimestamp = new Date().getTime();
		const response = await request.post('/api/1.0/auth/signin').send();
		expect(Object.keys(response.body)).toEqual([
			'path',
			'timestamp',
			'message',
			'validationErrors'
		]);

		expect(response.body.path).toBe('/api/1.0/auth/signin');
		expect(response.body.message).toBe('Validation Failure');
		expect(response.body.timestamp).toBeGreaterThan(preRequestTimestamp);
	});

	it.each`
    field         | value            | message
    ${'email'}    | ${null}          | ${'Email cannot be empty'}
    ${'email'}    | ${''}            | ${'Email cannot be empty'}
    ${'email'}    | ${'abx@ayc@com'} | ${'Please provide a valid email address'}
    ${'email'}    | ${'abx.com'}     | ${'Please provide a valid email address'}
    ${'password'} | ${null}          | ${'Password cannot be empty'}
    ${'password'} | ${''}            | ${'Password cannot be empty'}
    ${'password'} | ${'test'}        | ${'Password must be atleast 8 characters long'}
  `(
		'returns $message when field $field is $value',
		async ({ field, value, message }) => {
			const invalidUser = { ...validUser };
			invalidUser[field] = value;

			const response = await request
				.post('/api/1.0/auth/signin')
				.send(invalidUser);
			expect(response.status).toBe(400);
			expect(response.body.validationErrors[field]).toBe(message);
		}
	);

	it('returns 400 status when user with inputted email is not found in db', async () => {
		const response = await request.post('/api/1.0/auth/signin').send(validUser);
		expect(response.status).toBe(400);
	});

	it('returns message `Invalid email or password` when user with inputted email is not found in db', async () => {
		const response = await request.post('/api/1.0/auth/signin').send(validUser);
		expect(response.body.message).toBe('Invalid email or password');
	});

	it('returns 400 status when inputted password does not match with users password in db', async () => {
		const invalidUser = { ...validUser, password: 'test123456' };
		const response = await request
			.post('/api/1.0/auth/signin')
			.send(invalidUser);
		expect(response.status).toBe(400);
	});

	it('returns message `Invalid email or password` when inputted password does not match with users password in db', async () => {
		const invalidUser = { ...validUser, password: 'test123456' };
		const response = await request
			.post('/api/1.0/auth/signin')
			.send(invalidUser);
		expect(response.body.message).toBe('Invalid email or password');
	});

	it('returns token when valid input is provided', async () => {
		const hash = await hashPassword(validUser.password);
		const user = await User.create({ ...validUser, password: hash });
		const token = await generateJWT(user.id);
		expect(token).toBeDefined();
	});

	it('returns message `Invalid id provided to generated JWT` when no id is provided', async () => {
		await expect(generateJWT()).rejects.toThrow('Invalid ID provided');
	});
});

describe('User isAuthenticated middleware', () => {
	// Unit testing isAuthenticated middleware
	it('calls next and returns isAuthenticated as true when req.user is valid', async () => {
		const hash = await hashPassword(validUser.password);
		const createdUser = await User.create({ ...validUser, password: hash });

		const user = await User.findById(createdUser.id).select('-password');
		const req = { user };
		const next = jest.fn();

		await isAuthenticated(req, {}, next);
		expect(next).toHaveBeenCalled();
		expect(req.isAuthenticated).toBeTruthy();
	});

	it('calls next, returns isAuthenticated as true and req.user when bearer token is valid', async () => {
		const hash = await hashPassword(validUser.password);
		const createdUser = await User.create({ ...validUser, password: hash });

		const user = await User.findById(createdUser.id).select('-password');
		const jwtToken = await generateJWT(user.id);
		const token = `Bearer ${jwtToken}`;

		const req = { headers: { authorization: token } };
		const next = jest.fn();

		await isAuthenticated(req, {}, next);
		expect(next).toHaveBeenCalled();
		expect(req.isAuthenticated).toBeTruthy();
		expect(req.user).toMatchObject(user);
	});

	// Integration testing isAuthenticated middleware
	it('returns 200 when user with Bearer token tries to get user', async () => {
		const hash = await hashPassword(validUser.password);
		const user = await User.create({ ...validUser, password: hash });

		const jwtToken = await generateJWT(user.id);
		const token = `Bearer ${jwtToken}`;

		const response = await request
			.get('/api/1.0/auth/get-user')
			.set('authorization', token);
		expect(response.status).toBe(200);
	});

	it('returns fields _id, email, role, active and __v when user with Bearer token tries to get user', async () => {
		const hash = await hashPassword(validUser.password);
		const user = await User.create({ ...validUser, password: hash });

		const jwtToken = await generateJWT(user.id);

		const token = `Bearer ${jwtToken}`;
		const response = await request
			.get('/api/1.0/auth/get-user')
			.set('authorization', token);
		expect(Object.keys(response.body.user)).toEqual([
			'_id',
			'email',
			'role',
			'active',
			'__v'
		]);
	});

	it('returns 401 when unauthenticated user tries to get user', async () => {
		const response = await request.get('/api/1.0/auth/get-user');
		expect(response.status).toBe(401);
	});

	it('returns path, timestamp, when unauthenticated user tries to get user', async () => {
		const preRequestTimestamp = new Date().getTime();
		const response = await request.get('/api/1.0/auth/get-user');

		expect(Object.keys(response.body)).toEqual([
			'path',
			'timestamp',
			'message',
			'validationErrors'
		]);

		expect(response.body.path).toBe('/api/1.0/auth/get-user');
		expect(response.body.message).toBe(
			'You are unauthorized to access this route'
		);
		expect(response.body.timestamp).toBeGreaterThan(preRequestTimestamp);
	});
});

afterEach(async () => {
	await User.deleteMany();
});

afterAll(async () => {
	await mongoose.disconnect();
});
