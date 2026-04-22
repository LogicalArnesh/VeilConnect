
"use client";

import React, { useState } from 'react';
import { generateAdminContentSuggestions } from '@/ai/flows/generate-admin-content-suggestions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Plus, Copy, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export function AISuggestions() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'task' | 'meeting'>('task');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const result = await generateAdminContentSuggestions({
        userPrompt: prompt,
        contentType: type
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Generation Error", description: "Could not reach the intelligence unit." });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          Veil AI Assistant
        </CardTitle>
        <CardDescription>
          Generate professional intelligence briefings and task templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as 'task' | 'meeting')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task">Tasks</TabsTrigger>
            <TabsTrigger value="meeting">Meetings</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="space-y-2">
          <Textarea 
            placeholder={type === 'task' ? "e.g., Audit firewall logs for anomalous patterns" : "e.g., Weekly security sync for the field team"} 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-background border-border min-h-[100px]"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !prompt}
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Decrypting Intent..." : "Generate Insights"}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated Content</h4>
            {suggestions.map((s, i) => (
              <div key={i} className="group relative bg-background border border-border p-3 rounded-lg flex items-start justify-between gap-4 hover:border-primary/50 transition-colors">
                <p className="text-sm leading-relaxed">{s}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7" 
                    onClick={() => copyToClipboard(s, i)}
                  >
                    {copiedIndex === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
