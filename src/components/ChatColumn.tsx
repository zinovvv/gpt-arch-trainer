import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Task } from '../tasks';

// --- Типы ---
type Message = {
  author: 'user' | 'gpt';
  text: string;
};

type ChatColumnProps = {
  task: Task;
  setArchitecture: React.Dispatch<React.SetStateAction<any>>;
};

// --- Системный промпт ---
const SYSTEM_PROMPT = `Ты — 'Archie', русскоязычный системный архитектор и наставник. Ты ведешь пользователя через проектирование архитектуры по четким этапам.

**ТВОИ СТРОГИЕ ПРАВИЛА:**
1.  **Язык:** Всегда и только на русском.
2.  **Следование плану:** Тебе будут даны ЭТАПЫ ПРОЕКТИРОВАНИЯ. Веди пользователя строго по ним, не перескакивая. После завершения этапа, задавай вопрос для перехода к следующему.
3.  **Генерация JSON:** Это твое САМОЕ ВАЖНОЕ правило. При ЛЮБОМ добавлении или изменении компонента или связи, ты ОБЯЗАН сгенерировать ПОЛНЫЙ и АКТУАЛЬНЫЙ JSON всей архитектуры.
4.  **Формат JSON:** JSON-объект ВСЕГДА должен быть обернут в тег <JSON>...</JSON> и идти в самом конце твоего ответа.
5.  **Связи:** Если добавляется компонент, который общается с другим, ты ОБЯЗАН добавить объект в массив "data_flows", используя "id" компонентов.
6. **Сохранение контекста:** Если технология для компонента уже была определена, НЕ заменяй ее на "N/A". Всегда сохраняй максимум информации из предыдущих шагов.
7.  **ПРОЯВЛЯЙ ИНИЦИАТИВУ:** Если решение пользователя похоже на известный архитектурный паттерн (MVC, Микросервисы, CQRS), назови его. Если решение может привести к антипаттерну (God Object, Монолитная база данных для микросервисов), мягко предупреди об этом и предложи альтернативу.
**СТРУКТУРА И ПРИМЕР JSON:**
Твой JSON должен иметь следующую структуру:
{
  "components": [
    { "id": "...", "name": "...", "tech": "...", "description": "..." }
  ],
  "data_flows": [
    { "from": "frontend", "to": "backend", "description": "Запросы на получение данных", "type": "REST" }
  ]
}

**Пример твоего идеального ответа:**
Пользователь: "Давай добавим бэкенд на Node.js для связи с фронтендом."
Твой ответ:
Отлично! Добавляем Back-end на Node.js. Он будет обрабатывать запросы от клиентского приложения.

<JSON>
{
  "components": [
    {
      "id": "frontend",
      "name": "Frontend",
      "tech": "React",
      "description": "Клиентское веб-приложение."
    },
    {
      "id": "backend",
      "name": "Back-end",
      "tech": "Node.js",
      "description": "Серверное приложение на Node.js."
    }
  ],
  "data_flows": [
    {
      "from": "frontend",
      "to": "backend",
      "description": "REST API"
    }
  ]
}
</JSON>

**ЭТАПЫ ПРОЕКТИРОВАНИЯ БУДУТ ПЕРЕДАНЫ ТЕБЕ В КОНТЕКСТЕ ДИАЛОГА.**
`;

// --- Клиент API ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY не найден в .env.local");
}
const genAI = new GoogleGenerativeAI(apiKey);

// Настройки безопасности
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// --- Компонент ---
export function ChatColumn({ task, setArchitecture }: ChatColumnProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // --- Эффекты ---

  // Эффект для инициализации или восстановления чата. Срабатывает только при смене ID задачи.
  useEffect(() => {
    if (isInitialized.current) return;

    const savedMessages = localStorage.getItem('gpt-arch-trainer-messages');
    if (savedMessages && savedMessages !== '[]') {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Ошибка парсинга сообщений из localStorage", e);
        startNewDialog();
      }
    } else {
      startNewDialog();
    }
    
    isInitialized.current = true;
  }, [task.id]);

  // Эффект для сохранения сообщений в localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gpt-arch-trainer-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Эффект для авто-скролла
  useEffect(() => {
    if (messagesContainerRef.current) {
        // Просто всегда прокручиваем контейнер в самый низ
        messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth' // Оставляем плавную прокрутку
        });
    }
}, [messages, isLoading]);

  // --- Вспомогательные функции ---

  // Парсер JSON из ответа
  function parseArchitecture(responseText: string): [string, any | null] {
    const jsonRegex = /<JSON>(.*?)<\/JSON>/s;
    const match = responseText.match(jsonRegex);
    if (match && match[1]) {
      const jsonString = match[1];
      const cleanText = responseText.replace(jsonRegex, '').trim();
      try {
        return [cleanText, JSON.parse(jsonString)];
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
      }
    }
    return [responseText, null];
  }

  // Общая функция для отправки запроса к API
