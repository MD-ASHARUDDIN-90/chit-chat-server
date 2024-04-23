const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('../models/userModel');

async function login(req, res) {
  const JWT_SECRET_KEY = "mysecretkey"
  const { username, password } = req.body;
 

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await Users.findOne({ username });
  
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const match = await bcrypt.compare(password, user.password);     
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ username: user.username }, JWT_SECRET_KEY, { expiresIn: '1h' });
    res.json({ username: user.username, email:user.email, createdAt:user.createdAt, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function signup(req, res) {
 const { username, email, password } = req.body;
 if (!username || !email || !password) {
   return res.status(400).json({ message: 'Username, email, and password are required' });
 }

 try {
    
   const existingUser = await Users.findOne({ $or: [{ username }, { email }] });
   if (existingUser) {
     return res.status(409).json({ message: 'Username or email already exists' });
   }
   const hashedPassword = await bcrypt.hash(password, 10);
   const newUser = new Users({ username, email, password: hashedPassword });
 
   await newUser.save();
   res.status(201).json({ username: newUser.username });
 } catch (error) {
   console.error('Signup error:', error);
   res.status(500).json({ message: 'Internal server error' });
 }
}


module.exports = { login, signup};
