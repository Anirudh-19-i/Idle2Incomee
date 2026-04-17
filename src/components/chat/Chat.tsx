import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db, collection, query, where, onSnapshot, addDoc, serverTimestamp, handleFirestoreError, OperationType, orderBy, doc, setDoc } from '../../lib/firebase';
import { Message as MessageType, Item } from '../../types';
import { Card, Button, Input } from '../ui/Base';
import { Send, User as UserIcon, Package } from 'lucide-react';
import { motion } from 'motion/react';

export const ChatList: React.FC<{ onSelectChat: (chatId: string, otherName: string) => void }> = ({ onSelectChat }) => {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<{ id: string, lastMessage: string, otherName: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch participants-based chats
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userChats = snapshot.docs.map(doc => {
        const uids: string[] = doc.data().participants || [];
        const otherUid = uids.find(id => id !== user.uid);
        return {
          id: doc.id,
          lastMessage: 'Open to see messages',
          otherName: 'Neighbor' 
        };
      });
      setChats(userChats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return unsubscribe;
  }, [user]);

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Messages</h2>
      {chats.length > 0 ? (
        <div className="space-y-3">
          {chats.map(chat => (
            <Card key={chat.id} className="p-4 cursor-pointer hover:border-orange-200" onClick={() => onSelectChat(chat.id, chat.otherName)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <UserIcon size={24} className="text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{chat.otherName}</h4>
                  <p className="text-sm text-slate-500">{chat.lastMessage}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <p className="text-slate-500">No conversations yet. Book an item to start chatting!</p>
        </div>
      )}
    </div>
  );
};

export const ChatWindow: React.FC<{ chatId: string, otherName: string, onBack: () => void }> = ({ chatId, otherName, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageType));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return unsubscribe;
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    try {
      // Ensure chat document exists with participants list
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants: chatId.split('_'),
        lastUpdate: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: inputText,
        senderUid: user.uid,
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto pt-24 pb-20 px-4">
      <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-white sticky top-24 z-10">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
           <Package size={20} className="rotate-90" />
        </Button>
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <UserIcon size={20} className="text-orange-600" />
        </div>
        <h4 className="font-bold text-slate-900">{otherName}</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderUid === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.senderUid === user?.uid ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <Input 
          placeholder="Type a message..." 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <Button type="submit" size="sm" className="px-4">
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
};
