import React, { useState, useEffect } from 'react';
import { useAIModes } from '@/contexts/AIModesContext';
import { AIMode } from '@/types/aimodes';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Cpu, Zap, Star } from 'lucide-react';

interface AIModeSelectorProps {
  onModeSelect: (mode: AIMode | null) => void;
  currentMode?: AIMode | null;
}

const AIModeSelector: React.FC<AIModeSelectorProps> = ({ onModeSelect, currentMode }) => {
  const { installedModes, userModes } = useAIModes();
  const [selectedModeId, setSelectedModeId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const allAvailableModes = [...installedModes, ...userModes];

  useEffect(() => {
    if (currentMode) {
      setSelectedModeId(currentMode.id);
    }
  }, [currentMode]);

  const handleModeChange = (modeId: string) => {
    setSelectedModeId(modeId);
    const mode = allAvailableModes.find(m => m.id === modeId);
    onModeSelect(mode || null);
  };

  const getModeIcon = (mode: AIMode) => {
    switch (mode.category) {
      case 'Development':
        return <Cpu className="w-4 h-4" />;
      case 'Creative':
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  if (allAvailableModes.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            AI Modes
          </CardTitle>
          <CardDescription>
            No AI modes installed. Browse the marketplace to enhance your chat experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.open('/modes', '_blank')} variant="outline">
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-4 space-y-4">
      {/* Mode Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">AI Mode</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Select value={selectedModeId} onValueChange={handleModeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI mode..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Default Mode</SelectItem>
              {allAvailableModes.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  <div className="flex items-center gap-2">
                    {getModeIcon(mode)}
                    <span>{mode.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {mode.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentMode && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                {getModeIcon(currentMode)}
                <div className="flex-1">
                  <div className="font-medium">{currentMode.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {currentMode.description}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {currentMode.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Mode Settings</CardTitle>
            <CardDescription>
              Manage your AI modes and install new ones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Installed Modes ({installedModes.length})</h4>
                <div className="space-y-2">
                  {installedModes.slice(0, 3).map((mode) => (
                    <div key={mode.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      {getModeIcon(mode)}
                      <span className="text-sm">{mode.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Your Creations ({userModes.length})</h4>
                <div className="space-y-2">
                  {userModes.slice(0, 3).map((mode) => (
                    <div key={mode.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      {getModeIcon(mode)}
                      <span className="text-sm">{mode.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => window.open('/modes', '_blank')} variant="outline" size="sm">
                Browse Marketplace
              </Button>
              <Button onClick={() => window.open('/modes/create', '_blank')} variant="outline" size="sm">
                Create New Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIModeSelector;
