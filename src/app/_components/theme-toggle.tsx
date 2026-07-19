'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  const nextThemeLabel = theme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      type="button"
      size="sm"
      variant="tertiary"
      isIconOnly
      className="size-11 min-w-11 md:size-9 md:min-w-9"
      aria-label={`Switch to ${nextThemeLabel} mode`}
      onPress={toggleTheme}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </Button>
  );
}
