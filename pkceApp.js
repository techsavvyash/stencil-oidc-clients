// Required imports
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
const crypto = require('crypto');

const app = express();

// Function to generate code verifier and code challenge
function generateCodeVerifier() {
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  // Create a SHA256 hash of the codeVerifier and base64-url encode it
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { codeVerifier, codeChallenge };
}

// Passport configuration
passport.use(new OpenIDConnectStrategy({
    issuer: 'http://localhost:3001/oidc',
    authorizationURL: 'http://localhost:3001/oidc/auth',
    tokenURL: 'http://localhost:3001/oidc/token',
    userInfoURL: 'http://localhost:3001/oidc/me',
    clientID: 'sampleApplicationIII',
    clientSecret: 'sampleApplicationIII-secret-key',
    callbackURL: 'http://localhost:3000/auth/callback',
    scope: 'openid profile email',
    passReqToCallback: true, // Allows passing req object to the callback
  },
  (req, issuer, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
    if (!profile || Object.keys(profile).length === 0) {
      profile = {
        id: jwtClaims.sub,
        displayName: jwtClaims.name || jwtClaims.preferred_username || 'Unknown User',
        email: jwtClaims.email || 'Unknown Email'
      };
    }
    return done(null, profile);
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware configuration
app.set('view engine', 'ejs');
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/auth', (req, res, next) => {
  // Generate code verifier and challenge
  const { codeVerifier, codeChallenge } = generateCodeVerifier();

  // Store codeVerifier in the session
  req.session.codeVerifier = codeVerifier;

  // Construct authorization URL with PKCE parameters
  const authUrl = `http://localhost:3001/oidc/auth?` +
    `client_id=sampleApplicationIII` +
    `&response_type=code` +
    `&scope=openid profile email` +
    `&redirect_uri=http://localhost:3000/auth/callback` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  // Redirect user to the authorization URL
  res.redirect(authUrl);
});

app.get('/auth/callback', 
  (req, res, next) => {
    req.query.code_verifier = req.session.codeVerifier; // Attach code_verifier from session
    passport.authenticate('openidconnect', { failureRedirect: '/' })(req, res, next);
  },
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
