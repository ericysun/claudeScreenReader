import Cors from 'cors';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'PLACEHOLDER';
const DB_NAME = 'screen-capture';
const COLLECTION_NAME = 'screenshots';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'HEAD'],
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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Get the lastFetchTime from query parameters
  const lastFetchTime = req.query.lastFetchTime ? new Date(req.query.lastFetchTime) : null;
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all unique users
    const users = await collection.distinct('userId');
    
    // For each user, get their screenshots
    const userScreenshots = await Promise.all(
      users.map(async (userId) => {
        // Build query based on whether we have a lastFetchTime
        const query = { userId };
        if (lastFetchTime) {
          query.timestamp = { $gt: lastFetchTime };
        }
        
        const screenshots = await collection
          .find(query)
          .sort({ timestamp: -1 })
          .limit(5)
          .toArray();
        
        return {
          userId,
          screenshots: screenshots.map(screenshot => ({
            _id: screenshot._id,
            timestamp: screenshot.timestamp,
            url: screenshot.url,
            screenshot: screenshot.screenshot
          }))
        };
      })
    );
    
    // Filter out users with no new screenshots
    const filteredUserScreenshots = userScreenshots.filter(user => user.screenshots.length > 0);
    
    res.status(200).json({ 
      success: true, 
      data: filteredUserScreenshots,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 
