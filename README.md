# AI Agent with Dynamic Tool Creation 🤖

## Overview
This is an intelligent AI agent that can create its own tools dynamically to accomplish complex tasks. The agent works in a THINK-ACTION-OBSERVE loop and can generate, modify, and execute code to solve problems.

## Features ✨
- 🧠 **Self-Learning**: Creates new tools as needed
- 🔧 **Dynamic Tool Creation**: Builds custom functions on-the-fly
- 📁 **File Management**: Creates, reads, and modifies files
- 🌐 **Web Development**: Generates HTML, CSS, JavaScript applications
- 💻 **System Commands**: Executes terminal/shell commands
- 🎯 **Goal-Oriented**: Breaks down complex tasks into manageable steps

## Installation

### Prerequisites
- Node.js (v14 or higher)
- pnpm package manager

### Setup Steps
1. Clone or download this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file with your OpenRouter API key:
   ```env
   OPENAI_API_KEY=your_openrouter_api_key_here
   ```

4. Get an API key from [OpenRouter](https://openrouter.ai)

## Usage

### Basic Usage
1. Edit the `user_query` in `index.js`:
   ```javascript
   const user_query = "Your request here";
   ```

2. Run the agent:
   ```bash
   node index.js
   ```

### Example Queries
- `"Create a todo list app with blue and grey aesthetics"`
- `"Build a calculator with a modern UI"`
- `"Generate a weather dashboard"`
- `"Create a file organizer script"`
- `"What's the weather in New York?"`

## Built-in Tools 🛠️

### Core Tools
- **getWeatherInfo(city)**: Get weather information for a city
- **executeCommand(command)**: Execute shell/terminal commands
- **createFile(params)**: Create files with specified content
- **createTool(params)**: Create new custom tools dynamically
- **listAvailableTools()**: Show all available tools

### Dynamic Tool Creation
The agent can create new tools using the `createTool` function:

```javascript
// Example: Agent creates a new tool
{
  "step": "ACTION",
  "tool": "createTool",
  "input": {
    "toolName": "generateHTML",
    "description": "Generates HTML templates",
    "code": "return '<html><head><title>' + params.title + '</title></head><body>' + params.content + '</body></html>';"
  }
}
```

## How It Works 🔄

### Agent Workflow
1. **START**: Receives user query
2. **THINK**: Analyzes the problem and plans approach
3. **ACTION**: Executes tools or creates new ones if needed
4. **OBSERVE**: Reviews tool outputs
5. **OUTPUT**: Provides final result or continues loop

### Example Session
```
User: "Create a simple website"
THINK: I need to create HTML, CSS, and JS files
THINK: I should create tools for generating each file type
ACTION: createTool(generateHTML)
OBSERVE: Tool created successfully
ACTION: createTool(generateCSS)
OBSERVE: Tool created successfully  
ACTION: generateHTML({title: "My Site", content: "Hello World"})
OBSERVE: HTML generated
OUTPUT: Website created successfully!
```

## Configuration ⚙️

### Model Settings
You can modify the AI model and settings in `index.js`:

```javascript
const response = await client.chat.completions.create({
  model: "openai/gpt-3.5-turbo", // Change model here
  max_tokens: 2000, // Adjust token limit
  // ... other settings
});
```

### Available Models
- `openai/gpt-3.5-turbo` (cheaper, good for most tasks)
- `openai/gpt-4o` (more capable, higher cost)
- `meta-llama/llama-3.1-8b-instruct:free` (free tier)

## Advanced Usage 🚀

### Custom Tool Examples
```javascript
// Create a math calculator tool
{
  "toolName": "calculator",
  "description": "Performs mathematical calculations",
  "code": "return eval(params.expression);"
}

// Create a text processor tool
{
  "toolName": "textProcessor",
  "description": "Processes and formats text",
  "code": "return params.text.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_');"
}
```

### Adding Persistent Tools
To add tools that are always available, modify `TOOLS_MAP` in `index.js`:

```javascript
const TOOLS_MAP = {
  "getWeatherInfo": getWeatherInfo,
  "executeCommand": executeCommand,
  "yourCustomTool": yourCustomFunction, // Add here
  // ... existing tools
};
```

## Troubleshooting 🔧

### Common Issues

**"Module not found" error:**
```bash
pnpm add openai dotenv
```

**"API key not found" error:**
- Check your `.env` file exists
- Verify your OpenRouter API key is correct

**"Tool not found" error:**
- The agent tried to use a non-existent tool
- Check the system prompt guides the agent properly

**"Credits exhausted" error:**
- Add credits to your OpenRouter account
- Use a cheaper model like `gpt-3.5-turbo`

### Debug Mode
Add debug logging by modifying the ACTION handler in `index.js`.

## Examples Gallery 🎨

### Todo App
```
Query: "Create a todo list app with blue and grey aesthetics and lots of emojis"
Result: Complete web app with HTML, CSS, and JavaScript
```

### Weather Dashboard
```
Query: "Build a weather dashboard for multiple cities"
Result: Interactive dashboard with weather data
```

### File Organizer
```
Query: "Create a script to organize files by type"
Result: Node.js script that sorts files into folders
```

## Architecture 🏗️

### Core Components
1. **OpenAI Client**: Interfaces with OpenRouter API
2. **Tool System**: Dynamic function creation and execution
3. **Message Loop**: Manages conversation flow
4. **Command Executor**: Runs system commands safely

### Tool Creation Process
1. Agent identifies need for new capability
2. Designs function signature and logic
3. Creates tool using `createTool` function
4. Validates tool creation
5. Uses new tool to accomplish task

## API Reference 📚

### createTool(params)
Creates a new tool dynamically.

**Parameters:**
- `toolName` (string): Name of the new tool
- `description` (string): What the tool does
- `code` (string): JavaScript function body

**Returns:** Success/error message

### createFile(params)
Creates a file with specified content.

**Parameters:**
- `filename` (string): Name of file to create
- `content` (string): File content

**Returns:** Success/error message

### executeCommand(command)
Executes a shell command.

**Parameters:**
- `command` (string): Command to execute

**Returns:** stdout and stderr output

## Security Considerations 🔒

- **Code Execution**: Be cautious with `executeCommand` and `createTool`
- **API Keys**: Never commit `.env` files to version control
- **Input Validation**: The agent can execute arbitrary code
- **File Permissions**: Ensure proper file access rights

## Performance Tips ⚡

1. **Use cheaper models** for simple tasks
2. **Limit max_tokens** to reduce costs
3. **Cache frequently used tools** in TOOLS_MAP
4. **Monitor API usage** on OpenRouter dashboard

## Contributing 🤝

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and small

## Roadmap 🗺️

### Planned Features
- [ ] Tool persistence across sessions
- [ ] Web interface for easier interaction
- [ ] Tool marketplace/sharing
- [ ] Enhanced error handling
- [ ] Multi-agent collaboration
- [ ] Plugin system

## License 📄
MIT License - Feel free to use and modify!

## Support 💬
- Open an issue for bugs or feature requests
- Check the troubleshooting section for common problems
- Review the examples for inspiration

---

**Happy coding with your AI agent! 🚀✨**

Made with ❤️ using OpenAI SDK
