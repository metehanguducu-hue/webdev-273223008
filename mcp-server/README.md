
# Exercise 1 - MCP Server

**Student:** Metehan Güdücü
**Faculty Number:** 273223008
**Course:** Web Development
**University:** Technical University of Sofia

## Project Overview

In this exercise, I implemented a Model Context Protocol (MCP) server using JavaScript and Node.js.

The server communicates with clients using JSON-RPC 2.0 messages through standard input and standard output.

The main goal was to understand how an MCP server handles initialization, tool discovery, tool execution, and error responses.

## Project Files

- `server.js` - My MCP server implementation.
- `lectures.json` - Contains information about the course lectures.
- `messages.jsonl` - Contains example client messages.
- `check.mjs` - Automated self-check for the server.

## Implemented Features

My server supports the following operations:

1. `initialize` - Establishes communication with the MCP client.
2. `notifications/initialized` - Handles the initialization notification without sending a response.
3. `tools/list` - Returns the available tools and their descriptions.
4. `tools/call` - Executes a requested tool.
5. Error handling - Returns appropriate JSON-RPC errors for unsupported methods and unknown tools.

## Implemented Tools

### 1. find_lecture

The `find_lecture` tool searches for a lecture by its number.

It reads lecture information from `lectures.json` and returns the title and topics of the requested lecture.

If the requested lecture does not exist, the server returns a tool result with `isError: true` instead of a JSON-RPC protocol error.

### 2. list_lectures

I also implemented a tool named `list_lectures`.

This tool reads the lecture data and returns a list of available lectures, including their numbers and titles.

It allows the client to discover the available lectures without requesting each lecture separately.

## How to Start It

Open the terminal in the root directory of the project.

Start the MCP server with:

```bash
node mcp-server/server.js
```

The server waits for JSON-RPC messages through standard input and sends its responses through standard output.

To run the automated self-check:

```bash
node mcp-server/check.mjs -- node mcp-server/server.js
```

## Testing and Results

During development, I tested the server using the automated checker provided with the exercise.

The initial implementation had several problems related to tool discovery, tool execution, and error handling.

I corrected these issues and repeated the tests.

**Final result: 12/12 checks passed.**

The successful tests confirmed that the server correctly handles initialization, notifications, tool discovery, valid tool calls, invalid lecture requests, unknown tools, and unknown methods.


## Session Transcript

I tested my MCP server using JSON-RPC 2.0 requests through the terminal. The following examples show the requests and responses.

### 1. Initialize

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}
```

Response:
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"metehan-mcp-server","version":"1.0.0"}}}
```

The server initialized successfully and returned its protocol version, capabilities, and server information.

### 2. List Available Tools

Request:
```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

The server returned two available tools:

- `find_lecture`: Finds a lecture by its number from 1 to 10.
- `list_lectures`: Lists all available lectures with their numbers and titles.

Both tools include descriptions and input schemas.

### 3. Successful Tool Call

Request:
```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"find_lecture","arguments":{"number":5}}}
```

Response:
```json
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"{\"number\":5,\"title\":\"What the agent built, part 1\",\"topics\":\"HTTP, REST vs GraphQL, data modeling, ORM, layers\"}"}]}}
```

The server successfully retrieved lecture 5 from lectures.json.

### 4. Lecture Not Found

Request:
```json
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"find_lecture","arguments":{"number":99}}}
```

Response:
```json
{"jsonrpc":"2.0","id":4,"result":{"content":[{"type":"text","text":"Lecture not found. Please enter a number from 1 to 10."}],"isError":true}}
```

The server handled the invalid lecture number by returning a tool-level error instead of crashing.

### 5. Unknown Tool

Request:
```json
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"no_such_tool","arguments":{}}}
```

Response:
```json
{"jsonrpc":"2.0","id":5,"error":{"code":-32602,"message":"Unknown tool: no_such_tool"}}
```

The server correctly returned a JSON-RPC protocol error because the requested tool does not exist.

### Test Summary

The MCP server correctly handled initialization, tool discovery, successful tool execution, tool-level errors, and unknown tools.

I also ran the automated checker:

```bash
node mcp-server/check.mjs -- node mcp-server/server.js
```

All 12 automated checks passed.

