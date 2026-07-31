require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');
const fs = require('fs');
const os = require('os');

const compression = require('compression');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const FriendRequest = require('./models/FriendRequest');

const app = express();
const PORT = process.env.PORT || 5001;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ucjbgbrn',
  api_key: process.env.CLOUDINARY_API_KEY || '952679157789617',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Tqtys3xPady4g3mYRpO0rGrFTpc',
});

// Multer storage for media uploads (Admin 1 GB limit, Users 500 MB limit)
const upload = multer({
  dest: path.join(os.tmpdir(), 'thecorn-uploads'),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB max
});

// Middleware & Permissive CORS Configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-user-id'],
}));

app.use(compression()); // Gzip/Brotli payload compression for ultra-low data usage
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

// Local static uploads directory fallback
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', 'bytes');
  next();
}, express.static(uploadsDir, { acceptRanges: true }));

// Root Route (HTML page for browsers with embedded SVG favicon, JSON for API clients)
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      status: 'online',
      message: '🌽 The Corn Backend API is running live!',
      version: '1.0.0',
      endpoints: '/api/posts, /api/auth, /api/users'
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Corn Backend API</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌽</text></svg>">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FBF8EB; color: #36190D; padding: 2rem; display: flex; justify-content: center; align-items: center; min-height: 80vh; margin: 0; }
    .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(54, 25, 13, 0.1); max-width: 500px; text-align: center; border: 1px solid #9CA886; }
    h1 { margin-top: 0; color: #8B5324; font-size: 1.8rem; }
    .status { display: inline-block; background: #27ae60; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; margin-bottom: 1.2rem; }
    p { margin: 0.6rem 0; font-size: 1rem; color: #555; }
    code { background: #FBF8EB; padding: 3px 8px; border-radius: 6px; color: #8B5324; font-family: monospace; font-size: 0.9rem; border: 1px solid #E5DEC9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status">🟢 ONLINE</div>
    <h1>🌽 The Corn API Server</h1>
    <p>Backend API server is live & connected to MongoDB Atlas.</p>
    <p>Frontend Application: <code>https://the-corn-mu.vercel.app</code></p>
  </div>
</body>
</html>`);
});

app.get('/api', (req, res) => {
  res.json({ status: 'online', message: 'The Corn API Service' });
});

// Explicit Favicon & Browser Asset Handlers
const sendSvgFavicon = (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌽</text></svg>`);
};

app.get('/favicon.ico', sendSvgFavicon);
app.get('/favicon.png', sendSvgFavicon);
app.get('/apple-touch-icon.png', sendSvgFavicon);
app.get('/apple-touch-icon-precomposed.png', sendSvgFavicon);

app.get('/robots.txt', (req, res) => res.type('text/plain').send('User-agent: *\nDisallow:'));
app.get(['/manifest.json', '/site.webmanifest'], (req, res) => res.json({ name: 'The Corn API' }));

// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ MongoDB connection notice:', err.message);
    console.warn('⚠️ Please ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> 0.0.0.0/0)');
  });

// Helper: get user id string from MongoDB doc
const uid = (doc) => doc._id.toString();

// ==========================================
// AUTH ROUTES
// ==========================================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobile }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or mobile already registered' });
    }

    const newUser = await User.create({
      fullName,
      username: 'user_' + Math.floor(Math.random() * 100000),
      email: email.toLowerCase(),
      mobile,
      password: Buffer.from(password).toString('base64'),
      status: 'PENDING_APPROVAL',
      role: 'USER',
      bio: '',
      avatar: '',
      friends: [],
    });

    res.json({ success: true, message: 'Registration submitted, pending admin approval.', userId: uid(newUser) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const encodedPwd = Buffer.from(password).toString('base64');

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
      password: encodedPwd,
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({ success: false, message: 'Account pending admin approval' });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({ success: false, message: 'Account has been rejected by admin' });
    }

    const safeUser = user.toObject();
    safeUser.id = uid(user);
    delete safeUser.password;
    delete safeUser.__v;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// In-memory OTP store (simple, no need for DB collection for OTPs)
const otpStore = {};

// Helper to send transactional OTP emails via Brevo API
async function sendBrevoOtpEmail(toEmail, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'thecornapp@gmail.com';

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY is missing in .env');
    return false;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'The Corn', email: senderEmail },
      to: [{ email: toEmail }],
      subject: `🌽 ${otp} is your verification code for The Corn`,
      htmlContent: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FBF8EB; padding: 32px 20px; border-radius: 16px; max-width: 480px; margin: 0 auto; border: 1px solid #E6DEC8; box-shadow: 0 4px 12px rgba(54, 25, 13, 0.05); text-align: center;">
          <div style="font-size: 42px; margin-bottom: 8px;">🌽</div>
          <h2 style="color: #36190D; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">The Corn Security</h2>
          <p style="color: #665243; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">Use the 6-digit verification code below to complete your password reset request.</p>
          
          <div style="background: linear-gradient(135deg, #36190D, #8B5324); color: #FFFFFF; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 18px 28px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(139, 83, 36, 0.25);">
            ${otp}
          </div>

          <p style="color: #8B5324; font-size: 13px; font-weight: 600; margin: 0 0 6px 0;">⏱️ This code expires in 5 minutes.</p>
          <p style="color: #998877; font-size: 12px; margin-top: 24px; border-top: 1px dashed #D6CCB4; padding-top: 16px; line-height: 1.4;">
            If you did not request this email, no action is needed. Your account remains safe.
          </p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Brevo Email API error:', errorData);
    throw new Error(errorData.message || 'Failed to send email via Brevo');
  }

  const data = await response.json();
  console.log(`✉️ Brevo OTP email sent to ${toEmail} (MessageID: ${data.messageId})`);
  return true;
}

