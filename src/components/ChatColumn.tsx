import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

// --- Типы ---
type Message = {
  author: 'user' | 'gpt';
  text: string;
};

type ChatColumnProps = {
  startPrompt: string;
  setArchitecture: React.Dispatch<React.SetStateAction<any>>;
};

// --- Системный промпт ---
const SYSTEM_PROMPT = `Ты — 'Archie', русскоязычный системный архитектор и наставник. Твоя задача — вести пользователя через процесс проектирования архитектуры приложения.

**СТРОГИЕ ПРАВИЛА, КОТОРЫЕ ТЫ ОБЯЗАН ВЫПОЛНЯТЬ:**
1.  **ВСЕГДА отвечай на русском языке.**
2.  Твой главный инструмент — JSON. **ЛЮБОЕ** упоминание нового компонента, технологии или связи между ними **ТРЕБУЕТ** от тебя генерации JSON-объекта в конце ответа. Даже если это самый первый компонент.
3.  JSON-объект **ОБЯЗАТЕЛЬНО** должен быть обернут в тег <JSON>...</JSON>. Без исключений.
4.  JSON **ВСЕГДА** должен содержать полную и актуальную архитектуру, а не только изменения.
5.  Если добавляется компонент, который общается с уже существующим, ты **ОБЯЗАН** добавить запись в "data_flows".
6.  В "data_flows" используй "id" компонентов из массива "components".

**Пример твоего ПРАВИЛЬНОГО ответа:**
Пользователь: "Начнем с фронтенда на React."
Твой ответ:
Отлично! Добавляем Frontend. Это будет клиентское веб-приложение для пользователей. Какой будет следующий шаг?

<JSON>
{
  "components": [
    {
      "id": "frontend",
      "name": "Frontend",
      "tech": "React",
      "description": "Клиентское веб-приложение для пользователей."
    }
  ],
  "data_flows": []
}
</JSON>`;

// --- Клиент API ---
const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  dangerouslyAllowBrowser: true,
});

// --- Компонент ---
export function ChatColumn({startPrompt, setArchitecture }: ChatColumnProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
  { author: 'gpt', text: 'Здравствуйте! Я ваш GPT-тренер.' },
  // Сразу добавляем "невидимое" первое сообщение от пользователя
  { author: 'user', text: startPrompt },
]);
  const [isLoading, setIsLoading] = useState(false);

  const isInitialRequestSent = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
  // Этот эффект срабатывает каждый раз, когда меняется массив сообщений
  const lastMessage = messages[messages.length - 1];

  // Если последнее сообщение от пользователя, значит, нужно получить ответ от GPT
  if (lastMessage?.author === 'user') {
    if (lastMessage.text === startPrompt && isInitialRequestSent.current) {
      return; // Если это стартовый промпт и мы уже отправляли запрос, выходим
    }
    const sendRequest = async () => {
      setIsLoading(true);
      try {
        const messagesForApi = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((msg) => ({
            role: msg.author === 'gpt' ? 'assistant' : 'user',
            content: msg.text,
          })),
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

        const completion = await openai.chat.completions.create({
          model: 'llama3',
          messages: messagesForApi,
        });

        const gptResponseText = completion.choices[0].message.content;

        if (gptResponseText) {
          const [cleanText, newArchitecture] = parseArchitecture(gptResponseText);
          setMessages((prev) => [...prev, { author: 'gpt', text: cleanText }]);
          if (newArchitecture) {
            setArchitecture(newArchitecture);
          }
        }
      } catch (error) {
        console.error('Ошибка при запросе к Ollama:', error);
        setMessages((prev) => [
          ...prev,
          { author: 'gpt', text: 'Извините, произошла ошибка.' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    sendRequest();
    // Если это был стартовый промпт, ставим флаг
    if (lastMessage.text === startPrompt) {
      isInitialRequestSent.current = true;
    }
  }
}, [messages, startPrompt]);

  function parseArchitecture(responseText: string): [string, any | null] {
    const jsonRegex = /<JSON>(.*?)<\/JSON>/s;
    const match = responseText.match(jsonRegex);
    if (match && match[1]) {
      const jsonString = match[1];
      const cleanText = responseText.replace(jsonRegex, '').trim();
      try {
        const parsedJson = JSON.parse(jsonString);
        return [cleanText, parsedJson];
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
        return [responseText, null];
      }
    }
    return [responseText, null];
  }

  const handleSend = async () => {
  if (inputValue.trim() === '' || isLoading) return;

  const userMessage: Message = { author: 'user', text: inputValue };
  // Используем callback-форму setMessages для получения самого свежего состояния
  setMessages(prevMessages => [...prevMessages, userMessage]);
  setInputValue('');
};

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2">
        Диалог с тренером
      </h2>
      <div
        ref={messagesContainerRef}
        className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[85%] ${
              msg.author === 'user'
                ? 'bg-violet-600 self-end'
                : 'bg-slate-600 self-start'
            }`}
          >
            <p className="text-white whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-lg max-w-[85%] bg-slate-600 self-start">
            <p className="text-white animate-pulse">Печатает...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            placeholder="Начните проектирование..."
            className="w-full p-2 rounded bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
}