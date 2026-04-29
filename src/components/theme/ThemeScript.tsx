import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeScript() {
  const script = `
    (function() {
      const storageKey = '${THEME_STORAGE_KEY}';
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const readPreference = function() {
        try {
          const stored = localStorage.getItem(storageKey);
          return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        } catch {
          return 'system';
        }
      };
      const applyPreference = function(preference) {
        const resolved = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
        document.documentElement.dataset.themePreference = preference;
        document.documentElement.dataset.theme = resolved;

        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };

      applyPreference(readPreference());
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', function() {
          if (readPreference() === 'system') {
            applyPreference('system');
          }
        });
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
