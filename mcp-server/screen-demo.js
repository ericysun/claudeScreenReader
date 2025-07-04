import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create an MCP client
const client = new McpClient();

// Connect to the server
const transport = new StdioClientTransport();
await client.connect(transport);

// Function to demonstrate getting the current screen
async function getCurrentScreen() {
  console.log("\nGetting current screen");
  
  const response = await client.invoke("getCurrentScreen", {});
  
  if (response.content[0].type === "text") {
    console.log(response.content[0].text);
  } else {
    console.log("Screenshot retrieved successfully!");
    console.log("Metadata:", response.content[0].metadata);
    console.log("Image data length:", response.content[0].data.length);
  }
}

// Function to demonstrate getting all screenshots
async function getUserScreenshots() {
  console.log("\nGetting all screenshots");
  
  const response = await client.invoke("getUserScreenshots", {});
  
  if (response.content[0].type === "text") {
    console.log(response.content[0].text);
  } else {
    console.log(`Retrieved ${response.content.length} screenshots successfully!`);
    
    // Display metadata for each screenshot
    response.content.forEach((screenshot, index) => {
      console.log(`\nScreenshot ${index + 1}:`);
      console.log("ID:", screenshot.metadata.id);
      console.log("Timestamp:", screenshot.metadata.timestamp);
      console.log("URL:", screenshot.metadata.url);
      console.log("User ID:", screenshot.metadata.userId);
      console.log("Image data length:", screenshot.data.length);
    });
  }
}

// Main function to run the demo
async function runDemo() {
  try {
    // Test getting current screen
    await getCurrentScreen();
    
    // Test getting all screenshots
    await getUserScreenshots();
    
    console.log("\nDemo completed successfully!");
  } catch (error) {
    console.error("Error running demo:", error);
  } finally {
    // Close the client connection
    await client.close();
  }
}

// Run the demo
runDemo(); 