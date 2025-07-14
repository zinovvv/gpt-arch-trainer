import { ArtifactColumn } from './components/ArtifactColumn';
import { ChatColumn } from './components/ChatColumn';
import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import type { Task } from './tasks';

function App() {
  const [architecture, setArchitecture] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

// Функция для обработки выбора задачи
const handleTaskSelect = (task: Task) => {
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