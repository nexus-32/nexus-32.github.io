import { Brain, Layers, Zap, Palette, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Digital Twin Context",
    description: "A secure, private model of you—your goals, projects, and preferences. Never re-explain context again.",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    icon: Layers,
    title: "Integrated Co-Pilot",
    description: "A persistent overlay that works across all applications. Summon intelligent assistance anywhere, anytime.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Proactive Automations",
    description: "Context-aware suggestions and one-click workflows that eliminate busywork and keep you focused.",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    icon: Palette,
    title: "Multi-Modal Creator",
    description: "Unified interface for text, image, code, and video generation—all seamlessly connected.",
    gradient: "from-teal-500 to-green-500",
  },
  {
    icon: Package,
    title: "Skill Store",
    description: "One-click integrations with your favorite tools. Give MindWeaver new abilities instantly.",
    gradient: "from-purple-500 to-pink-500",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Beyond a Chat Window
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Five breakthrough capabilities that transform how you work
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group p-6 bg-card/40 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-500 hover:shadow-glow animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-500`}>
                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(263_70%_60%/0.1),transparent_50%)]" />
    </section>
  );
};

export default Features;
