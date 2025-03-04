const multer = require("multer");
const path = require("path");

// Set up storage engine
const storage = multer.memoryStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, "public/document");
    } else {
      cb(null, "public/profileImage");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid collisions
  },
});

// Create multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    // Explicitly check MIME types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword", // MIME type for .doc files
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // MIME type for .docx files
    ];

    const mimetype = allowedMimes.includes(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Error: File type not supported!"));
    }
  },
});

module.exports = upload;
