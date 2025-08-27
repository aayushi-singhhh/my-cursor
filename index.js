import {OpenAI} from 'openai';
import {exec} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY=process.env.OPENAI_API_KEY;

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENAI_API_KEY,
});

function getWeatherInfo(cityname){ 
    return `${cityname} has 43 Degree C`;
}

function executeCommand(command){
    return new Promise ((resolve, reject)=>{
        exec(command, function (error, stdout, stderr){
            if (error) {
                return reject(error);
            }  
            resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
        });
    });
}

function createFile(params) {
    const { filename, content } = JSON.parse(params);
    return new Promise((resolve, reject) => {
        try {
            // Create directory if it doesn't exist
            const dir = path.dirname(filename);
            if (dir !== '.' && dir !== '') {
                exec(`mkdir -p "${dir}"`, (mkdirError) => {
                    if (mkdirError) {
                        console.log(`Warning: Could not create directory ${dir}`);
                    }
                    // Write file regardless of mkdir result
                    fs.writeFileSync(filename, content, 'utf8');
                    resolve(`File ${filename} created successfully with ${content.length} characters`);
                });
            } else {
                // Write file directly if no directory needed
                fs.writeFileSync(filename, content, 'utf8');
                resolve(`File ${filename} created successfully with ${content.length} characters`);
            }
        } catch (error) {
            reject(error);
        }
    });
}

function createTool(params) {
    const { toolName, description, code } = JSON.parse(params);
    
    try {
        // Create a new function from the provided code
        const newFunction = new Function('params', code);
        
        // Add the new tool to TOOLS_MAP
        TOOLS_MAP[toolName] = newFunction;
        
        return `Tool '${toolName}' created successfully. Description: ${description}`;
    } catch (error) {
        return `Error creating tool '${toolName}': ${error.message}`;
    }
}

function listAvailableTools() {
    const tools = Object.keys(TOOLS_MAP);
    return `Available tools: ${tools.join(', ')}`;
}

function readFile(params) {
    const { filename } = JSON.parse(params);
    try {
        const content = fs.readFileSync(filename, 'utf8');
        return `File content of ${filename}:\n${content}`;
    } catch (error) {
        return `Error reading file ${filename}: ${error.message}`;
    }
}

function listFiles(params) {
    const { directory = '.' } = JSON.parse(params);
    try {
        const files = fs.readdirSync(directory);
        return `Files in ${directory}: ${files.join(', ')}`;
    } catch (error) {
        return `Error listing files in ${directory}: ${error.message}`;
    }
}

function deleteFile(params) {
    const { filename } = JSON.parse(params);
    try {
        fs.unlinkSync(filename);
        return `File ${filename} deleted successfully`;
    } catch (error) {
        return `Error deleting file ${filename}: ${error.message}`;
    }
}

function updateFile(params) {
    const { filename, content, mode = 'replace' } = JSON.parse(params);
    try {
        if (mode === 'append') {
            fs.appendFileSync(filename, content, 'utf8');
            return `Content appended to ${filename} successfully`;
        } else {
            fs.writeFileSync(filename, content, 'utf8');
            return `File ${filename} updated successfully with ${content.length} characters`;
        }
    } catch (error) {
        return `Error updating file ${filename}: ${error.message}`;
    }
}
 
const TOOLS_MAP={
    "getWeatherInfo": getWeatherInfo,
    "executeCommand": executeCommand,
    "createFile": createFile,
    "createTool": createTool,
    "listAvailableTools": listAvailableTools,
    "readFile": readFile,
    "listFiles": listFiles,
    "deleteFile": deleteFile,
    "updateFile": updateFile,
};

const SYSTEM_PROMPT=`
    You are a helpful AI assistant who is designed to resolve user query.
    You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

    In the start phase, user gives a query to you. 
    Then, you THINK how to resolve the query atleast 3-4 times and make sure that all is clear.
    If there is a need to call a tool, you call an ACTION event with tool and input parameters.
    If there is an action call, wait for the OBSERVE that is the output of the tool.
    Based on the OBSERVE from previous step, you either output or repeat the loop.

    IMPORTANT: You can create your own tools if needed! If you need a specific functionality that doesn't exist, use the createTool function to make it.

    Rules: 
    -Always wait for next step.
    -Always output a single step and wait for next step
    -output must be strictly json
    -only call tool action from Available tools only.
    -strictly follow the output format in json.
    -When creating apps or files, use HTML/CSS/JavaScript for web apps and include all these files in a folder.
    -Use simple file operations like 'touch', 'mkdir', 'echo' for creating files
    -If you need a tool that doesn't exist, create it using createTool
    -When creating tools, the code should be a function body that returns a value
    -Do not use complex frameworks that require installation (like Flutter, React Native, etc.)

    Available tools:
    -getWeatherInfo(city:string):string
    -executeCommand(command:string):string Executes a given Linux/macOS command on user's device and returns the stdout and stderr.
    -createFile(params:string):string Creates a new file with proper content handling. Params should be JSON: {"filename":"path/name.ext","content":"complete file content with proper formatting"}
    -createTool(params:string):string Creates a new custom tool. Params should be JSON: {"toolName":"name","description":"what it does","code":"function body that returns a value"}
    -listAvailableTools():string Lists all currently available tools
    -readFile(params:string):string Reads content from a file. Params: {"filename":"path/to/file"}
    -listFiles(params:string):string Lists files in a directory. Params: {"directory":"path/to/dir"} (optional, defaults to current directory)
    -deleteFile(params:string):string Deletes a file. Params: {"filename":"path/to/file"}
    -updateFile(params:string):string Updates or appends to a file. Params: {"filename":"path","content":"new content","mode":"replace|append"}

    IMPORTANT for createFile:
    - Include complete, functional code in the content
    - Use proper indentation and formatting
    - Include all necessary HTML structure, CSS styles, and JavaScript functionality
    - For HTML files: include <!DOCTYPE html>, <html>, <head>, <body> tags
    - For CSS files: include all necessary styles with proper selectors
    - For JS files: include complete, working JavaScript code
    - Create files in organized folder structure (e.g., app_name/index.html, app_name/styles.css, app_name/script.js)

    Example of creating a tool:
    ACTION: Call Tool createTool with input {"toolName":"generateHTML","description":"Generates HTML template","code":"const {title, content} = JSON.parse(params); return \`<!DOCTYPE html><html><head><title>\${title}</title></head><body>\${content}</body></html>\`;"}

    Example:
    START: what is weather of Patiala?
    THINK: The user is asking about the weather in Patiala.
    THINK: From the available tools, I must call getWeatherInfo tool for Patiala as input
    ACTION: Call Tool getWeatherInfo with input Patiala
    OBSERVE: 32 Degree C
    THINK: The output of getWeatherInfo for Patiala is 32 Degree C
    OUTPUT: Hey, The weather in Patiala is 32 Degree C which is quite hot.

    Output Example:
    {"role":"user","content":"what is weather of Patiala?"}
    {"step":"THINK","content":"The user is asking about the weather in Patiala. From the available tools, I must call getWeatherInfo tool for Patiala as input"}
    {"step":"THINK","content":"From the available tools, I must call getWeatherInfo tool for Patiala as input"}
    {"step":"ACTION","tool":"getWeatherInfo","input":"Patiala","content":"Calling tool getWeatherInfo with input Patiala"}
    {"step":"OBSERVE","content":"32 Degree C"}
    {"step":"THINK","content":"The output of getWeatherInfo for Patiala is 32 Degree C"}
    {"step":"OUTPUT","content":"Hey, The weather in Patiala is 32 Degree C which is quite hot."}

    Output Format:
    {"step":"string","tool":"string","input":"string","content":"string"}
`;

