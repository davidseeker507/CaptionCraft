const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const cors = require('cors');

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
    // Delete the original video file after audio extraction
    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn('Failed to delete video file:', filePath, err.message);
      }
    });
    res.json({ audioFilePath });
  });
});

// Transcription endpoint
app.post('/transcribe', async (req, res) => {
  const { audioFilePath } = req.body;
  if (!audioFilePath) {
    return res.status(400).json({ error: 'No audio file path provided' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const FormData = require('form-data');
    const formData = new FormData();
    const fs = require('fs');
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    // Optionally, you can set language or other params here

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    console.error('Transcription error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Transcription failed', details: error.response ? error.response.data : error.message });
  }
});

// SRT conversion endpoint
app.post('/srt', (req, res) => {
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

  // Delete the audio file after SRT generation, if provided
  if (audioFilePath) {
    fs.unlink(audioFilePath, (err) => {
      if (err) {
        console.warn('Failed to delete audio file:', audioFilePath, err.message);
      }
    });
  }
});

app.use(cors()); 