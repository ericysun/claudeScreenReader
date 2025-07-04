import Cors from 'cors';
import { createScreenshot, getAllScreenshots, closeConnection } from '../../models/Screenshot';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'GET', 'HEAD'],
});

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  try {
    if (req.method === 'POST') {
      const { screenshot, timestamp, url, userId } = req.body;
      
      // Validate required fields
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      
      const result = await createScreenshot({
        screenshot,
        timestamp: new Date(timestamp),
        url,
        userId
      });

      res.status(201).json({ 
        success: true, 
        data: {
          _id: result.insertedId,
          screenshot,
          timestamp: new Date(timestamp),
          url,
          userId
        }
      });
    } else if (req.method === 'GET') {
      const { userId } = req.query;
      
      // Validate required fields
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      
      const screenshots = await getAllScreenshots(userId);
      res.status(200).json({ success: true, data: screenshots });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  } finally {
    await closeConnection();
  }
} 