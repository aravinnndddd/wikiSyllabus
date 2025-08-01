"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { generateModuleTasks, GenerateModuleTasksOutput } from "@/ai/flows/generate-module-tasks";
import { chatWithSyllabus } from "@/ai/flows/chat-with-syllabus";
import { Header } from "@/components/common/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export default function ChatWithFilePage() {
    const [markdown, setMarkdown] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAwaitingAi, setIsAwaitingAi] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleGenerateTasks = async () => {
        if (!markdown.trim()) {
            setError("Please paste your syllabus content first.");
            return;
        }
        setLoading(true);
        setError(null);
        setIsAwaitingAi(true);
        setMessages([]);

        try {
            const result: GenerateModuleTasksOutput = await generateModuleTasks({ moduleContent: markdown });
            setMessages([
                {
                    role: "system",
                    content: `You are an expert assistant for the provided syllabus content.\n\n${markdown}`
                },
                {
                    role: "assistant",
                    content: `📝 **Learning Tasks:**\n${result.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
                },
                {
                    role: "assistant",
                    content: `🌍 **Real-world Applications:**\n${result.realWorldApplications}`
                }
            ]);
        } catch (e) {
            setError("Failed to generate tasks and applications from the provided content.");
        } finally {
            setLoading(false);
            setIsAwaitingAi(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isAwaitingAi) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setIsAwaitingAi(true);
        setError(null);
        
        try {
            const chatHistory = messages.filter(m => m.role !== 'system');
            const result = await chatWithSyllabus({ history: chatHistory, message: input });
            const assistantMessage: Message = { role: 'assistant', content: result.response };
            setMessages(msgs => [...msgs, assistantMessage]);

        } catch (e) {
            console.error("Error getting AI response:", e);
            setError("Sorry, something went wrong. Please try again.");
        } finally {
            setLoading(false);
            setIsAwaitingAi(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Chat with Any Syllabus</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                        Paste any syllabus or educational content below. Our AI will help you understand it, generate learning tasks, and answer your questions.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    <Card className="shadow-lg rounded-2xl bg-card/80 backdrop-blur-sm">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-xl font-semibold">Your Content</h2>
                            <Textarea
                                placeholder="Paste your syllabus markdown here..."
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                rows={20}
                                className="w-full text-base rounded-xl focus-visible:ring-primary bg-background/70"
                                disabled={isAwaitingAi}
                            />
                            <Button onClick={handleGenerateTasks} disabled={loading || !markdown.trim()} className="w-full text-lg py-6">
                                {isAwaitingAi && loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                                Generate Insights
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col h-full">
                        <Card className="flex-1 flex flex-col shadow-lg rounded-2xl h-[650px] bg-card/80 backdrop-blur-sm">
                            <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
                               <h2 className="text-xl font-semibold mb-4 text-center">AI Assistant</h2>
                               <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                {messages.filter(m => m.role !== 'system').length === 0 && !loading && (
                                     <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30">
                                         <Sparkles className="h-4 w-4 text-primary" />
                                         <AlertTitle>Ready to Assist!</AlertTitle>
                                         <AlertDescription>
                                             Your AI study assistant will appear here once you generate insights.
                                         </AlertDescription>
                                     </Alert>
                                )}
                                {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                                     <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      {msg.role === 'assistant' && <Avatar className="w-8 h-8"><AvatarFallback>AI</AvatarFallback></Avatar>}
                                      <div
                                        className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-base whitespace-pre-wrap shadow-md ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                                : 'bg-background text-foreground rounded-bl-none'
                                            }`}
                                      >
                                        {msg.content}
                                      </div>
                                      {msg.role === 'user' && <Avatar className="w-8 h-8"><AvatarFallback>You</AvatarFallback></Avatar>}
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start items-center gap-3">
                                        <Avatar className="w-8 h-8"><AvatarFallback>AI</AvatarFallback></Avatar>
                                        <div className="flex items-center gap-2 text-muted-foreground bg-background rounded-2xl px-4 py-3 shadow-md">
                                            <Loader2 className="h-5 w-5 animate-spin" /> AI is thinking...
                                        </div>
                                    </div>
                                )}
                                {error && <div className="text-center text-destructive py-4">{error}</div>}
                                <div ref={chatEndRef} />
                               </div>
                            </CardContent>
                            <div className="p-4 border-t">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex gap-2"
                                >
                                    <input
                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about your syllabus..."
                                        disabled={loading || messages.length === 0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                    />
                                    <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
