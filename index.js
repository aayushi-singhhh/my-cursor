import {OpenAI} from 'openai';
import {exec} from 'node:child_process';
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
        exec(`echo '${content.replace(/'/g, "'\\''")}' > ${filename}`, function (error, stdout, stderr) {
            if (error) {
                return reject(error);
            }
            resolve(`File ${filename} created successfully`);
        });
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
 
const TOOLS_MAP={
    "getWeatherInfo": getWeatherInfo,
    "executeCommand": executeCommand,
    "createFile": createFile,
    "createTool": createTool,
    "listAvailableTools": listAvailableTools,
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
    -When creating apps or files, use HTML/CSS/JavaScript for web apps
    -Use simple file operations like 'touch', 'mkdir', 'echo' for creating files
    -If you need a tool that doesn't exist, create it using createTool
    -When creating tools, the code should be a function body that returns a value
    -Do not use complex frameworks that require installation (like Flutter, React Native, etc.)

    Available tools:
    -getWeatherInfo(city:string):string
    -executeCommand(command:string):string Executes a given Linux/macOS command on user's device and returns the stdout and stderr.
    -createFile(params:string):string Creates a new file. Params should be JSON: {"filename":"name.ext","content":"file content"}
    -createTool(params:string):string Creates a new custom tool. Params should be JSON: {"toolName":"name","description":"what it does","code":"function body that returns a value"}
    -listAvailableTools():string Lists all currently available tools

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
    // Clear messages and start fresh
    messages.length = 1; // Keep only the system prompt

    const user_query="Create a complete todo list app with blue and grey aesthetics and lots of emojis. First create any tools you need, then use them to generate the app files. make the app in a folder named to do list and put all the code in it. fully functional";
    messages.push({ role: 'user', content: user_query });

    while (true){
        const response= await client.chat.completions.create({ 
            model: "openai/gpt-3.5-turbo", // Cheaper model to save credits
            response_format: { type: 'json_object' },
            max_tokens: 2000, // Reduced from default 16384 to stay within credit limits
            messages: messages,
        });

        messages.push({'role':'assistant', content: JSON.stringify(response.choices[0].message.content) });
        const parsed_response = JSON.parse(response.choices[0].message.content);

        if (parsed_response.step&& parsed_response.step==="THINK"){
            console.log(`THINK: ${parsed_response.content}`);
            continue;
        }
        if (parsed_response.step&& parsed_response.step==="OUTPUT"){
            console.log(`OUTPUT: ${parsed_response.content}`);
            break;
        }
        if (parsed_response.step&& parsed_response.step==="ACTION"){
            const tool=parsed_response.tool;
            const input=parsed_response.input;

            console.log(`DEBUG: Trying to call tool "${tool}" with input "${input}"`);
            console.log(`DEBUG: Available tools:`, Object.keys(TOOLS_MAP));
            
            if (!TOOLS_MAP[tool]) {
                console.log(`ERROR: Tool "${tool}" not found in TOOLS_MAP`);
                break;
            }

            const value = await TOOLS_MAP[tool](input);
            console.log(`ACTION: Tool Call ${tool}: (${input}):${value})`);

            messages.push({'role':'assistant', 
                content: JSON.stringify({"step":"OBSERVE","content":value}) });
            continue;
            }
        }
}



init(); 