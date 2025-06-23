const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Accept all video types
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept all video mime types
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video file!'), false);
    }
  }
});

// Upload endpoint
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Respond with the file path for next steps
  res.json({ filePath: req.file.path });
});

// Audio extraction endpoint
app.post('/extract-audio', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'No video file path provided' });
  }

  const audioFileName = path.basename(filePath, path.extname(filePath)) + '.mp3';
  const audioFilePath = path.join(uploadDir, audioFileName);

  // ffmpeg command to extract audio
  const ffmpegCmd = `ffmpeg -y -i "${filePath}" -vn -acodec libmp3lame -ar 44100 -ac 2 -ab 192k -f mp3 "${audioFilePath}"`;

  exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('ffmpeg error:', stderr);
      return res.status(500).json({ error: 'Audio extraction failed', details: stderr });
    }
    res.json({ audioFilePath });
  });
}); 