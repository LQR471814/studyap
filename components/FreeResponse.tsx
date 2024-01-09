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
            `Ask a ${category} free response question in the AP CollegeBoard style, including a stimulus/background scenario.`
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
            `AI: ${response}\nYou: ${input}\nAI: Evaluate the answer and score it based on AP CollegeBoard scoring guidlines. Say the final score at the end of your analysis.`
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
                    <div className="mt-4 p-4 bg-grey-100 ">
                        {loading ? <p>Loading...</p> : <p>{response}</p>}
                    </div>
                )}
                <textarea value={input} onChange={(e)=>setInput(e.target.value)} className="w-full border border-gray-300 rounded h-[300px] p-4"/>
                <button type="submit" className="p-2 rounded bg-blue-600 text-white">Submit</button>
                <button type="button" className="ml-5 p-2 rounded bg-white border border-blue-600 text-blue-600" onClick={askFirstQuestion}>New question</button>
            </form>
            
        </>
    )
}

export default ChatComponent