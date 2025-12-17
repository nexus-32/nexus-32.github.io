const Footer = () => {
  return (
    <footer className="py-8 border-t border-border/50">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MindWeaver
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your AI Chief of Staff
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© 2025 MindWeaver. All rights reserved.</p>
            <p className="mt-1">Building the future of AI assistance</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
