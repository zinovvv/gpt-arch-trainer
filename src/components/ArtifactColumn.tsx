import { ArchitectureDiagram } from './ArchitectureDiagram';

type ArtifactColumnProps = {
  architecture: any;
};

export function ArtifactColumn({ architecture }: ArtifactColumnProps) {
  return (
    // bg-slate-700 - фон чуть светлее, чем у чата
    <div className="flex flex-col h-full bg-slate-700 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 border-b border-slate-500 pb-2">
        Архитектурный артефакт
      </h2>
      {/* Здесь позже будет визуализация архитектуры */}
      <div className="flex-1 bg-slate-800 rounded-md p-4">
        <ArchitectureDiagram architecture={architecture} />
      </div>
    </div>
  );
}