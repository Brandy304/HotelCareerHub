const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Validate role
    const validRoles = ['recruiter', 'jobseeker', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role type' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({ username, email, role });
    await User.register(user, password);
    
    res.status(201).json({ 
      message: 'Registration successful',
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify role match (if role is provided during login)
    if (req.body.role && user.role !== req.body.role) {
      return res.status(401).json({ error: 'Role mismatch' });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      return res.json({ 
        message: 'Login successful', 
        user: {
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    });
  })(req, res, next);
});

// Logout endpoint
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get user profile
router.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    createdAt: req.user.createdAt
  });
});

// Get users list endpoint
router.get('/list', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email role createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user information
router.get('/current', (req, res) => {
  if (req.isAuthenticated()) {
    const { _id, username, email, role } = req.user;
    res.json({ _id, username, email, role });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Middleware: Check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Please login first' });
}

// Middleware: Check if user is admin
function isAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Insufficient permissions' });
}

module.exports = router;
