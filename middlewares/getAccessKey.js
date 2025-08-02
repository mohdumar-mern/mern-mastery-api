import expressAsyncHandler from 'express-async-handler';

export const getAesKey = expressAsyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user authenticated' });
  }
  const secretKey = process.env.AES_SECRET_KEY;
  if (!secretKey || Buffer.from(secretKey, 'hex').length !== 32) {
    return res.status(500).json({ message: 'Server configuration error: Invalid AES secret key' });
  }
  res.json({ key: secretKey });
});