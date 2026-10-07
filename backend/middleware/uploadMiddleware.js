// ========================================================
// Upload Middleware using Multer
// Handles local file storage for events, profiles, and documents
// ========================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure base upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads/events'),
  path.join(__dirname, '../uploads/profiles'),
  path.join(__dirname, '../uploads/gallery'),
  path.join(__dirname, '../uploads/documents')
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profile_image' || file.fieldname === 'avatar') {
      cb(null, path.join(__dirname, '../uploads/profiles'));
    } else if (file.fieldname === 'brochure') {
      cb(null, path.join(__dirname, '../uploads/documents'));
    } else if (file.fieldname === 'gallery' || file.fieldname === 'logo' || file.fieldname === 'favicon') {
      cb(null, path.join(__dirname, '../uploads/gallery'));
    } else {
      // Default to events directory
      cb(null, path.join(__dirname, '../uploads/events'));
    }
  },
  filename: function (req, file, cb) {
    // Generate clean unique filename: event-1734567890-123456.jpg
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to validate MIME types and extensions
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. PDF documents (e.g. event brochure)
  if (file.fieldname === 'brochure') {
    if (ext === '.pdf' && file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    return cb(new Error('Only PDF documents are allowed for brochures (.pdf)!'), false);
  }

  // 2. Favicon / Logo icons
  if (file.fieldname === 'favicon' || file.fieldname === 'logo') {
    const brandExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'];
    if (brandExts.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Only JPG, PNG, WEBP, SVG, or ICO files are allowed for logo and favicon!'), false);
  }

  // 3. Images (event covers, profile avatars, galleries)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed!'),
    false
  );
}

// Multer upload instances
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB general max limit
  }
});

// Middleware for Event Creation & Update (supports 1 cover image + 1 optional PDF brochure)
const uploadEventMedia = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'brochure', maxCount: 1 }
]);

// Middleware for Profile Photo Update (accepts 'profile_image' or 'avatar', max 2MB)
const uploadProfilePhotoMiddleware = upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
]);

const uploadProfilePhoto = (req, res, next) => {
  uploadProfilePhotoMiddleware(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      if (req.files['profile_image'] && req.files['profile_image'][0]) {
        req.file = req.files['profile_image'][0];
      } else if (req.files['avatar'] && req.files['avatar'][0]) {
        req.file = req.files['avatar'][0];
      }
    }
    next();
  });
};

// Middleware for Event Gallery Images (up to 5 images)
const uploadGalleryImages = upload.array('gallery', 5);

// Middleware for Website Branding (1 logo + 1 favicon)
const uploadBrandMedia = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]);

module.exports = {
  uploadEventMedia,
  uploadProfilePhoto,
  uploadGalleryImages,
  uploadBrandMedia
};
