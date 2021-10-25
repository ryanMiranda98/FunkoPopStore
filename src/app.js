const express = require('express');
const config = require('config');
const funkopopRouter = require('./routes/funkopop');
const authRouter = require('./routes/auth');
const session = require('express-session');
const passport = require('./utils/passport');

const ErrorHandler = require('./errors/ErrorHandler');
const RouteNotFoundError = require('./errors/RouteNotFound');

const app = express();
const sessionConfig = config.get('session');

app.use(express.json());
app.use(
	session({
		saveUninitialized: true,
		resave: true,
		secret: `${sessionConfig.secret}`,
		cookie: { maxAge: sessionConfig.maxAge }
	})
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
	return res.status(200).json({
		message: 'Welcome to FunkoPops'
	});
});

app.use('/api/1.0/funkopops', funkopopRouter);
app.use('/api/1.0/auth', authRouter);

app.all('*', (req, res, next) => {
	return next(new RouteNotFoundError());
});

app.use(ErrorHandler);

module.exports = app;
