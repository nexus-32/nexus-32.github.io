import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Cpu } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-subtle">
        <img 
          src={heroBg} 
          alt="" 
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-20 animate-glow-pulse" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(240_8%_15%/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(240_8%_15%/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Content */}
      <div className="relative z-10 container px-4 mx-auto text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Your AI Chief of Staff</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
          Meet MindWeaver
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          A deeply personalized AI that moves beyond chat to become 
          <span className="text-foreground font-semibold"> your integrated partner</span> in every digital workflow
        </p>

        <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
          It doesn't just answer questions—it anticipates your needs, connects your tools, 
          and automates your busywork from a seamless overlay on any screen.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg" className="group" onClick={() => navigate('/auth')}>
            Начать использовать
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="glass" size="lg" onClick={() => navigate('/auth')}>
            Узнать больше
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/modes')} className="group">
            <Cpu className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            AI Modes
          </Button>
        </div>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
    </section>
  );
};

export default Hero;
