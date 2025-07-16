import { tasks, type Task } from '../tasks';

type WelcomeScreenProps = {
  onTaskSelect: (task: Task) => void;
};

export function WelcomeScreen({ onTaskSelect }: WelcomeScreenProps) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">GPT-тренер по архитектуре</h1>
      <p className="text-slate-400 mb-12">Выберите задачу, чтобы начать проектирование</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {tasks.map((task) => (
  <div
    key={task.id}
    // Добавляем условный стиль: если это пустой проект, делаем рамку другой
    className={`bg-slate-800 rounded-lg p-6 cursor-pointer hover:bg-slate-700 hover:ring-2 ${
      task.id === 'blank' 
        ? 'hover:ring-slate-500 border-2 border-dashed border-slate-700' 
        : 'hover:ring-violet-500'
    } transition-all`}
    onClick={() => onTaskSelect(task)}
  >
    <h3 className="text-xl font-bold mb-2">{task.title}</h3>
    <p className="text-slate-400">{task.description}</p>
  </div>
))}
      </div>
    </div>
  );
}