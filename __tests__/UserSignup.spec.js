const supertest = require('supertest');
const mongoose = require('mongoose');
const config = require('config');
const app = require('../src/app');
const User = require('../src/models/User');
const { hashPassword, comparePassword } = require('../src/utils/generators');

const request = supertest(app);
const dbConfig = config.get('database');

const validUser = {
	email: 'johndoe@test.com',
	password: 'test1234'
};

beforeAll(async () => {
	await mongoose.connect(dbConfig.url);
});

describe('User signup', () => {
	it('should return 201 when user signs up successfully', async () => {
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		expect(response.status).toBe(201);
	});

	it('should create a user when valid input is given', async () => {
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		const users = await User.find();

		expect(users[0].id).toBe(response.body.user._id);
		expect(users.length).toBe(1);
	});

	it('should return the fields email, password, role, active, _id and __v when user is created', async () => {
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		const user = response.body.user;

		expect(Object.keys(user)).toEqual([
			'email',
			'password',
			'role',
			'active',
			'_id',
			'__v'
		]);
	});

	it('should save hashed password of user in the DB when a user is created', async () => {
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		const user = response.body.user;
		expect(user.password).not.toBe(validUser.password);
	});

	it('should assign created users role as user and active as false', async () => {
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		const user = response.body.user;
		expect(user.role).toBe('user');
		expect(user.active).toBeFalsy();
	});

	it('should not change users role and active field when it is changed in the request body', async () => {
		const response = await request
			.post('/api/1.0/auth/signup')
			.send({ ...validUser, role: 'admin', active: true });
		const user = response.body.user;
		expect(user.role).toBe('user');
		expect(user.active).toBeFalsy();
	});

	it('should return 400 when invalid email is sent in signup request body', async () => {
		const response = await request
			.post('/api/1.0/auth/signup')
			.send({ ...validUser, email: '' });
		expect(response.status).toBe(400);
	});

	it('should return 400 when invalid password is sent in signup request body', async () => {
		const response = await request
			.post('/api/1.0/auth/signup')
			.send({ ...validUser, password: '' });
		expect(response.status).toBe(400);
	});

	it('should return path, timestamp, message and validationErrors field when signup request body is not valid', async () => {
		const preRequestTimestamp = new Date().getTime();
		const response = await request.post('/api/1.0/auth/signup').send();
		expect(Object.keys(response.body)).toEqual([
			'path',
			'timestamp',
			'message',
			'validationErrors'
		]);

		expect(response.body.path).toBe('/api/1.0/auth/signup');
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
		'returns $message for field $field when value is $value',
		async ({ field, value, message }) => {
			const invalidUser = { ...validUser };
			invalidUser[field] = value;

			const response = await request
				.post('/api/1.0/auth/signup')
				.send(invalidUser);
			expect(response.body.validationErrors[field]).toBe(message);
		}
	);

	it('returns 400 if user email already exists when signing up', async () => {
		await request.post('/api/1.0/auth/signup').send(validUser);
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		expect(response.status).toBe(400);
	});

	it('returns message `A user already exists with that email` if user already exists when signing up', async () => {
		await request.post('/api/1.0/auth/signup').send(validUser);
		const response = await request.post('/api/1.0/auth/signup').send(validUser);
		expect(response.body.message).toBe('A user already exists with that email');
	});
});

describe('Hash password', () => {
	it('should hash password when input is given', async () => {
		const password = 'test1234';
		const hash = await hashPassword(password);

		expect(hash).toBeDefined();
		expect(hash).not.toBe(password);
	});

	it('should return null if no input is given', async () => {
		const hash = await hashPassword();
		expect(hash).toBeNull();
	});

	it('should return true if passwords match when compared', async () => {
		const hash = await hashPassword('test1234');
		const passwordsMatch = await comparePassword('test1234', hash);
		expect(passwordsMatch).toBeTruthy();
	});

	it('should return false if passwords don\'t match when compared', async () => {
		const hash = await hashPassword('test1234');
		const passwordsMatch = await comparePassword('test12', hash);
		expect(passwordsMatch).toBeFalsy();
	});

	it('should return false if password is not inputted', async () => {
		const hash = await hashPassword('test1234');
		const passwordsMatch = await comparePassword(null, hash);
		expect(passwordsMatch).toBeFalsy();
	});

	it('should return false if savedPassword is not inputted', async () => {
		const passwordsMatch = await comparePassword('test1234', null);
		expect(passwordsMatch).toBeFalsy();
	});

	it('should return false if password and savedPassword is not inputted', async () => {
		const passwordsMatch = await comparePassword(null, null);
		expect(passwordsMatch).toBeFalsy();
	});
});

afterEach(async () => {
	await User.deleteMany();
});

afterAll(async () => {
	await mongoose.disconnect();
});
