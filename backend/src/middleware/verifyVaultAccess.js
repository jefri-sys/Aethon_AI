const verifyVaultAccess = (req, res, next) => {
  if (req.cookies && req.cookies.vaultUnlocked === 'true') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Vault access locked. Please re-enter your password.',
    code: 'VAULT_LOCKED'
  });
};

module.exports = {
  verifyVaultAccess
};
