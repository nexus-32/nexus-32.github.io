import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAIModes } from '@/contexts/AIModesContext';
import { AIMode } from '@/types/aimodes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Eye, Upload, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

const CreateAIMode: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createMode, updateMode, userModes, publishMode } = useAIModes();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'Development',
    tags: [] as string[],
    isPublic: false,
    version: '1.0.0',
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);

  const categories = [
    { id: 'Development', name: 'Development' },
    { id: 'Creative', name: 'Creative' },
    { id: 'Business', name: 'Business' },
    { id: 'Education', name: 'Education' },
    { id: 'Personal', name: 'Personal' },
  ];

  const promptTemplates = [
    {
      name: 'Code Assistant',
      template: 'You are an expert software developer specializing in {specialty}. Help the user with: 1) Code review and optimization, 2) Best practices, 3) Debugging assistance, 4) Architecture suggestions. Provide clear, actionable advice with code examples when appropriate.',
      category: 'Development',
      tags: ['coding', 'programming', 'development'],
    },
    {
      name: 'Writing Coach',
      template: 'You are a professional writing coach. Assist the user with: 1) Improving clarity and flow, 2) Grammar and style corrections, 3) Content structure, 4) Tone adjustments. Be encouraging and provide specific suggestions for improvement.',
      category: 'Creative',
      tags: ['writing', 'editing', 'content'],
    },
    {
      name: 'Business Analyst',
      template: 'You are a seasoned business analyst. Help the user with: 1) Market analysis, 2) Strategy development, 3) Process optimization, 4) Decision making support. Provide data-driven insights and practical recommendations.',
      category: 'Business',
      tags: ['business', 'analysis', 'strategy'],
    },
  ];

  useEffect(() => {
    if (isEditing && id) {
      const mode = userModes.find(m => m.id === id);
      if (mode) {
        setFormData({
          name: mode.name,
          description: mode.description,
          prompt: mode.prompt,
          category: mode.category,
          tags: mode.tags,
          isPublic: mode.isPublic,
          version: mode.version,
        });
      }
    }
  }, [isEditing, id, userModes]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUseTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      prompt: template.template,
      category: template.category,
      tags: template.tags,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.prompt.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const modeData = {
        ...formData,
        author: 'Current User', // In real app, get from auth context
        authorId: 'user1', // In real app, get from auth context
      };

      if (isEditing && id) {
        await updateMode(id, modeData);
      } else {
        await createMode(modeData);
      }

      navigate('/modes');
    } catch (error) {
      console.error('Error saving mode:', error);
      alert('Error saving mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;

    setPublishing(true);
    try {
      const result = await publishMode(id);
      setModerationResult(result);
      
      if (result.isApproved) {
        setTimeout(() => {
          navigate('/modes');
        }, 2000);
      }
    } catch (error) {
      console.error('Error publishing mode:', error);
      alert('Error publishing mode. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/modes')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modes
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit AI Mode' : 'Create New AI Mode'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Design a custom AI assistant mode for specific tasks
          </p>
        </div>
      </div>

      <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(value) => setPreviewMode(value === 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit Mode</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Quick Start Templates
              </CardTitle>
              <CardDescription>
                Use these templates as a starting point for your AI mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promptTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {template.category}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide essential details about your AI mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Mode Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Code Review Assistant"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this AI mode does and when to use it"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
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

                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>AI Prompt</CardTitle>
              <CardDescription>
                Define how the AI should behave and respond. Be specific about the role, tasks, and response style.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder="You are an expert AI assistant specializing in..."
                rows={12}
                className="font-mono text-sm"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {formData.prompt.length} characters (recommended: 100-2000)
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                />
                <span className="text-sm">Make public (requires approval)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
              {isEditing && !formData.isPublic && (
                <Button 
                  onClick={handlePublish} 
                  disabled={publishing}
                  variant="default"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {publishing ? 'Publishing...' : 'Publish to Marketplace'}
                </Button>
              )}
            </div>
          </div>

          {/* Moderation Result */}
          {moderationResult && (
            <Alert className={moderationResult.isApproved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {moderationResult.isApproved ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="font-medium">
                  {moderationResult.isApproved ? 'Approved for Publication!' : 'Publication Not Approved'}
                </div>
                <div className="text-sm mt-1">
                  {moderationResult.reason}
                </div>
                {!moderationResult.isApproved && moderationResult.issues.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium">Issues to fix:</div>
                    <ul className="list-disc list-inside text-sm">
                      {moderationResult.issues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{formData.name || 'Untitled Mode'}</CardTitle>
              <CardDescription>{formData.description || 'No description provided'}</CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{formData.category}</Badge>
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">AI Prompt Preview:</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                    {formData.prompt || 'No prompt provided'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Version:</span> {formData.version}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {formData.isPublic ? 'Public' : 'Private'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateAIMode;
