export default function ThemeScript() {
  const code = `
    (function() {
      try {
        let theme = localStorage.getItem('theme');
        if (!theme) {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.classList.add(theme);
      } catch (_) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
