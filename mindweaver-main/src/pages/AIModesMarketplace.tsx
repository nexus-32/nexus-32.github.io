import React, { useState, useEffect } from 'react';
import { useAIModes } from '@/contexts/AIModesContext';
import { UserAIMode } from '@/types/aimodes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Heart, Star, Filter, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIModesMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const { 
    publicModes, 
    installedModes, 
    userModes,
    loading, 
    searchModes, 
    getPublicModes,
    installMode, 
    uninstallMode, 
    likeMode, 
    unlikeMode,
    downloadMode 
  } = useAIModes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredModes, setFilteredModes] = useState<UserAIMode[]>([]);
  const [activeTab, setActiveTab] = useState('marketplace');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'Development', name: 'Development' },
    { id: 'Creative', name: 'Creative' },
    { id: 'Business', name: 'Business' },
    { id: 'Education', name: 'Education' },
    { id: 'Personal', name: 'Personal' },
  ];

  useEffect(() => {
    const loadModes = async () => {
      let modes: UserAIMode[];
      
      if (searchQuery) {
        modes = await searchModes(searchQuery);
      } else if (selectedCategory === 'all') {
        modes = publicModes;
      } else {
        modes = await getPublicModes(selectedCategory);
      }
      
      setFilteredModes(modes);
    };

    loadModes();
  }, [searchQuery, selectedCategory, publicModes, searchModes, getPublicModes]);

  const handleInstall = async (modeId: string) => {
    try {
      await installMode(modeId);
      await downloadMode(modeId);
    } catch (error) {
      console.error('Error installing mode:', error);
    }
  };

  const handleUninstall = async (modeId: string) => {
    try {
      await uninstallMode(modeId);
    } catch (error) {
      console.error('Error uninstalling mode:', error);
    }
  };

  const handleLike = async (modeId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeMode(modeId);
      } else {
        await likeMode(modeId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const ModeCard: React.FC<{ mode: UserAIMode }> = ({ mode }) => (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{mode.name}</CardTitle>
            <CardDescription className="mt-2">{mode.description}</CardDescription>
          </div>
          <Badge variant={mode.isApproved ? 'default' : 'secondary'}>
            {mode.isApproved ? 'Approved' : 'Pending'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {mode.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="text-sm text-muted-foreground mb-4">
          <div className="flex justify-between items-center">
            <span>By {mode.author}</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{mode.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {mode.downloads}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {mode.likes}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-auto">
          <Button
            variant={mode.isInstalled ? "outline" : "default"}
            size="sm"
            onClick={() => mode.isInstalled ? handleUninstall(mode.id) : handleInstall(mode.id)}
            className="flex-1"
          >
            {mode.isInstalled ? 'Uninstall' : 'Install'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLike(mode.id, mode.isLiked)}
            className={mode.isLiked ? 'text-red-500 border-red-500' : ''}
          >
            <Heart className={`w-4 h-4 ${mode.isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Modes Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Discover, install, and share custom AI modes for MindWeaver
          </p>
        </div>
        
        <Button onClick={() => navigate('/modes/create')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Mode
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="installed">Installed ({installedModes.length})</TabsTrigger>
          <TabsTrigger value="my-modes">My Modes ({userModes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search AI modes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modes Grid */}
          {loading ? (
            <div className="text-center py-12">Loading AI modes...</div>
          ) : filteredModes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No AI modes found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModes.map((mode) => (
                <ModeCard key={mode.id} mode={mode} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          {installedModes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No installed modes yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('marketplace')}
              >
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {installedModes.map((mode) => (
                <ModeCard key={mode.id} mode={{ ...mode, isInstalled: true, isLiked: false }} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-modes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">My Created Modes</h2>
            <Button onClick={() => navigate('/modes/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Mode
            </Button>
          </div>
          
          {userModes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't created any modes yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/modes/create')}
              >
                Create Your First Mode
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userModes.map((mode) => (
                <Card key={mode.id} className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{mode.name}</CardTitle>
                        <CardDescription className="mt-2">{mode.description}</CardDescription>
                      </div>
                      <Badge variant={mode.isPublic ? 'default' : 'secondary'}>
                        {mode.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/modes/edit/${mode.id}`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModesMarketplace;
