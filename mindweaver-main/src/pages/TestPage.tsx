import React from 'react';
import PersonalityManager from '@/components/PersonalityManager';

const TestPage = () => {
  const defaultPersonalities = [
    {
      id: 'coach',
      name: 'Тренер',
      description: 'Помогает достичь целей и развиваться',
      icon: 'Brain',
      color: 'text-orange-500',
      systemPrompt: 'Ты - профессиональный тренер по личностному росту.',
      temperature: 0.7,
      maxTokens: 1000000,
      capabilities: ['Мотивация', 'Планирование'],
      isActive: true,
      isCustom: false
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Тест Personality Manager</h1>
      <PersonalityManager 
        personalities={defaultPersonalities}
        onPersonalitiesChange={() => {}}
        selectedPersonality="coach"
        onPersonalitySelect={() => {}}
      />
    </div>
  );
};

export default TestPage;
