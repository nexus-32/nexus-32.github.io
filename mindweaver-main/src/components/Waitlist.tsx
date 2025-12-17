import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate submission
    setSubmitted(true);
    toast({
      title: "You're on the list!",
      description: "We'll notify you when MindWeaver launches.",
    });
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      
      <div className="container px-4 mx-auto relative z-10">
        <Card className="max-w-2xl mx-auto bg-card/60 backdrop-blur-2xl border-primary/20 shadow-elevated overflow-hidden">
          <div className="p-8 md:p-12">
            {!submitted ? (
              <div className="text-center animate-fade-in-up">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Be Among the First
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Join the waitlist for early access to MindWeaver and shape the future of AI assistance.
                </p>
                
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-secondary/50 border-primary/20 focus:border-primary/40"
                    required
                  />
                  <Button type="submit" variant="hero" className="group">
                    Join Waitlist
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
                
                <p className="text-xs text-muted-foreground mt-4">
                  No spam. Updates only when we have something meaningful to share.
                </p>
              </div>
            ) : (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">You're In!</h3>
                <p className="text-muted-foreground">
                  We'll keep you updated on MindWeaver's progress. Check your email for confirmation.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Waitlist;