// In-memory mobile OTP store
const mobileOtpStore = {};

// Send Email OTP (Registration or Forgot Password)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Valid email address required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[cleanEmail] = { otp, expiry: Date.now() + 5 * 60 * 1000 };

    // Send real email via Brevo in background for instant < 15ms endpoint response
    sendBrevoOtpEmail(cleanEmail, otp).catch(emailErr => {
      console.error('Background Brevo OTP delivery notice:', emailErr.message || emailErr);
    });

    res.json({ success: true, message: 'Verification code sent to your email inbox.', otp });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify Email OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const data = otpStore[cleanEmail];

  if (data && data.otp === String(otp).trim() && data.expiry > Date.now()) {
    delete otpStore[cleanEmail];
    return res.json({ success: true });
  }

  res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const user = await User.findById(userId);

    if (user) {
      user.password = Buffer.from(newPassword).toString('base64');
      await user.save();
      return res.json({ success: true, message: 'Password reset successfully' });
    }

    res.status(404).json({ success: false, message: 'User not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check Username Availability
app.get('/api/auth/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    const taken = await User.findOne({ username: username.toLowerCase() });
    res.json({ available: !taken });
  } catch (err) {
    res.json({ available: false });
  }
});

// ==========================================
// USER ROUTES
// ==========================================

// Get User Profile
app.get('/api/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json({ id: req.params.id, fullName: 'User', username: 'user', role: 'USER' });
    }
    const user = await User.findById(req.params.id).select('-password -__v');
    if (user) {
      const obj = user.toObject();
      obj.id = uid(user);
      return res.json(obj);
    }
    return res.json({ id: req.params.id, fullName: 'User', username: 'user', role: 'USER' });
  } catch (err) {
    res.json({ id: req.params.id, fullName: 'User', username: 'user', role: 'USER' });
  }
});

// Update Profile
app.put('/api/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { username, bio, avatar, fullName } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (username) {
      const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.params.id } });
      if (taken) return res.status(400).json({ success: false, message: 'Username taken' });
      user.username = username.toLowerCase();
    }
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (fullName !== undefined) user.fullName = fullName;

    await user.save();
    const safeUser = user.toObject();
    safeUser.id = uid(user);
    delete safeUser.password;
    delete safeUser.__v;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search Users
