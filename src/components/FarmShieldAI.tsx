import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, Image as ImageIcon, 
  Zap, Loader2 
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  image?: string;
  timestamp: Date;
}

const FarmShieldAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: "Strategic Hub online. I am your FarmShield AI Assistant. How can I optimize your agricultural strategy today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string, image?: string) => {
    if (!text.trim() && !image) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      image: image,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      let responseText = "";
      
      if (image) {
        // Handle Multimodal Image Analysis via /api/predict
        const blob = await (await fetch(image)).blob();
        const formData = new FormData();
        formData.append('image', blob, 'sample.jpg');

        const res = await fetch('http://127.0.0.1:5000/api/predict', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success) {
          responseText = `Specimen Analysis: Identified ${data.display_name} in ${data.crop_type}. Confidence: ${data.confidence}%. Strategic Advice: ${data.description} ${data.recovery_days ? 'Recovery estimated in ' + data.recovery_days + '.' : ''}`;
        } else {
          responseText = "Neural analysis failed. Please ensure the specimen is clear and well-lit.";
        }
      } else {
        // Handle Chat Intelligence via /api/chat
        const res = await fetch('http://127.0.0.1:5000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text })
        });
        const data = await res.json();
        responseText = data.success ? data.response : "Strategic Hub communication error. Please try again.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: 'err',
        type: 'bot',
        text: "Connection to Intelligence Hub lost. Check if neural engine is online.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSend("Analyze this specimen", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-farm-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(82,183,136,0.3)]">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-white text-sm font-bold tracking-tight">FarmShield AI</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-farm-accent rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Strategic Assistant</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.type === 'bot' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.type === 'bot' 
                      ? 'bg-white/5 text-white/80 rounded-tl-none border border-white/5 shadow-lg' 
                      : 'bg-farm-accent text-black font-medium rounded-tr-none shadow-lg'
                  }`}>
                    {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-black/10">
                        <img src={msg.image} alt="Upload" className="w-full h-auto" />
                      </div>
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-2xl p-4 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-farm-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-farm-accent/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-farm-accent/40 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-5 bg-white/5 border-t border-white/5">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-farm-accent hover:bg-white/10 transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder="Ask FarmShield AI..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-farm-accent/40 transition-all placeholder:text-white/20"
                  />
                  <button 
                    onClick={() => handleSend(input)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-farm-accent hover:scale-110 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-farm-accent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(82,183,136,0.3)] group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <X className="w-7 h-7 text-black relative z-10" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
              <MessageSquare className="w-7 h-7 text-black relative z-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default FarmShieldAI;
