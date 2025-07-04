const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const User = require('./models/User');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept all video mime types
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video file!'), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  }
});

// Allowed origins (adjust as needed)
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://caption-craft-gold.vercel.app'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('CORS not allowed'), false);
  },
  credentials: true,
}));

// Rate limit heavy endpoints (20 requests per 15 minutes per IP)
const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Utility to safely delete files
const safeUnlink = async (p) => {
  try {
    await fs.promises.unlink(p);
  } catch (_) {}
};

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

// Video processing endpoints
app.post('/upload', heavyLimiter, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

// Audio extraction endpoint
app.post('/extract-audio', heavyLimiter, async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'No video file path provided' });
  }

  const audioFileName = path.basename(filePath, path.extname(filePath)) + '.mp3';
  const audioFilePath = path.join(uploadDir, audioFileName);

  const ffmpegCmd = `ffmpeg -y -i "${filePath}" -vn -acodec libmp3lame -ar 44100 -ac 2 -ab 192k -f mp3 "${audioFilePath}"`;

  exec(ffmpegCmd, async (error, stdout, stderr) => {
    try {
      if (error) {
        console.error('ffmpeg error:', stderr);
        return res.status(500).json({ error: 'Audio extraction failed', details: stderr });
      }
      await safeUnlink(filePath);
      res.json({ audioFilePath });
    } catch (e) {
      res.status(500).json({ error: 'Internal error' });
    }
  });
});

// Transcription endpoint
app.post('/transcribe', heavyLimiter, async (req, res) => {
  const { audioFilePath } = req.body;
  if (!audioFilePath) {
    return res.status(400).json({ error: 'No audio file path provided' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    let msg = 'Transcription failed';
    if (error.response && error.response.data && error.response.data.error) {
      if (error.response.data.error.code === 'insufficient_quota') {
        msg = 'OpenAI quota exceeded. Please try again later.';
      }
    }
    console.error('Transcription error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: msg });
  } finally {
    await safeUnlink(audioFilePath);
  }
});

// SRT conversion endpoint
app.post('/srt', heavyLimiter, async (req, res) => {
  const { segments, audioFilePath } = req.body;
  if (!segments || !Array.isArray(segments)) {
    return res.status(400).json({ error: 'No segments provided' });
  }

  function toSrtTime(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    const ms = String(seconds % 1).substring(2, 5).padEnd(3, '0');
    return date.toISOString().substr(11, 8) + ',' + ms;
  }

  let srt = '';
  segments.forEach((seg, idx) => {
    srt += `${idx + 1}\n`;
    srt += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
    srt += `${seg.text.trim()}\n\n`;
  });

  res.setHeader('Content-disposition', 'attachment; filename=transcription.srt');
  res.setHeader('Content-Type', 'text/srt');
  res.send(srt);

  if (audioFilePath) {
    await safeUnlink(audioFilePath);
  }
});

// Authentication endpoints (existing code)
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google Sign-In endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password: 'google-oauth', createdAt: new Date() });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// ✅ Connect to MongoDB and only start the server if it succeeds
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; // Set this in your Render dashboard

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas!');
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});


