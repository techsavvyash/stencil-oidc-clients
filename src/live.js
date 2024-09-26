// app.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;

const app = express();

// Passport configuration
passport.use(new OpenIDConnectStrategy({
    issuer: 'http://localhost:3001/oidc',
    authorizationURL: 'http://localhost:3001/oidc/auth',
    tokenURL: 'http://localhost:3001/oidc/token',
    userInfoURL: 'http://localhost:3001/oidc/me',
    clientID: 'a12e98ec-9fef-4118-84a5-233556bcdb3a',
    clientSecret: `+fcXet9Iu2kQi61yWD9Tu4ReZ113P6yEAkr32v6WKOQ=`,
    callbackURL: 'http://localhost:3000/auth/callback',
    scope: 'openid'
  },
  (issuer, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
    // Log the profile, accessToken, and claims for debugging
    console.log("========================");
    console.log('OIDC Profile:', profile);
    console.log('JWT Claims:', jwtClaims);
    console.log('Access Token:', accessToken);

    // If profile is empty, manually populate it
    if (!profile || Object.keys(profile).length === 0) {
      profile = {
        id: jwtClaims.sub, // Usually the subject claim is the user identifier
        displayName: jwtClaims.name || jwtClaims.preferred_username || 'Unknown User',
        email: jwtClaims.email || 'Unknown Email'
      };
    }

    return done(null, profile);
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middlewares
app.set('view engine', 'ejs');
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/auth', passport.authenticate('openidconnect'));

app.get('/auth/callback',
  passport.authenticate('openidconnect', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/home');
  }
);

app.get('/home', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('home', { user: req.user });
  } else {
    res.redirect('/');
  }
});

// Logout route
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
