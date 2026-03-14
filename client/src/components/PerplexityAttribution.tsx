import { SiGithub } from "react-icons/si";
import { Linkedin } from "lucide-react";

export function PerplexityAttribution() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Branding */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              &copy; {currentYear} Created by{" "}
              <span className="font-semibold text-foreground">Bhagesh</span>
            </span>
            <span className="hidden sm:inline text-border">|</span>
          </div>

          {/* Right: Social links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/bhagesh-h"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
              data-testid="link-github"
            >
              <SiGithub className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://www.linkedin.com/in/bhagesh-hunakunti/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-[#0A66C2] transition-colors"
              aria-label="LinkedIn"
              data-testid="link-linkedin"
            >
              <Linkedin className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
