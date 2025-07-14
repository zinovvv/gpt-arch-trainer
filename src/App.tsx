import { ArtifactColumn } from './components/ArtifactColumn';
import { ChatColumn } from './components/ChatColumn';
import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import type { Task } from './tasks';

function App() {
  // --- ЗАГРУЗКА СОСТОЯНИЯ ---
  const [selectedTask, setSelectedTask] = useState<Task | null>(() => {
    const savedTask = localStorage.getItem('gpt-arch-trainer-task');
    return savedTask ? JSON.parse(savedTask) : null;
  });

  const [architecture, setArchitecture] = useState<any>(() => {
    const savedArch = localStorage.getItem('gpt-arch-trainer-arch');
    return savedArch ? JSON.parse(savedArch) : null;
  });

  useEffect(() => {
    // Сохраняем, только если задача выбрана
    if (selectedTask) {
      localStorage.setItem('gpt-arch-trainer-task', JSON.stringify(selectedTask));
    }
    if (architecture) {
      localStorage.setItem('gpt-arch-trainer-arch', JSON.stringify(architecture));
    }
  }, [selectedTask, architecture]); // <-- Запускается при изменении задачи или архитектуры

// Функция для обработки выбора задачи
const handleTaskSelect = (task: Task) => {
  localStorage.removeItem('gpt-arch-trainer-messages');
  setSelectedTask(task);
  // Сбрасываем архитектуру при выборе новой задачи
  setArchitecture({ components: [], data_flows: [] });
};

if (!selectedTask) {
  return <WelcomeScreen onTaskSelect={handleTaskSelect} />;
}

return (
  <div className="bg-slate-900 text-white min-h-screen flex flex-col p-4 gap-4">
    <header className="bg-slate-800 rounded-lg p-4 border-b-2 border-violet-500 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Проектирование: {selectedTask.title}</h1>
      <button 
        onClick={() => setSelectedTask(null)}
        className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md transition-colors"
      >
        Выбрать другую задачу
      </button>
      <button
        onClick={() => {
          // Очищаем localStorage и перезагружаем страницу
          localStorage.removeItem('gpt-arch-trainer-task');
          localStorage.removeItem('gpt-arch-trainer-arch');
          localStorage.removeItem('gpt-arch-trainer-messages');
          window.location.reload();
        }}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors ml-4"
      >
        Начать заново
      </button>
    </header>
    
    <main className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
      <ChatColumn
        // Передаем стартовый промпт выбранной задачи
        startPrompt={selectedTask.startPrompt} 
        setArchitecture={setArchitecture}
        // Добавляем key, чтобы компонент чата "пересоздавался" при смене задачи
        key={selectedTask.id}
      />
      {architecture && <ArtifactColumn architecture={architecture} />}
    </main>
  </div>
);
}

export default App