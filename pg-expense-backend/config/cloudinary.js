const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: file.fieldname === 'avatar' ? 'pg-expense/avatars' : 'pg-expense/bills',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
    transformation:
      file.fieldname === 'avatar'
        ? [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
        : [{ width: 1200, crop: 'limit', quality: 'auto' }],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

module.exports = { cloudinary, upload };
