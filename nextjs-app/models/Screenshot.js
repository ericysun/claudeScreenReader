import { MongoClient } from 'mongodb';

const MONGODB_URI = 'PLACEHOLDER';
const DB_NAME = 'screen-capture';
const COLLECTION_NAME = 'screenshots';

let client;
let collection;

async function getCollection() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  
  if (!collection) {
    const db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);
    
    // Create indexes
    await collection.createIndex({ timestamp: -1 });
    await collection.createIndex({ userId: 1, timestamp: -1 });
  }
  
  return collection;
}

export async function createScreenshot(screenshotData) {
  const coll = await getCollection();
  
  // Insert the new screenshot
  const result = await coll.insertOne({
    ...screenshotData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Get the count of screenshots for this user
  const userScreenshotsCount = await coll.countDocuments({ userId: screenshotData.userId });
  
  // If user has more than 5 screenshots, delete the oldest ones
  if (userScreenshotsCount > 5) {
    const oldestScreenshots = await coll.find(
      { userId: screenshotData.userId },
      { sort: { timestamp: 1 }, limit: userScreenshotsCount - 5 }
    ).toArray();
    
    if (oldestScreenshots.length > 0) {
      const oldestIds = oldestScreenshots.map(screenshot => screenshot._id);
      await coll.deleteMany({ _id: { $in: oldestIds } });
    }
  }
  
  return result;
}

export async function getLatestScreenshot(userId) {
  const coll = await getCollection();
  return coll.findOne({ userId }, { sort: { timestamp: -1 } });
}

export async function getAllScreenshots(userId) {
  const coll = await getCollection();
  return coll.find({ userId }, { sort: { timestamp: -1 } }).toArray();
}

// Cleanup function for Next.js API routes
export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    collection = null;
  }
} 
