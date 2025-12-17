import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUserSettings } from "@/hooks/useUserSettings";

function getAllLanguages(): string[] {
  const supportedValuesOf = (Intl as any).supportedValuesOf as ((key: string) => string[]) | undefined;
  if (supportedValuesOf) {
    try {
      return supportedValuesOf("language");
    } catch {
      return [];
    }
  }
  return [];
}

function getDisplayName(uiLanguage: string, language: string) {
  try {
    const dn = new Intl.DisplayNames([uiLanguage], { type: "language" });
    return dn.of(language) || language;
  } catch {
    return language;
  }
}

export function LanguageSelector({ className }: { className?: string }) {
  const { settings, updateSettings } = useUserSettings();
  const [open, setOpen] = React.useState(false);

  const languages = React.useMemo(() => {
    const all = getAllLanguages();
    if (all.length > 0) return all;
    return ["en", "ru", "es", "fr", "de", "it", "pt", "zh", "ja", "ko", "ar", "hi"];
  }, []);

  const value = settings.language;
  const uiLang = settings.language || "en";

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = value;
  }, [value]);

  const label = React.useMemo(() => {
    const name = getDisplayName(uiLang, value);
    return `${name} (${value})`;
  }, [uiLang, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[240px] justify-between", className)}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Language / Язык" />
          <CommandList>
            <CommandEmpty>Not found</CommandEmpty>
            <CommandGroup>
              {languages.map((lang) => {
                const name = getDisplayName(uiLang, lang);
                return (
                  <CommandItem
                    key={lang}
                    value={`${lang} ${name}`}
                    onSelect={() => {
                      updateSettings({ language: lang });
                      try {
                        localStorage.setItem("mw_language", lang);
                      } catch {}
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === lang ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{lang}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
