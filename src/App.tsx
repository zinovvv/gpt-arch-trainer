import { ArtifactColumn } from './components/ArtifactColumn';
import { ChatColumn } from './components/ChatColumn';
import { useState } from 'react';

function App() {
  const [architecture, setArchitecture] = useState({
    components: [],
    data_flows: [],
  });
  return (
    // Основной фон всего приложения
    <div className="bg-slate-900 text-white min-h-screen flex flex-col p-4 gap-4">
      {/* Шапка приложения */}
      <header className="bg-slate-800 rounded-lg p-4 border-b-2 border-violet-500">
        <h1 className="text-2xl font-bold text-center">GPT-тренер по архитектуре системы</h1>
      </header>
      
      {/* Основная часть с двумя колонками */}
      {/* grid grid-cols-2 - делит область на 2 равные колонки */}
      {/* gap-4 - задает отступ между колонками */}
      {/* flex-1 - заставляет этот блок занять все оставшееся место по высоте */}
      <main className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        <ChatColumn setArchitecture={setArchitecture} />
        <ArtifactColumn architecture={architecture} />
      </main>
    </div>
  )
}

export default App