const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    console.log('User found, checking password...');
    
    // Check if the password is correct
    const isPasswordValid = await user.correctPassword(password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    console.log('Password valid, generating token...');
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    user.password = undefined;

    res.status(200).json({
      success: true,
      data: {
        accessToken: token,
        user
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Register (admin only)
router.post('/register', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can register new users'
      });
    }

    const newUser = await User.create(req.body);
    newUser.password = undefined;

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  // Implementation for refresh token would go here
  res.status(200).json({
    success: true,
    message: 'Refresh token endpoint'
  });
});

// Logout
router.post('/logout', auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;