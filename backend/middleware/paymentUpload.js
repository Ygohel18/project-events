// ========================================================
// Payment Screenshot Upload Middleware (Multer)
// Strict validation: JPG/JPEG/PNG only, max 10MB
// ========================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/payments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payment-${uniqueSuffix}${ext}`);
  }
});

// File filter: JPG, JPEG, PNG only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/pjpeg'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Payment screenshot must be JPG or PNG and must not exceed 10 MB.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes
  }
});

// Wrapper to handle Multer errors cleanly and return friendly HTTP 400 responses
const uploadPaymentScreenshot = (req, res, next) => {
  const customUpload = upload.fields([
    { name: 'payment_screenshot', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 }
  ]);

  customUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Payment screenshot must be JPG or PNG and must not exceed 10 MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Payment screenshot must be JPG or PNG and must not exceed 10 MB.'
      });
    }

    if (req.files) {
      if (req.files['payment_screenshot'] && req.files['payment_screenshot'][0]) {
        req.file = req.files['payment_screenshot'][0];
      } else if (req.files['screenshot'] && req.files['screenshot'][0]) {
        req.file = req.files['screenshot'][0];
      }
    }
    next();
  });
};

module.exports = {
  uploadPaymentScreenshot
};
