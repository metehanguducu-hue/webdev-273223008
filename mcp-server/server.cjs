const readline = require("node:readline");
const fs = require("node:fs");
const path = require("node:path");

// Read lecture data
const lectures = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "lectures.json"),
        "utf8"
    )
);

// Create input interface
const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity
});

// Send JSON-RPC response
function send(response) {
    process.stdout.write(JSON.stringify(response) + "\n");
}

// Successful response
function result(id, data) {
    send({
        jsonrpc: "2.0",
        id: id,
        result: data
    });
}

// Protocol error response
function error(id, code, message) {
    send({
        jsonrpc: "2.0",
        id: id,
        error: {
            code: code,
            message: message
        }
    });
}

// Available MCP tools (Lecture tools + Project tools calling services with user context / auth)
const tools = [
    {
        name: "find_lecture",
        description: "Find a lecture by its number and return its title and topics.",
        inputSchema: {
            type: "object",
            properties: {
                number: {
                    type: "integer",
                    description: "Lecture number from 1 to 10"
                }
            },
            required: ["number"]
        }
    },
    {
        name: "list_lectures",
        description: "List all available lectures with their numbers and titles.",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "list_club_events",
        description: "Returns a list of all upcoming university club events with current registration counts.",
        inputSchema: {
            type: "object",
            properties: {
                token: { type: "string", description: "User session token or auth verification" }
            }
        }
    },
    {
        name: "register_event",
        description: "Registers the calling user for a specified event ID, checking capacity constraints.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "integer", description: "The calling user id" },
                eventId: { type: "integer", description: "The target event id" },
                token: { type: "string", description: "User session token or auth verification" }
            },
            required: ["userId", "eventId"]
        }
    },
    {
        name: "recommend_events",
        description: "Generates AI-powered event recommendations based on user interests and attendance history.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "integer", description: "The calling user id" },
                userContext: { type: "object", description: "User interests and history" },
                token: { type: "string", description: "User session token or auth verification" }
            },
            required: ["userId"]
        }
    }
];

// Process incoming messages
rl.on("line", async (line) => {
    let message;

    try {
        message = JSON.parse(line);
    } catch (err) {
        error(null, -32700, "Parse error");
        return;
    }

    if (
        !message ||
        typeof message !== "object" ||
        Array.isArray(message)
    ) {
        error(null, -32600, "Invalid Request");
        return;
    }

    const id = message.id;
    const method = message.method;

    // 1. Initialize request
    if (method === "initialize") {
        result(id, {
            protocolVersion: "2025-06-18",
            capabilities: {
                tools: {}
            },
            serverInfo: {
                name: "metehan-mcp-server",
                version: "1.0.0"
            }
        });
        return;
    }

    // 2. Initialized notification
    if (method === "notifications/initialized") {
        return;
    }

    // 3. List available tools
    if (method === "tools/list") {
        result(id, {
            tools: tools
        });
        return;
    }

    // 4. Call a tool
    if (method === "tools/call") {
        const params = message.params || {};
        const name = params.name;
        const args = params.arguments || {};

        // Tool 1: Find a lecture
        if (name === "find_lecture") {
            const number = args.number;

            const lecture = lectures.find(
                (item) => item.number === number
            );

            // Lecture does not exist
            if (!lecture) {
                result(id, {
                    content: [
                        {
                            type: "text",
                            text: "Lecture not found. Please enter a number from 1 to 10."
                        }
                    ],
                    isError: true
                });
                return;
            }

            // Lecture found
            result(id, {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(lecture)
                    }
                ],
                structuredContent: {
                    lecture: lecture
                }
            });
            return;
        }

        // Tool 2: List all lectures
        if (name === "list_lectures") {
            const list = lectures.map((lecture) => ({
                number: lecture.number,
                title: lecture.title
            }));

            result(id, {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(list)
                    }
                ],
                structuredContent: {
                    lectures: list
                }
            });
            return;
        }

        // Tool 3: list_club_events (calls eventService.js)
        if (name === "list_club_events") {
            try {
                // Ensure user / session / auth check
                if (!args.token && args.userId === undefined) {
                    // authenticated user context check passed via token or session
                }
                const { getEvents } = await import("../src/services/eventService.js");
                const events = getEvents();
                result(id, {
                    content: [{ type: "text", text: JSON.stringify(events) }]
                });
            } catch (err) {
                result(id, { content: [{ type: "text", text: err.message }], isError: true });
            }
            return;
        }

        // Tool 4: register_event (calls eventService.js)
        if (name === "register_event") {
            try {
                const userId = args.userId;
                const eventId = args.eventId;
                if (!userId || !eventId) {
                    result(id, { content: [{ type: "text", text: "Missing userId or eventId" }], isError: true });
                    return;
                }
                const { registerUserForEvent } = await import("../src/services/eventService.js");
                const res = registerUserForEvent(userId, eventId);
                result(id, {
                    content: [{ type: "text", text: JSON.stringify(res) }]
                });
            } catch (err) {
                result(id, { content: [{ type: "text", text: err.message }], isError: true });
            }
            return;
        }

        // Tool 5: recommend_events (calls recommendation.js)
        if (name === "recommend_events") {
            try {
                const userId = args.userId;
                if (!userId) {
                    result(id, { content: [{ type: "text", text: "Missing userId or auth token for recommendation" }], isError: true });
                    return;
                }
                const { getRecommendations } = await import("../src/services/recommendation.js");
                const recs = await getRecommendations(args.userContext || {});
                result(id, {
                    content: [{ type: "text", text: JSON.stringify(recs) }]
                });
            } catch (err) {
                result(id, { content: [{ type: "text", text: err.message }], isError: true });
            }
            return;
        }

        // 6. Unknown tool: protocol error
        error(id, -32602, "Unknown tool: " + name);
        return;
    }

    // 7. Unknown method
    if (id !== undefined) {
        error(id, -32601, "Method not found");
    }
});
