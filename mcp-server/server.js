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

// Available MCP tools
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
    }
];

// Process incoming messages
rl.on("line", (line) => {
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

        // 5. Unknown tool: protocol error
        error(id, -32602, "Unknown tool: " + name);
        return;
    }

    // 6. Unknown method
    if (id !== undefined) {
        error(id, -32601, "Method not found");
    }
});