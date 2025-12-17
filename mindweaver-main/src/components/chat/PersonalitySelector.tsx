import { Button } from '@/components/ui/button';
import { Brain, Heart, LineChart, Palette } from 'lucide-react';

type Personality = 'coach' | 'friend' | 'analyst' | 'creative';

interface PersonalitySelectorProps {
  value: Personality;
  onChange: (personality: Personality) => void;
}

const personalities = [
  { id: 'coach', label: 'Тренер', icon: Brain, color: 'text-orange-500' },
  { id: 'friend', label: 'Друг', icon: Heart, color: 'text-pink-500' },
  { id: 'analyst', label: 'Аналитик', icon: LineChart, color: 'text-blue-500' },
  { id: 'creative', label: 'Креатив', icon: Palette, color: 'text-purple-500' },
];

const PersonalitySelector = ({ value, onChange }: PersonalitySelectorProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {personalities.map(({ id, label, icon: Icon, color }) => (
        <Button
          key={id}
          variant={value === id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(id as Personality)}
          className="gap-2"
        >
          <Icon className={`w-4 h-4 ${value === id ? 'text-white' : color}`} />
          {label}
        </Button>
      ))}
    </div>
  );
};

export default PersonalitySelector;
