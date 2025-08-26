import {OpenAI} from 'openai';

const OPENAI_API_KEY="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";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

async function 

async function init(){
    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            { role: 'user', 
            content: 'Can you create a package.json file on my system?' },
        ],
    });
    console.log(response.choices[0].message.content);
}

init();