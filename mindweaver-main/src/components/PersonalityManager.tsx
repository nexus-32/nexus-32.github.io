import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings, Brain, Sparkles, Zap, Heart, Code, Briefcase, GraduationCap } from 'lucide-react';

interface CustomPersonality {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  capabilities: string[];
  isActive: boolean;
  isCustom: boolean;
}

interface PersonalityManagerProps {
  personalities: CustomPersonality[];
  onPersonalitiesChange: (personalities: CustomPersonality[]) => void;
  selectedPersonality: string;
  onPersonalitySelect: (id: string) => void;
}

const PersonalityManager: React.FC<PersonalityManagerProps> = ({
  personalities,
  onPersonalitiesChange,
  selectedPersonality,
  onPersonalitySelect
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState<CustomPersonality | null>(null);
  const [formData, setFormData] = useState<Partial<CustomPersonality>>({
    name: '',
    description: '',
    icon: 'Brain',
    color: 'text-blue-500',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000000,
    capabilities: [],
    isActive: true,
    isCustom: true
  });
  const [newCapability, setNewCapability] = useState('');
  const { toast } = useToast();

  const defaultPersonalities: CustomPersonality[] = [
    {
      id: 'coach',
      name: 'Тренер',
      description: 'Помогает достичь целей и развиваться',
      icon: 'Brain',
      color: 'text-orange-500',
      systemPrompt: 'Ты - профессиональный тренер по личностному росту. Помоги пользователю достичь целей, мотивируй и давай практические советы.',
      temperature: 0.7,
      maxTokens: 1000000,
      capabilities: ['Мотивация', 'Планирование', 'Анализ целей'],
      isActive: true,
      isCustom: false
    },
    {
      id: 'friend',
      name: 'Друг',
      description: 'Поддерживающий и понимающий собеседник',
      icon: 'Heart',
      color: 'text-pink-500',
      systemPrompt: 'Ты - близкий друг. Будь поддерживающим, эмпатичным, но честным. Слушай внимательно и давай искренние советы.',
      temperature: 0.8,
      maxTokens: 800000,
      capabilities: ['Поддержка', 'Эмпатия', 'Советы'],
      isActive: true,
      isCustom: false
    },
    {
      id: 'analyst',
      name: 'Аналитик',
      description: 'Анализирует данные и создает отчеты',
      icon: 'Brain',
      color: 'text-blue-500',
      systemPrompt: 'Ты - аналитик данных. Анализируй информацию, создавай графики, таблицы и детальные отчеты. Будь точным и структурированным.',
      temperature: 0.3,
      maxTokens: 2000000,
      capabilities: ['Анализ данных', 'Графики', 'Отчеты'],
      isActive: true,
      isCustom: false
    },
    {
      id: 'creative',
      name: 'Креатив',
      description: 'Генерирует творческие идеи',
      icon: 'Sparkles',
      color: 'text-purple-500',
      systemPrompt: 'Ты - творческий ассистент. Генерируй оригинальные идеи, помогай с творческими проектами и вдохновляй.',
      temperature: 0.9,
      maxTokens: 1500000,
      capabilities: ['Креативность', 'Идеи', 'Вдохновение'],
      isActive: true,
      isCustom: false
    }
  ];

  const iconOptions = [
    { value: 'Brain', label: 'Мозг', icon: Brain },
    { value: 'Heart', label: 'Сердце', icon: Heart },
    { value: 'Sparkles', label: 'Искры', icon: Sparkles },
    { value: 'Zap', label: 'Молния', icon: Zap },
    { value: 'Code', label: 'Код', icon: Code },
    { value: 'Briefcase', label: 'Портфель', icon: Briefcase },
    { value: 'GraduationCap', label: 'Диплом', icon: GraduationCap },
  ];

  const colorOptions = [
    { value: 'text-blue-500', label: 'Синий' },
    { value: 'text-green-500', label: 'Зеленый' },
    { value: 'text-red-500', label: 'Красный' },
    { value: 'text-purple-500', label: 'Фиолетовый' },
    { value: 'text-orange-500', label: 'Оранжевый' },
    { value: 'text-pink-500', label: 'Розовый' },
    { value: 'text-yellow-500', label: 'Желтый' },
    { value: 'text-gray-500', label: 'Серый' },
  ];

  // Save to localStorage when personalities change
  React.useEffect(() => {
    try {
      localStorage.setItem('customPersonalities', JSON.stringify(personalities.filter(p => p.isCustom)));
    } catch (error) {
      console.error('Error saving custom personalities:', error);
    }
  }, [personalities]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Brain',
      color: 'text-blue-500',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 1000000,
      capabilities: [],
      isActive: true,
      isCustom: true
    });
    setNewCapability('');
    setEditingPersonality(null);
  };

  const handleCreatePersonality = () => {
    if (!formData.name || !formData.systemPrompt) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и системный промпт',
        variant: 'destructive'
      });
      return;
    }

    const newPersonality: CustomPersonality = {
      id: `custom_${Date.now()}`,
      name: formData.name,
      description: formData.description || '',
      icon: formData.icon || 'Brain',
      color: formData.color || 'text-blue-500',
      systemPrompt: formData.systemPrompt,
      temperature: formData.temperature || 0.7,
      maxTokens: formData.maxTokens || 1000000,
      capabilities: formData.capabilities || [],
      isActive: formData.isActive !== false,
      isCustom: true
    };

    const updatedPersonalities = [...personalities, newPersonality];
    onPersonalitiesChange(updatedPersonalities);
    
    toast({
      title: 'Режим создан',
      description: `Новый режим "${newPersonality.name}" успешно создан`
    });

    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleUpdatePersonality = () => {
    if (!editingPersonality || !formData.name || !formData.systemPrompt) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и системный промпт',
        variant: 'destructive'
      });
      return;
    }

    const updatedPersonalities = personalities.map(p => 
      p.id === editingPersonality.id 
        ? { ...p, ...formData }
        : p
    );

    onPersonalitiesChange(updatedPersonalities);
    
    toast({
      title: 'Режим обновлен',
      description: `Режим "${formData.name}" успешно обновлен`
    });

    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleDeletePersonality = (id: string) => {
    const personality = personalities.find(p => p.id === id);
    if (!personality) return;

    if (!personality.isCustom) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить встроенный режим',
        variant: 'destructive'
      });
      return;
    }

    const updatedPersonalities = personalities.filter(p => p.id !== id);
    onPersonalitiesChange(updatedPersonalities);
    
    toast({
      title: 'Режим удален',
      description: `Режим "${personality.name}" удален`
    });

    if (selectedPersonality === id) {
      onPersonalitySelect('friend');
    }
  };

  const startEdit = (personality: CustomPersonality) => {
    setEditingPersonality(personality);
    setFormData(personality);
    setIsCreateDialogOpen(true);
  };

  const addCapability = () => {
    if (newCapability.trim()) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...(prev.capabilities || []), newCapability.trim()]
      }));
      setNewCapability('');
    }
  };

  const removeCapability = (index: number) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities?.filter((_, i) => i !== index) || []
    }));
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(opt => opt.value === iconName);
    return option ? option.icon : Brain;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Режимы ИИ</h3>
          <p className="text-sm text-muted-foreground">
            Управление режимами искусственного интеллекта
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Создать режим
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPersonality ? 'Редактировать режим' : 'Создать новый режим'}
              </DialogTitle>
              <DialogDescription>
                {editingPersonality 
                  ? 'Измените параметры существующего режима ИИ'
                  : 'Создайте собственный режим ИИ с уникальными характеристиками'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название режима</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Например: Программист"
                  />
                </div>
                
                <div>
                  <Label htmlFor="icon">Иконка</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите иконку" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(option => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание режима"
                />
              </div>

              <div>
                <Label htmlFor="color">Цвет</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.value}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="systemPrompt">Системный промпт</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Опишите, как должен вести себя ИИ в этом режиме..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Креативность: {formData.temperature}</Label>
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature || 0.7}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Точный</span>
                    <span>Креативный</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxTokens">Макс. токенов: {formData.maxTokens}</Label>
                  <input
                    type="range"
                    id="maxTokens"
                    min="500"
                    max="2000000"
                    step="1000"
                    value={formData.maxTokens || 2000}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>500</span>
                    <span>2,000,000</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Возможности</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    placeholder="Добавить возможность"
                    onKeyPress={(e) => e.key === 'Enter' && addCapability()}
                  />
                  <Button type="button" onClick={addCapability}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.capabilities?.map((capability, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {capability}
                      <button
                        onClick={() => removeCapability(index)}
                        className="ml-2 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive !== false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Активен</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={editingPersonality ? handleUpdatePersonality : handleCreatePersonality}>
                  {editingPersonality ? 'Обновить' : 'Создать'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {personalities.map((personality) => {
          const IconComponent = getIconComponent(personality.icon);
          return (
            <Card key={personality.id} className={`p-4 ${selectedPersonality === personality.id ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${personality.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{personality.name}</h4>
                      {personality.isCustom && (
                        <Badge variant="secondary" className="text-xs">
                          Кастомный
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {personality.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {personality.capabilities.map((capability, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Креативность: {personality.temperature}</span>
                      <span>Токены: {personality.maxTokens}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedPersonality === personality.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPersonalitySelect(personality.id)}
                  >
                    Выбрать
                  </Button>
                  
                  {personality.isCustom && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(personality)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePersonality(personality.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalityManager;
