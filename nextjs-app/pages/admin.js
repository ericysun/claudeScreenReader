import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function AdminPage() {
  const [userScreenshots, setUserScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadedUserCount, setLoadedUserCount] = useState(0);
  const isInitialFetch = useRef(true);
  const BATCH_SIZE = 1; // Changed to load 1 user at a time

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      
      // Build the URL with the lastFetchTime parameter if it exists
      let url = '/api/admin';
      if (lastFetchTime && !isInitial) {
        url += `?lastFetchTime=${encodeURIComponent(lastFetchTime)}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        // Update the last fetch time
        setLastFetchTime(result.timestamp);
        
        if (isInitial) {
          // For initial fetch, load data in batches
          const allUsers = result.data;
          
          // If we have more users to load
          if (loadedUserCount < allUsers.length) {
            // Calculate the next batch of users to load
            const nextBatch = allUsers.slice(
              loadedUserCount, 
              loadedUserCount + BATCH_SIZE
            );
            
            // Update the state with the current batch
            setUserScreenshots(prevScreenshots => {
              return [...prevScreenshots, ...nextBatch];
            });
            
            // Update the loaded user count
            setLoadedUserCount(prevCount => prevCount + nextBatch.length);
            
            // If we've loaded all users, mark initial loading as complete
            if (loadedUserCount + nextBatch.length >= allUsers.length) {
              setIsInitialLoading(false);
              setLoading(false);
            }
          }
        } else {
          // For subsequent fetches, update incrementally
          setUserScreenshots(prevScreenshots => {
            // Create a copy of the current screenshots
            const updatedScreenshots = [...prevScreenshots];
            
            // Process each user in the new data
            result.data.forEach(newUserData => {
              const existingUserIndex = updatedScreenshots.findIndex(
                user => user.userId === newUserData.userId
              );
              
              if (existingUserIndex >= 0) {
                // User exists, update their screenshots
                const existingUser = updatedScreenshots[existingUserIndex];
                
                // Merge screenshots, avoiding duplicates
                const existingScreenshotIds = new Set(
                  existingUser.screenshots.map(s => s._id)
                );
                
                const newScreenshots = newUserData.screenshots.filter(
                  screenshot => !existingScreenshotIds.has(screenshot._id)
                );
                
                // Combine existing and new screenshots, sort by timestamp
                const combinedScreenshots = [
                  ...existingUser.screenshots,
                  ...newScreenshots
                ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Limit to 5 screenshots per user
                updatedScreenshots[existingUserIndex] = {
                  ...existingUser,
                  screenshots: combinedScreenshots.slice(0, 5)
                };
              } else {
                // New user, add them to the list
                updatedScreenshots.push(newUserData);
              }
            });
            
            return updatedScreenshots;
          });
        }
      } else {
        setError(result.error || 'Failed to fetch data');
        setLoading(false);
        setIsInitialLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData(true);
    
    // Set up interval to fetch data every 5 seconds
    const intervalId = setInterval(() => fetchData(false), 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Effect to handle batched loading
  useEffect(() => {
    if (isInitialLoading && loadedUserCount > 0) {
      // If we're still in initial loading mode and have loaded some users,
      // continue loading the next batch
      fetchData(true);
    }
  }, [loadedUserCount, isInitialLoading]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Admin Dashboard - Screen Capture</title>
        <meta name="description" content="Admin dashboard for screen capture application" />
      </Head>

      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {loading && (
        <div className="p-4 mb-4 rounded-lg bg-blue-50 border border-blue-500 text-blue-800">
          Loading data...
        </div>
      )}
      
      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-50 border border-red-500 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && userScreenshots.length === 0 && (
        <p className="text-lg">No user data available.</p>
      )}

      {!error && userScreenshots.length > 0 && (
        <div className="space-y-8">
          {userScreenshots.map((user) => (
            <div key={user.userId} className="mb-8 rounded-lg overflow-hidden shadow-md">
              <div className="bg-gray-100 px-6 py-4">
                <h2 className="text-xl font-semibold">User: {user.userId}</h2>
              </div>
              
              <div className="p-6">
                {user.screenshots.length === 0 ? (
                  <p>No screenshots available for this user.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.screenshots.map((screenshot) => (
                      <div 
                        key={screenshot._id} 
                        className="border rounded-lg overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="p-4">
                          <p className="text-sm text-gray-600 mb-2">
                            {formatDate(screenshot.timestamp)}
                          </p>
                          <a 
                            href={screenshot.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate block mb-2"
                          >
                            {screenshot.url}
                          </a>
                        </div>
                        <div className="bg-gray-100 p-2">
                          <img 
                            src={screenshot.screenshot} 
                            alt="Screenshot" 
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isInitialLoading && (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading more users...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 