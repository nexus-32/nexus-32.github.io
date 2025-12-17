import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Command } from "lucide-react";
import copilotPreview from "@/assets/copilot-preview.png";

const CoPilotPreview = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4 mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI, Everywhere
            </h2>
            <p className="text-xl text-muted-foreground">
              A minimalist overlay that works seamlessly across all your applications
            </p>
          </div>

          <div className="relative animate-fade-in">
            {/* Main preview card */}
            <Card className="bg-card/60 backdrop-blur-2xl border-primary/20 shadow-elevated overflow-hidden">
              <div className="p-8">
                <div className="aspect-video bg-secondary/50 rounded-lg overflow-hidden relative">
                  <img 
                    src={copilotPreview} 
                    alt="Co-Pilot Interface Preview" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Floating interface demo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                    <Card className="bg-card/90 backdrop-blur-xl border-primary/30 shadow-glow animate-fade-in-up">
                      <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-2">
                              "Rephrase this email to be more concise"
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="hero">
                                Apply
                              </Button>
                              <Button size="sm" variant="glass">
                                Try Another
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
                          <Command className="w-3 h-3" />
                          <span>Press ⌘K anywhere to summon</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary mb-1">⌘K</div>
                    <p className="text-sm text-muted-foreground">Quick summon</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary mb-1">Any App</div>
                    <p className="text-sm text-muted-foreground">Works everywhere</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-primary mb-1">Context Aware</div>
                    <p className="text-sm text-muted-foreground">Knows what you're doing</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoPilotPreview;
