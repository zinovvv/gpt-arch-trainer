import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

// Задаем глобальные настройки для Mermaid
mermaid.initialize({
  startOnLoad: false, // Мы будем рендерить диаграммы вручную
  theme: 'dark', // Используем темную тему
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
  },
});

type ArchitectureDiagramProps = {
  architecture: {
    components: Array<{ id: string; name: string; tech?: string; description?: string }>;
    data_flows: Array<{ 
      from: string; 
      to: string; 
      description?: string; 
      type?: string; // <-- ДОБАВИЛИ ЭТУ СТРОКУ
    }>;
  };
};

export function ArchitectureDiagram({ architecture }: ArchitectureDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Функция для преобразования JSON в Mermaid-синтаксис
  const generateMermaidSyntax = () => {
    if (!architecture || !architecture.components || !architecture.data_flows) {
    return 'graph TD;\n  error["Нет данных для отображения"];';
  }
    let syntax = 'graph TD;\n'; // TD = Top-Down (сверху вниз)

    // Добавляем компоненты
    architecture.components.forEach(comp => {
      // Пример: frontend["Frontend (React)"]
      syntax += `  ${comp.id}(${JSON.stringify(comp.name)});\n`;
    });

    // Добавляем потоки данных
    architecture.data_flows.forEach(flow => {
  // Рисуем связь, только если оба id существуют и не пустые
  if (flow.from && flow.to) { 
    // Приоритет отдаем полю type, если его нет - используем description
    const labelText = flow.type || flow.description || ''; 
    const label = labelText ? ` -- "${labelText}" --> ` : ' --> ';
    syntax += `  ${flow.from}${label}${flow.to};\n`;
  }
});

    return syntax;
  };

  useEffect(() => {
    if (containerRef.current) {
      const mermaidSyntax = generateMermaidSyntax();
      
      // Генерируем уникальный ID для SVG, чтобы избежать конфликтов
      const svgId = 'mermaid-svg-' + Date.now();
      
      // Рендерим диаграмму и вставляем ее как SVG
      mermaid.render(svgId, mermaidSyntax).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch(e => console.error(e));
    }
  }, [architecture]); // <-- Перерисовываем диаграмму при каждом изменении архитектуры

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex justify-center items-start"
    />
  );
}