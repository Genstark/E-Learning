const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Load your API key securely
const genAI = new GoogleGenerativeAI(process.env.GEMINI);

async function generateText(prompt) {
    console.log('Wait... for Generating Tasks');
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Use "gemini-2.5-flash" if available to you
        });
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    {
                        text: `
                            You are a fun and engaging teacher who creates educational puzzles.
                            Your job is to turn the following text into a mix of multiple-choice generate 10 questions.
                            question like:
                            {
                                "questions": [
                                {
                                    "type": "multiple_choice",
                                    "question": "...",
                                    "options": ["...", "..."],
                                    "correctAnswer": "write here correct index of options in number not in string"
                                }
                            ]} and ${prompt}
                        `
                    }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        return result.response.text();
    }
    catch (error) {
        console.error("Error generating text:", error);
        throw error;
    }
}
// generateText("generate most tough and tough questions scientific");

module.exports = { generateText };