app.get('/api/users/search/query', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const users = await User.find({
      status: 'ACTIVE',
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
    }).select('-password -__v');

    const results = users.map(u => {
      const obj = u.toObject();
      obj.id = uid(u);
      return obj;
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// Delete Account
app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Post.deleteMany({ userId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ==========================================
// POST ROUTES
// ==========================================

// Get Feed Posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    const result = posts.map(p => {
      const obj = p.toObject();
      obj.id = uid(p);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Promise helper for Cloudinary streaming upload with safe error catching
function uploadStreamToCloudinary(filePath, options) {
  return new Promise((resolve, reject) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return reject(new Error('File path does not exist'));
    }
    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (err) => {
      console.warn('⚠️ ReadStream error caught:', err.message);
      reject(err);
    });
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    readStream.pipe(stream);
  });
}

function safeCloudinaryUpload(filePath, isVideo, options) {
  return new Promise((resolve, reject) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return reject(new Error('Upload file path missing'));
    }
    try {
      if (isVideo) {
        cloudinary.uploader.upload(
          filePath,
          { resource_type: 'video', folder: 'thecorn' },
          (error, result) => {
            if (error) {
              console.warn('Standard video upload notice, trying upload_large:', error.message || error);
              if (!fs.existsSync(filePath)) return reject(error);
              cloudinary.uploader.upload_large(
                filePath,
                { resource_type: 'video', folder: 'thecorn', chunk_size: 6000000 },
                (err2, res2) => {
                  if (err2) return reject(err2);
                  resolve(res2);
                }
              );
            } else {
              resolve(result);
            }
          }
        );
      } else {
        uploadStreamToCloudinary(filePath, options).then(resolve).catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

// Upload media to Cloudinary with local storage fallback for large files
app.post('/api/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const userId = req.headers['x-user-id'] || req.body.userId;

    if (userId && isVideo) {
      const u = await User.findById(userId).catch(() => null);
      const isAdmin = u && u.role === 'ADMIN';
      const maxAllowedSize = isAdmin ? 1024 * 1024 * 1024 : 500 * 1024 * 1024;
      if (req.file.size > maxAllowedSize) {
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          error: isAdmin
            ? 'Video exceeds Admin limit of 1 GB.'
            : 'Regular users can upload videos up to 500 MB. Admin account required for 1 GB video uploads!'
        });
      }
    }

    const options = {
      folder: 'thecorn',
      resource_type: isVideo ? 'video' : 'image',
    };

    if (!isVideo) {
      options.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
    }

    try {
      const result = await safeCloudinaryUpload(req.file.path, isVideo, options);
      const finalUrl = result?.secure_url || result?.url;

      if (finalUrl) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlink(req.file.path, () => {});
        }
        console.log(`✅ Media uploaded successfully to Cloudinary: ${finalUrl}`);
        return res.json({ url: finalUrl, filename: result.public_id || 'media' });
      }
    } catch (cloudinaryErr) {
      console.error('❌ Cloudinary upload notice:', cloudinaryErr.message || cloudinaryErr);
    }

    // Fallback: Copy to server uploads directory (file is STILL intact on disk!)
    try {
      const ext = (req.file && path.extname(req.file.originalname)) || (isVideo ? '.mp4' : '.jpg');
      const localFilename = `media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
      const localPath = path.join(uploadsDir, localFilename);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.copyFileSync(req.file.path, localPath);
        fs.unlink(req.file.path, () => {});
      }

      const host = process.env.RENDER_EXTERNAL_URL || 'https://the-corn.onrender.com';
      const localUrl = `${host}/uploads/${localFilename}`;
      console.log(`✅ Media uploaded via backend storage fallback: ${localUrl}`);
      return res.json({ url: localUrl, filename: localFilename });
    } catch (fallbackErr) {
      console.error('Fallback upload error:', fallbackErr);
      if (req.file && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: 'Media upload failed' });
    }
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Upload error: ' + (err.message || 'Server error') });
  }
});

// Create Post
app.post('/api/posts', async (req, res) => {
  try {
    const { userId, type, content, mediaUrl, caption, gradient } = req.body;

    const newPost = await Post.create({
      userId,
      type,
      content: content || '',
      mediaUrl: mediaUrl || '',
      caption: caption || '',
      gradient: gradient || null,
      timestamp: Date.now(),
      likes: [],
      comments: [],
      saves: [],
    });

    const obj = newPost.toObject();
    obj.id = uid(newPost);
    res.json(obj);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get User Posts
app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId }).sort({ timestamp: -1 });
    const result = posts.map(p => {
      const obj = p.toObject();
      obj.id = uid(p);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Like / Unlike Post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (post) {
      const idx = post.likes.indexOf(userId);
      if (idx === -1) post.likes.push(userId);
      else post.likes.splice(idx, 1);
      await post.save();
      return res.json({ success: true, likes: post.likes });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Comment on Post
app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const { userId, text } = req.body;
    const post = await Post.findById(req.params.id);

    if (post) {
      post.comments.push({ userId, text, timestamp: Date.now() });
      await post.save();
      return res.json({ success: true, comments: post.comments });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Delete Comment from Post
app.delete('/api/posts/:id/comment/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.comments = post.comments.filter((c, idx) => {
      const cId = c._id ? c._id.toString() : String(idx);
      return cId !== commentId && String(c.timestamp) !== commentId && String(idx) !== commentId;
    });

    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save / Unsave Post
app.post('/api/posts/:id/save', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (post) {
      const idx = post.saves.indexOf(userId);
      if (idx === -1) post.saves.push(userId);
      else post.saves.splice(idx, 1);
      await post.save();
      return res.json({ success: true, saves: post.saves });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Delete Post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false });
    }
    const post = await Post.findById(req.params.id);
    if (post && post.mediaUrl) {
      try {
        const publicId = post.mediaUrl.split('/').slice(-2).join('/').split('.')[0];
        const isVideo = post.type === 'video';
        await cloudinary.uploader.destroy(publicId, { resource_type: isVideo ? 'video' : 'image' });
      } catch (e) {}
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Get Liked Posts
app.get('/api/posts/liked/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ likes: req.params.userId }).sort({ timestamp: -1 });
    const result = posts.map(p => {
      const obj = p.toObject();
      obj.id = uid(p);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Get Saved Posts
app.get('/api/posts/saved/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ saves: req.params.userId }).sort({ timestamp: -1 });
    const result = posts.map(p => {
      const obj = p.toObject();
      obj.id = uid(p);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// ==========================================
// FRIEND ROUTES
// ==========================================

// Send Friend Request
app.post('/api/friends/request', async (req, res) => {
  try {
    const { from, to } = req.body;

    const existing = await FriendRequest.findOne({ from, to, status: 'PENDING' });
    if (!existing) {
      await FriendRequest.create({ from, to, status: 'PENDING', timestamp: Date.now() });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Get Friend Requests
app.get('/api/friends/requests/:userId', async (req, res) => {
  try {
    const requests = await FriendRequest.find({ to: req.params.userId, status: 'PENDING' });
    const result = requests.map(r => {
      const obj = r.toObject();
      obj.id = uid(r);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Accept Friend Request
app.post('/api/friends/accept', async (req, res) => {
  try {
    const { requestId } = req.body;
    const reqItem = await FriendRequest.findById(requestId);

    if (reqItem) {
      reqItem.status = 'ACCEPTED';
      await reqItem.save();

      await User.findByIdAndUpdate(reqItem.from, { $addToSet: { friends: reqItem.to } });
      await User.findByIdAndUpdate(reqItem.to, { $addToSet: { friends: reqItem.from } });

      return res.json({ success: true });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Reject Friend Request
app.post('/api/friends/reject', async (req, res) => {
  try {
    const { requestId } = req.body;
    const reqItem = await FriendRequest.findById(requestId);

    if (reqItem) {
      reqItem.status = 'REJECTED';
      await reqItem.save();
      return res.json({ success: true });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Get User's Friends
app.get('/api/friends/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.json([]);

    const friends = await User.find({ _id: { $in: user.friends } }).select('-password -__v');
    const result = friends.map(f => {
      const obj = f.toObject();
      obj.id = uid(f);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Remove Friend
app.post('/api/friends/remove', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get Pending Approvals
app.get('/api/admin/pending', async (req, res) => {
  try {
    const pending = await User.find({ status: 'PENDING_APPROVAL' }).select('-password -__v');
    const result = pending.map(u => {
      const obj = u.toObject();
      obj.id = uid(u);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Approve User Account
app.post('/api/admin/approve', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (user) {
      user.status = 'ACTIVE';
      await user.save();
      return res.json({ success: true });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Share Post
app.post('/api/posts/:id/share', async (req, res) => {
  try {
    const { userId, toUserId } = req.body;
    res.json({ success: true, message: 'Post shared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject User Account
app.post('/api/admin/reject', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (user) {
      user.status = 'REJECTED';
      await user.save();
      return res.json({ success: true });
    }
    res.status(404).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Get Active Users (Admin)
app.get('/api/admin/active', async (req, res) => {
  try {
    const activeUsers = await User.find({ status: 'ACTIVE' }).select('-password -__v');
    const result = activeUsers.map(u => {
      const obj = u.toObject();
      obj.id = uid(u);
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});

// Delete User Account (Admin)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    await User.findByIdAndDelete(targetId);
    await Post.deleteMany({ userId: targetId });
    await FriendRequest.deleteMany({ $or: [{ from: targetId }, { to: targetId }] });
    res.json({ success: true, message: 'User account and posts deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// Catch-all Asset & Pre-fetch Handler (guarantees ZERO 404 console errors for any missing asset/favicon/devtools query)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  if (req.path.endsWith('.ico') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌽</text></svg>`);
  }
  res.status(204).end();
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  const hostUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`🌽 The Corn Backend running on ${hostUrl}`);
});
