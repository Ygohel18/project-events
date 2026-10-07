// ========================================================
// Payment Routes (Offline Payment Verification Workflow)
// ========================================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireOrganizerOrAdmin, requireAdmin } = require('../middleware/authMiddleware');
const { uploadPaymentScreenshot } = require('../middleware/paymentUpload');

// 1. Participant submits payment proof (by registrationId param or body event_id/registration_id)
router.post(
  '/',
  verifyToken,
  uploadPaymentScreenshot,
  paymentController.submitPaymentProof
);

router.post(
  '/:registrationId',
  verifyToken,
  uploadPaymentScreenshot,
  paymentController.submitPaymentProof
);

// 2. Participant views their own payments
router.get(
  '/my-payments',
  verifyToken,
  paymentController.getMyPayments
);

// 3. Organizer views payments for their events
router.get(
  '/organizer',
  verifyToken,
  requireOrganizerOrAdmin,
  paymentController.getOrganizerPayments
);

// 4. Admin views all payments
router.get(
  '/admin',
  verifyToken,
  requireAdmin,
  paymentController.getAdminPayments
);

// 5. Secure/gated payment screenshot viewer
router.get(
  '/:id/proof',
  verifyToken,
  paymentController.getProofFile
);

// 6. Approve payment
router.put(
  '/:id/approve',
  verifyToken,
  requireOrganizerOrAdmin,
  paymentController.approvePayment
);

// 7. Reject payment
router.put(
  '/:id/reject',
  verifyToken,
  requireOrganizerOrAdmin,
  paymentController.rejectPayment
);

module.exports = router;
