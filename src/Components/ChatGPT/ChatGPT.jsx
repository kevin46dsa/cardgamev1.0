import React, {useState} from 'react';
import FormSection from "./FormSection";
import AnswerSection from "./AnswerSection";
import { Configuration, OpenAIApi } from 'openai';

const ChatGPT = () => {
    const configuration = new Configuration({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    });
    delete configuration.baseOptions.headers['User-Agent'];
    const openai = new OpenAIApi(configuration);

    const [storedValues, setStoredValues] = useState([]);

    async function generateResponse (newQuestion, setNewQuestion) {
            let options = {
                model: 'text-davinci-003',
                temperature: 0,
                max_tokens: 100,
                top_p: 1,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stop: ['/'],
            }

            let completeOptions = {
                ...options,
                prompt: newQuestion,
            };

            const response = await openai.createCompletion(completeOptions);
            console.log(response)
    
            if (response.data.choices) {
                setStoredValues([
                    {
                        question: newQuestion,
                        answer: response.data.choices[0].text,
                    },
                    ...storedValues,
                ]);
    
            setNewQuestion('');
    
        } 
    }      

    return (
        <div>
            <div className="header-section">
                <h1>ChatGPT CLONE 🤖</h1>
                <p>
                    I am an automated question and answer system, designed to assist you
                    in finding relevant information. You are welcome to ask me any queries
                    you may have, and I will do my utmost to offer you a reliable
                    response. Kindly keep in mind that I am a machine and operate solely
                    based on programmed algorithms.
                </p>
            </div>

            <FormSection generateResponse={generateResponse} />
            <AnswerSection storedValues={storedValues} />
        </div>
    );
};

export default ChatGPT;