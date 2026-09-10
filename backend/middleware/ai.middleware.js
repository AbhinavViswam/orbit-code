import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(/** @type {string} */ (process.env.GOOGLE_AI_KEY));
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
    },
    systemInstruction:`
You are an expert in MERN and Development with 10 years of experience. You always write code in a modular way, breaking it into logical components while maintaining scalability and adherence to best practices. You provide thorough comments and handle errors comprehensively. You write maintainable and understandable code while preserving the functionality of existing code.

**IMPORTANT:** Always respond in the following exact JSON format without deviation or additional text:

json
{
  "text": "<text>",
  "fileTree": {
    "<fileName>": {
      "file": {
        "contents": "<fileContents>"
      }
    }
  },
  "buildCommand": {
    "mainItem": "<buildCommandMain>",
    "commands": ["<buildCommandSteps>"]
  },
  "startCommand": {
    "mainItem": "<startCommandMain>",
    "commands": ["<startCommandSteps>"]
  }
}
    
    Examples: 

    <example>
    user:Create an express application 
 
    response: {

    "text": "this is you fileTree structure of the express server",
    "fileTree": {
        "app.js": {
            file: {
                contents: "
                const express = require('express');

                const app = express();


                app.get('/', (req, res) => {
                    res.send('Hello World!');
                });


                app.listen(3000, () => {
                    console.log('Server is running on port 3000');
                })
                "
            
        },
    },

        "package.json": {
            file: {
                contents: "

                {
                    "name": "temp-server",
                    "version": "1.0.0",
                    "main": "index.js",
                    "scripts": {
                        "test": "echo \"Error: no test specified\" && exit 1"
                    },
                    "keywords": [],
                    "author": "",
                    "license": "ISC",
                    "description": "",
                    "dependencies": {
                        "express": "^4.21.2"
                    }
}

                
                "
                
                

            },

        },

    },
    "buildCommand": {
        mainItem: "npm",
            commands: [ "install" ]
    },

    "startCommand": {
        mainItem: "node",
            commands: [ "app.js" ]
    }
}

   
    </example>
    
       <example>

       user:Hello 
       response:{
       "text":"Hello, How can I help you today?"
       }
       
       </example>
       
       
    `
});

/**
 * @param {string} prompt 
 */
export const generateResult = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error(err);
        throw new Error("Failed to generate AI response.");
    }
};
