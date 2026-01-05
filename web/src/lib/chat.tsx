'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

interface ChatContextType {
    chats: Chat[];
    activeChatId: string | null;
    activeChat: Chat | null;
    createNewChat: () => string;
    setActiveChat: (id: string | null) => void;
    addMessageToChat: (chatId: string, message: Omit<Message, 'timestamp'>) => void;
    appendTokenToLastMessage: (chatId: string, token: string) => void;
    updateLastMessage: (chatId: string, content: string) => void;
    deleteChat: (id: string) => void;
    clearAllChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'medibook_chats';

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Load chats from localStorage on mount
    useEffect(() => {
        const savedChats = localStorage.getItem(STORAGE_KEY);
        if (savedChats) {
            try {
                const parsed = JSON.parse(savedChats);
                setChats(parsed);
                // Set the most recent chat as active if it exists
                if (parsed.length > 0) {
                    setActiveChatId(parsed[0].id);
                }
            } catch (e) {
                console.error('Failed to parse saved chats', e);
            }
        }
    }, []);

    // Save chats to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }, [chats]);

    const createNewChat = () => {
        const newChat: Chat = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        return newChat.id;
    };

    const setActiveChat = (id: string | null) => {
        setActiveChatId(id);
    };

    const addMessageToChat = (chatId: string, messageData: Omit<Message, 'timestamp'>) => {
        const message: Message = {
            ...messageData,
            timestamp: Date.now(),
        };

        setChats(prev => prev.map(chat => {
            if (chat.id === chatId) {
                const updatedMessages = [...chat.messages, message];
                // Update title based on first user message if it's still "New Chat"
                let newTitle = chat.title;
                if (chat.title === 'New Chat' && messageData.role === 'user') {
                    newTitle = messageData.content.slice(0, 30) + (messageData.content.length > 30 ? '...' : '');
                }
                
                return {
                    ...chat,
                    messages: updatedMessages,
                    title: newTitle,
                    updatedAt: Date.now(),
                };
            }
            return chat;
        }));
    };

    const appendTokenToLastMessage = (chatId: string, token: string) => {
        setChats(prev => prev.map(chat => {
            if (chat.id === chatId && chat.messages.length > 0) {
                const updatedMessages = [...chat.messages];
                const lastMessage = { ...updatedMessages[updatedMessages.length - 1] };
                lastMessage.content += token;
                updatedMessages[updatedMessages.length - 1] = lastMessage;
                
                return {
                    ...chat,
                    messages: updatedMessages,
                    updatedAt: Date.now(),
                };
            }
            return chat;
        }));
    };

    const updateLastMessage = (chatId: string, content: string) => {
        setChats(prev => prev.map(chat => {
            if (chat.id === chatId && chat.messages.length > 0) {
                const updatedMessages = [...chat.messages];
                const lastMessage = { ...updatedMessages[updatedMessages.length - 1], content };
                updatedMessages[updatedMessages.length - 1] = lastMessage;
                
                return {
                    ...chat,
                    messages: updatedMessages,
                    updatedAt: Date.now(),
                };
            }
            return chat;
        }));
    };

    const deleteChat = (id: string) => {
        setChats(prev => prev.filter(chat => chat.id !== id));
        if (activeChatId === id) {
            const remainingChats = chats.filter(chat => chat.id !== id);
            setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
        }
    };

    const clearAllChats = () => {
        setChats([]);
        setActiveChatId(null);
    };

    const activeChat = chats.find(c => c.id === activeChatId) || null;

    return (
        <ChatContext.Provider value={{
            chats,
            activeChatId,
            activeChat,
            createNewChat,
            setActiveChat,
            addMessageToChat,
            appendTokenToLastMessage,
            updateLastMessage,
            deleteChat,
            clearAllChats
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
