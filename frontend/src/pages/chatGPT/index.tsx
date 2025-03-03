import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, CardBody, Spinner } from '@nextui-org/react';
import { IoIosSearch, IoMdClose } from 'react-icons/io';
import { FaRegCopy, FaRobot } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChatGPTMutation } from '../../app/services/userApi';

type Message = {
    content: string;
    sender: 'user' | 'gpt';
};

export const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [notification, setNotification] = useState<string | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [chatWithGPT] = useChatGPTMutation();

    const handleMessageSend = async () => {
        if (!message.trim()) return;

        const newMessage: Message = { content: message, sender: 'user' };
        setMessages([...messages, newMessage]);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await chatWithGPT({ message });
            // @ts-ignore
            const gptMessage: Message = { content: response.data.reply, sender: 'gpt' };
            setMessages((prevMessages) => [...prevMessages, gptMessage]);
        } catch (error) {
            console.error('Ошибка при отправке сообщения', error);
            setMessages((prevMessages) => [
                ...prevMessages,
                { content: 'Произошла ошибка. Попробуйте снова.', sender: 'gpt' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSearch = () => setSearchTerm('');

    const filteredMessages = messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setNotification('Текст скопирован в буфер обмена');
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Ошибка при копировании текста', error);
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const renderMessageContent = (content: string) => {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const parts = content.split(codeBlockRegex);

        return parts.map((part, index) => {
            if (index % 3 === 2) {
                const language = parts[index - 1] || 'javascript';
                return (
                  <SyntaxHighlighter
                    key={index}
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{ borderRadius: '8px', margin: '10px 0' }}
                  >
                      {part}
                  </SyntaxHighlighter>
                );
            } else {
                return (
                  <div key={index} className="whitespace-pre-wrap">
                      {part}
                  </div>
                );
            }
        });
    };

    return (
      <div className="flex flex-col h-screen p-4 max-w-4xl mx-auto">
          <div className="flex items-center mb-4 justify-center">
              <Input
                isClearable
                placeholder="Поиск по чату..."
                startContent={<IoIosSearch />}
                endContent={
                  searchTerm && <IoMdClose className="cursor-pointer" onClick={clearSearch} />
                }
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="w-1/2"
              />
          </div>

          <Card className="flex-1 mb-4 max-h-[65vh] overflow-hidden shadow-lg border-5">
              <div
                ref={chatContainerRef}
                className="p-4 overflow-y-auto h-full flex flex-col space-y-4"
              >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                        <FaRobot className="text-6xl text-gray-400 mb-4" />
                        <p className="text-lg">Чем я могу вам помочь?</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                        {filteredMessages.map((msg, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${
                              msg.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                              <div
                                className={`p-3 rounded-lg max-w-[70%] ${
                                  msg.sender === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100'
                                }`}
                              >
                                  {msg.sender === 'gpt' && (
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center">
                                            <FaRobot className="text-lg text-gray-700 mr-2" />
                                            <span className="text-sm text-gray-700">
                                                        ChatGPT:
                                                    </span>
                                        </div>
                                        <Button
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => copyToClipboard(msg.content)}
                                          color="success"
                                        >
                                            <FaRegCopy />
                                        </Button>
                                    </div>
                                  )}
                                  <div className="whitespace-pre-wrap">
                                      {renderMessageContent(msg.content)}
                                  </div>
                              </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  )}

                  {isLoading && (
                    <div className="flex justify-center">
                        <Spinner aria-label="Загрузка..." />
                    </div>
                  )}
              </div>
          </Card>

          <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleMessageSend()}
              />
              <Button onClick={handleMessageSend} color="primary" disabled={isLoading}>
                  Отправить
              </Button>
          </div>

          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
            >
                {notification}
            </motion.div>
          )}
      </div>
    );
};

export default ChatPage;