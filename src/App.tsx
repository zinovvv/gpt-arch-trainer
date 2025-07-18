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
  // 1. Делаем основной контейнер "полотном" для позиционирования
  <div className="bg-slate-900 text-white h-screen w-screen p-4 flex flex-col gap-4 relative">
    
    {/* 2. Шапка остается простой */}
    <header className="bg-slate-800 rounded-lg p-4 border-b-2 border-violet-500 flex justify-between items-center z-10">
      <h1 className="text-2xl font-bold">Проектирование: {selectedTask.title}</h1>
      <div className="flex items-center">
        <button 
          onClick={() => setSelectedTask(null)}
          className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md transition-colors"
        >
          Выбрать другую задачу
        </button>
        <button
          onClick={() => {
            localStorage.clear(); // Очищаем всё сразу
            window.location.reload();
          }}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors ml-4"
        >
          Начать заново
        </button>
      </div>
    </header>
    
    {/* 3. Основная часть с колонками.*/}
    <main className="grid grid-cols-2 gap-4 flex-1">
      <ChatColumn
        task={selectedTask} 
        setArchitecture={setArchitecture}
        key={selectedTask.id}
      />
      {architecture && <ArtifactColumn architecture={architecture} />}
    </main>
  </div>
);
}

export default App