"use client"

import { useState, useEffect } from "react";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";


const model = new OpenAI({
    modelName: "gpt-4",
    openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    temperature: 0.9,
});

const memory = new BufferMemory();
const chain = new ConversationChain({llm: model, memory: memory});

const run = async(input:string) => {
    const response = await chain.call({input: input});
    return response.response;
}

const categories = [
    { label: "AP Psychology", value: "ap pschology" },
    { label: "AP Biology", value: "ap biology" },
    { label: "AP Chemistry", value: "ap chemistry" },
]

const ChatComponent = () => {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);

    const askFirstQuestion = async () => {
        setLoading(true);
        const firstQuestion = await run(
            `Ask a ${category} multiple choice question with four answer options separated into new lines in the AP CollegeBoard style, including a stimulus/background scenario.`
        );
        setResponse(firstQuestion);
        setLoading(false);
    };

    useEffect(() => {
        if(category !== "") {
            askFirstQuestion();
        }
    }, [category]);

    const handleSubmit = async(event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        const result = await run(
            `AI: ${response}\nYou: ${input}\nAI: Evaluate the answer and explain why the correct answer is right.`
        );
        setLoading(false);
        setResponse(result);
        setInput("");
    }

    return(
        <>
            <form onSubmit={handleSubmit} className="space-y-4 mt-3">
                <select value={category} onChange={(e)=>setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded">
                        <option value="">Select course</option>
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                </select>
                {response && (
                    <div className="mt-4 p-4 bg-grey-100 border border-gray-300 rounded">
                        {loading ? <p>Loading...</p> : <p>{response}</p>}
                    </div>
                )}
                <button value={'A'} onClick={(e)=>setInput('A')} className="w-full p-2 border border-grey-300 rounded hover:bg-blue-600 hover:text-white">A</button>
                <button value={'B'} onClick={(e)=>setInput('B')} className="w-full p-2 border border-grey-300 rounded hover:bg-blue-600 hover:text-white">B</button>
                <button value={'C'} onClick={(e)=>setInput('C')} className="w-full p-2 border border-grey-300 rounded hover:bg-blue-600 hover:text-white">C</button>
                <button value={'D'} onClick={(e)=>setInput('D')} className="w-full p-2 border border-grey-300 rounded hover:bg-blue-600 hover:text-white">D</button>
            </form>
            
        </>
    )
}

export default ChatComponent