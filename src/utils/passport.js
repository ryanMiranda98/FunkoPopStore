const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const User = require('../models/User');
const config = require('config');

const jwtConfig = config.get('jwt');
const googleConfig = config.get('google');

passport.use(
	new GoogleStrategy(
		{
			clientID: googleConfig.clientId,
			clientSecret: googleConfig.clientSecret,
			callbackURL: 'http://localhost:5000/api/1.0/auth/google/callback'
		},
		function (accessToken, refreshToken, profile, cb) {
			return User.findOne(
				{ googleId: profile.id, email: profile.emails[0].value },
				function (err, user) {
					if (err) {
						return cb(err, null);
					}

					if (!user) {
						return User.create({
							email: profile.emails[0].value,
							googleId: profile.id,
							username: profile.displayName
						}).then((user) => {
							return cb(null, user);
						});
					}

					return cb(null, user);
				}
			);
		}
	)
);

passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: jwtConfig.secret
		},
		function (jwtPayload, done) {
			return User.findOne({ id: jwtPayload.id })
				.select('-password')
				.then((user) => done(null, user))
				.catch((err) => done(err, null));
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, doc) => {
		if (err) {
			return done(err, null);
		}

		return done(null, doc);
	});
});

module.exports = passport;
