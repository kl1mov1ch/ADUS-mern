import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, CardBody, Spinner, Divider, Chip } from '@nextui-org/react';
import { IoIosSearch, IoMdClose, IoMdSend } from 'react-icons/io';
import { FaRegCopy, FaRobot } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useChatGPTMutation } from '../../app/services/userApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Message = {
    content: string;
    sender: 'user' | 'gpt';
};

export const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
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
            toast.error('Произошла ошибка. Попробуйте снова.', {
                position: "top-right",
                autoClose: 3000,
            });
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
            toast.success('Текст скопирован в буфер обмена', {
                position: "top-right",
                autoClose: 2000,
            });
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
                    customStyle={{
                        borderRadius: '8px',
                        margin: '10px 0',
                        fontSize: '0.85rem',
                        background: '#1e1e1e'
                    }}
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
      <div className="flex flex-col h-screen bg-white p-4 overflow-hidden">
          <ToastContainer position="top-right" autoClose={3000} />

          <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
              {/* Header */}
              <div className="mb-4 text-center">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      AI Чат-помощник
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm">
                      Задавайте вопросы и получайте развернутые ответы
                  </p>
              </div>

              {/* Search */}
              <div className="flex justify-center mb-3">
                  <Input
                    isClearable
                    radius="lg"
                    placeholder="Поиск по чату..."
                    startContent={<IoIosSearch className="text-gray-400" />}
                    endContent={
                      searchTerm && (
                        <IoMdClose
                          className="cursor-pointer text-gray-400 hover:text-gray-600"
                          onClick={clearSearch}
                        />
                      )
                    }
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="w-full max-w-md"
                    classNames={{
                        input: "text-sm",
                        inputWrapper: "h-9"
                    }}
                  />
              </div>

              {/* Chat Container */}
              <Card className="flex-1 mb-3 shadow-sm border border-gray-200 rounded-lg">
                  <CardBody className="p-0 h-full">
                      <div
                        ref={chatContainerRef}
                        className="p-3 overflow-y-auto h-full flex flex-col space-y-3 bg-white rounded-lg"
                        style={{ maxHeight: 'calc(100vh - 220px)' }}
                      >
                          {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <motion.div
                                  animate={{
                                      y: [0, -5, 0],
                                      scale: [1, 1.03, 1]
                                  }}
                                  transition={{
                                      repeat: Infinity,
                                      duration: 3
                                  }}
                                >
                                    <FaRobot className="text-5xl text-blue-500 mb-3" />
                                </motion.div>
                                <h3 className="text-lg font-semibold mb-1 text-gray-700">
                                    Как я могу вам помочь сегодня?
                                </h3>
                                <p className="text-gray-500 text-sm max-w-md">
                                    Задайте любой вопрос и получайте развернутый ответ.
                                </p>
                            </div>
                          ) : (
                            <AnimatePresence>
                                {filteredMessages.map((msg, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                  >
                                      <div
                                        className={`p-3 rounded-xl max-w-[85%] relative ${
                                          msg.sender === 'user'
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-gray-100 rounded-bl-none'
                                        }`}
                                      >
                                          {msg.sender === 'gpt' && (
                                            <div className="flex justify-between items-center mb-1">
                                                <Chip
                                                  color="primary"
                                                  variant="flat"
                                                  size="sm"
                                                  startContent={<FaRobot className="mr-1" />}
                                                  className="text-xs"
                                                >
                                                    AI Ассистент
                                                </Chip>
                                                <Button
                                                  isIconOnly
                                                  size="sm"
                                                  variant="light"
                                                  onClick={() => copyToClipboard(msg.content)}
                                                  className="text-gray-600"
                                                >
                                                    <FaRegCopy size={12} />
                                                </Button>
                                            </div>
                                          )}

                                          <div className={`${msg.sender === 'user' ? 'text-white' : 'text-gray-800'} text-sm`}>
                                              {renderMessageContent(msg.content)}
                                          </div>

                                          <div
                                            className={`absolute w-2 h-2 -bottom-1 ${
                                              msg.sender === 'user'
                                                ? 'right-0 bg-blue-500'
                                                : 'left-0 bg-gray-100'
                                            }`}
                                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
                                          />
                                      </div>
                                  </motion.div>
                                ))}
                            </AnimatePresence>
                          )}

                          {isLoading && (
                            <div className="flex justify-center items-center p-2">
                                <Spinner
                                  size="md"
                                  color="primary"
                                  label="AI думает..."
                                  labelColor="primary"
                                  classNames={{
                                      label: "text-sm"
                                  }}
                                />
                            </div>
                          )}
                      </div>
                  </CardBody>
              </Card>

              {/* Input Area */}
              <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1"
                    classNames={{
                        inputWrapper: "h-10 bg-white",
                        input: "text-sm"
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleMessageSend()}
                    endContent={
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => setMessage('')}
                          className={!message ? 'opacity-0' : ''}
                        >
                            <IoMdClose size={14} />
                        </Button>
                    }
                  />
                  <Button
                    onClick={handleMessageSend}
                    color="primary"
                    isDisabled={isLoading || !message.trim()}
                    className="h-10 w-10 min-w-0"
                    isIconOnly
                  >
                      <IoMdSend size={16} />
                  </Button>
              </div>
          </div>
      </div>
    );
};

export default ChatPage;