const passport = require("passport");
const passportJWT = require("passport-jwt");
const ExtractJWT = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const User = require("../models/User");
const config = require("config");

const jwtConfig = config.get("jwt");

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secret
    },
    function (jwtPayload, done) {
      return User.findOne({ id: jwtPayload.id })
        .select("-password")
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
