import { ArchitectureDiagram } from './ArchitectureDiagram';
import { useState } from 'react';

type ArtifactColumnProps = {
  architecture: any;
};

type Tab = 'schema' | 'components' | 'tech';

export function ArtifactColumn({ architecture }: ArtifactColumnProps) {
  const [activeTab, setActiveTab] = useState<Tab>('schema');
  return (
  <div className="flex flex-col h-full bg-slate-700 rounded-lg p-4">
    <div className="flex items-center justify-between border-b border-slate-500 pb-2 mb-4">
      <h2 className="text-xl font-bold">Архитектурный артефакт</h2>
      {/* Переключатель вкладок */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-md">
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            activeTab === 'schema' ? 'bg-violet-600' : 'hover:bg-slate-700'
          }`}
        >
          Схема
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            activeTab === 'components' ? 'bg-violet-600' : 'hover:bg-slate-700'
          }`}
        >
          Компоненты
        </button>
        <button
          onClick={() => setActiveTab('tech')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            activeTab === 'tech' ? 'bg-violet-600' : 'hover:bg-slate-700'
          }`}
        >
          Технологии
        </button>
      </div>
    </div>

    {/* Контент вкладок (условный рендеринг) */}
    <div className="flex-1 bg-slate-800 rounded-md p-4 overflow-auto">
      {activeTab === 'schema' && (
        <ArchitectureDiagram architecture={architecture} />
      )}
      
      {activeTab === 'components' && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Компоненты системы</h3>
          {architecture && architecture.components && architecture.components.map((comp: any) => (
            <div key={comp.id} className="mb-4 p-3 bg-slate-700 rounded-md">
              <p className="font-bold text-violet-400">{comp.name}</p>
              <p className="text-sm text-slate-300"><b>Технология:</b> {comp.tech}</p>
              <p className="text-sm text-slate-300 mt-1">{comp.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tech' && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Используемые технологии</h3>
          <ul className="list-disc list-inside">
            {/* Собираем уникальные технологии из всех компонентов */}
            {architecture && architecture.components && [...new Set(architecture.components.map((c: any) => c.tech))].filter(tech => tech).map((tech: any) => (
              <li key={tech} className="text-slate-300">{tech}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);
}