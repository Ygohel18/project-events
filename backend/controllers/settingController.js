const { getBrandSettings, getAllSettings, saveSettings } = require('../services/settingsService');

/**
 * GET /api/settings/public
 * Returns non-sensitive branding and contact information
 */
async function getPublicSettings(req, res) {
  try {
    const settings = await getBrandSettings();
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error in getPublicSettings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve website settings.'
    });
  }
}

/**
 * GET /api/settings/admin
 * Returns full configuration for admin settings form
 */
async function getAdminSettings(req, res) {
  try {
    const settings = await getAllSettings();
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error in getAdminSettings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin settings.'
    });
  }
}

/**
 * PUT /api/settings/admin
 * Updates branding and platform settings
 */
async function updateAdminSettings(req, res) {
  try {
    const payload = { ...req.body };

    // If new logo file was uploaded via Multer
    if (req.files && req.files.logo && req.files.logo[0]) {
      payload.logo = `/uploads/gallery/${req.files.logo[0].filename}`;
    }

    // If new favicon file was uploaded via Multer
    if (req.files && req.files.favicon && req.files.favicon[0]) {
      payload.favicon = `/uploads/gallery/${req.files.favicon[0].filename}`;
    }

    // Clean sensitive keys from being overwritten arbitrarily
    delete payload.auth_session_version;

    await saveSettings(payload);
    const updated = await getBrandSettings();

    return res.status(200).json({
      success: true,
      message: 'Website settings updated successfully!',
      data: updated
    });
  } catch (err) {
    console.error('Error in updateAdminSettings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update website settings.'
    });
  }
}

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings
};