const messages=[
    { 
        role: 'system', 
        content: SYSTEM_PROMPT,
    },
];

async function init() {
    messages.length = 1; 

    // Interactive mode - get user input from command line
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n🤖 AI Agent with Dynamic Tool Creation');
    console.log('=====================================');
    console.log('Available commands:');
    console.log('- Type your request and press Enter');
    console.log('- Type "exit" to quit');
    console.log('- Type "tools" to list available tools');
    console.log('- Type "help" for examples\n');

    const askQuestion = () => {
        rl.question('💬 You: ', async (user_query) => {
            if (user_query.toLowerCase() === 'exit') {
                console.log('👋 Goodbye!');
                rl.close();
                return;
            }

            if (user_query.toLowerCase() === 'tools') {
                console.log('🛠️  Available tools:', Object.keys(TOOLS_MAP).join(', '));
                askQuestion();
                return;
            }

            if (user_query.toLowerCase() === 'help') {
                console.log('📚 Example queries:');
                console.log('- "Create a todo app with modern design"');
                console.log('- "Build a calculator web app"');
                console.log('- "What\'s the weather in Paris?"');
                console.log('- "Create a file organizer script"');
                console.log('- "List files in current directory"');
                askQuestion();
                return;
            }

            if (!user_query.trim()) {
                askQuestion();
                return;
            }

            console.log('\n🤔 Agent is thinking...\n');
            
            // Clear previous conversation and start fresh
            messages.length = 1;
            messages.push({ role: 'user', content: user_query });

            try {
                await processAgentLoop();
            } catch (error) {
                console.log('❌ Error:', error.message);
            }

            console.log('\n' + '='.repeat(50) + '\n');
            askQuestion();
        });
    };

    askQuestion();
}

async function processAgentLoop() {
    let stepCount = 0;
    const maxSteps = 50; // Prevent infinite loops

    while (stepCount < maxSteps) {
        stepCount++;
        
        const response = await client.chat.completions.create({ 
            model: "openai/gpt-3.5-turbo",
            response_format: { type: 'json_object' },
            max_tokens: 2000,
            messages: messages,
        });

        messages.push({'role':'assistant', content: JSON.stringify(response.choices[0].message.content) });
        const parsed_response = JSON.parse(response.choices[0].message.content);

        if (parsed_response.step && parsed_response.step === "THINK") {
            console.log(`🧠 THINK: ${parsed_response.content}`);
            continue;
        }

        if (parsed_response.step && parsed_response.step === "OUTPUT") {
            console.log(`✅ OUTPUT: ${parsed_response.content}`);
            break;
        }

        if (parsed_response.step && parsed_response.step === "ACTION") {
            const tool = parsed_response.tool;
            const input = parsed_response.input;

            console.log(`⚡ ACTION: Using tool "${tool}"`);
            
            if (!TOOLS_MAP[tool]) {
                console.log(`❌ ERROR: Tool "${tool}" not found`);
                break;
            }

            try {
                const value = await TOOLS_MAP[tool](input);
                console.log(`📊 RESULT: ${value}`);

                messages.push({'role':'assistant', 
                    content: JSON.stringify({"step":"OBSERVE","content":value}) });
                continue;
            } catch (error) {
                const errorMsg = `Error executing tool ${tool}: ${error.message}`;
                console.log(`❌ ${errorMsg}`);
                messages.push({'role':'assistant', 
                    content: JSON.stringify({"step":"OBSERVE","content":errorMsg}) });
                continue;
            }
        }
    }

    if (stepCount >= maxSteps) {
        console.log('⚠️  Maximum steps reached. Agent may be in a loop.');
    }
}



init(); 