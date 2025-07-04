import {
    McpServer,
    ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MongoClient } from "mongodb";

// MongoDB setup
const MONGODB_URI =
    "PLACEHOLDER";
const DB_NAME = "screen-capture";
const COLLECTION_NAME = "screenshots";

// Define the user ID to use for all operations
const USER_ID = "YOURNAMEHERE";

// MongoDB connection options
const MONGODB_OPTIONS = {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
};

// Create MongoDB client
const client = new MongoClient(MONGODB_URI, MONGODB_OPTIONS);

// Create an MCP server
const server = new McpServer({
    name: "Screen-MCP",
    version: "1.0.0",
});

// Add current screen tool
server.tool("getCurrentScreen", {}, async () => {
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const latestScreenshot = await collection.findOne(
            { userId: USER_ID },
            { sort: { timestamp: -1 } }
        );

        if (!latestScreenshot) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No screenshots found for user ID: ${USER_ID}`,
                    },
                ],
            };
        }

        // Extract base64 data from data URL
        const base64Data = latestScreenshot.screenshot.split(",")[1];

        return {
            content: [
                {
                    type: "image",
                    data: base64Data,
                    mimeType: "image/jpeg",
                    metadata: {
                        timestamp: latestScreenshot.timestamp,
                        url: latestScreenshot.url,
                        userId: latestScreenshot.userId,
                    },
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error retrieving screenshot: ${error.message}`,
                },
            ],
        };
    } finally {
        await client.close();
    }
});

// Add a tool to get all screenshots for a user
server.tool("getUserScreenshots", {}, async () => {
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const screenshots = await collection
            .find({ userId: USER_ID }, { sort: { timestamp: -1 } })
            .toArray();

        if (!screenshots || screenshots.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No screenshots found for user ID: ${USER_ID}`,
                    },
                ],
            };
        }

        // Create a list of screenshots with metadata
        const screenshotsList = screenshots.map((screenshot) => {
            // Extract base64 data from data URL
            const base64Data = screenshot.screenshot.split(",")[1];

            return {
                type: "image",
                data: base64Data,
                mimeType: "image/jpeg",
                metadata: {
                    id: screenshot._id.toString(),
                    timestamp: screenshot.timestamp,
                    url: screenshot.url,
                    userId: screenshot.userId,
                },
            };
        });

        return {
            content: screenshotsList,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error retrieving screenshots: ${error.message}`,
                },
            ],
        };
    } finally {
        await client.close();
    }
});

// Add a dynamic screen resource
server.resource(
    "screen",
    new ResourceTemplate("screen://{id}", { list: undefined }),
    async (uri, { id }) => {
        try {
            await client.connect();
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);

            const screenshot = await collection.findOne({ _id: id });

            if (!screenshot) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: "Screenshot not found",
                        },
                    ],
                };
            }

            // Extract base64 data from data URL
            const base64Data = screenshot.screenshot.split(",")[1];

            return {
                contents: [
                    {
                        uri: uri.href,
                        type: "image",
                        data: base64Data,
                        mimeType: "image/jpeg",
                        metadata: {
                            timestamp: screenshot.timestamp,
                            url: screenshot.url,
                            userId: screenshot.userId,
                        },
                    },
                ],
            };
        } catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: `Error retrieving screenshot: ${error.message}`,
                    },
                ],
            };
        } finally {
            await client.close();
        }
    }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