const getGptResponse = async (history: Message[], isNewDialog = false) => {
  setIsLoading(true);
  try {
    // У Gemini нет разделения на system/user/assistant, он принимает "историю" и новый запрос.
    // Мы "склеиваем" наш системный промпт и контекст задачи в один большой стартовый блок.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });
    
    const chat = model.startChat({
      // Вся история передается сюда. Gemini сам разберется, кто есть кто.
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Понял. Я готов вести пользователя по сценарию." }] },
        ...history.slice(0, -1).map(msg => ({
          role: msg.author === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ],
    });

    // Отправляем только самое последнее сообщение пользователя
    const lastMessage = history[history.length - 1].text;
    const result = await chat.sendMessage(lastMessage);
    const gptResponseText = result.response.text();

    if (gptResponseText) {
      const [cleanText, newArchitecture] = parseArchitecture(gptResponseText);
      const gptMessage: Message = { author: 'gpt', text: cleanText };

      if (isNewDialog) {
        setMessages([gptMessage]);
      } else {
        setMessages((prev) => [...prev, gptMessage]);
      }

      if (newArchitecture) setArchitecture(newArchitecture);
    }
  } catch (error) {
    console.error('Ошибка при запросе к Google Gemini API:', error);
    setMessages((prev) => [...prev, { author: 'gpt', text: 'Извините, произошла ошибка с Gemini API.' }]);
  } finally {
    setIsLoading(false);
  }
};

  // Инициализация нового диалога
  const startNewDialog = () => {
    const firstUserMessage: Message = { author: 'user', text: `Привет! Начинаем проектирование задачи "${task.title}". Задай свой первый вопрос.` };
    setMessages([]); // Очищаем старые сообщения перед стартом
    getGptResponse([firstUserMessage], true);
  };

  // Отправка сообщения от пользователя
  const handleSend = () => {
    if (inputValue.trim() === '' || isLoading) return;
    const userMessage: Message = { author: 'user', text: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    getGptResponse(newMessages);
  };

  // --- Рендеринг JSX ---
return (
  // 1. Родительский блок колонки. h-full, чтобы занять всю высоту ячейки грида.
  //    relative, чтобы стать "полотном" для дочерних абсолютных элементов.
  <div className="flex flex-col h-full bg-slate-800 rounded-lg p-4 relative">
    
    {/* 2. Заголовок. flex-shrink-0 не дает ему сжиматься. */}
    <h2 className="text-xl font-bold mb-4 border-b border-slate-600 pb-2 flex-shrink-0">
      Диалог с тренером
    </h2>
    
    {/* 3. Контейнер для сообщений. Позиционируется абсолютно. */}
    {/* top-20 и bottom-20 - это отступы сверху и снизу от краев родителя.
        left-4 и right-4 - отступы по бокам, равные p-4 родителя. */}
    <div
      ref={messagesContainerRef}
      className="absolute top-20 bottom-20 left-4 right-4 overflow-y-auto pr-2"
    >
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${
              msg.author === 'user'
                ? 'bg-violet-600 self-end'
                : 'bg-slate-600 self-start'
            }`}
          >
            <p className="text-white">{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-lg max-w-[85%] bg-slate-600 self-start">
            <p className="text-white animate-pulse">Печатает...</p>
          </div>
        )}
      </div>
    </div>
    
    {/* 4. Форма ввода. Позиционируется абсолютно в самом низу. */}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
      className="absolute bottom-4 left-4 right-4"
    >
      <input
        type="text"
        placeholder="Ваш ответ тренеру..."
        className="w-full p-2 rounded bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isLoading}
      />
    </form>
  </div>
);
}