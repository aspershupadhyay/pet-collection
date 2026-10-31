import type { TerminalTheme } from '../types/item';

export type ThemeTarget = 'ghostty' | 'kitty' | 'alacritty' | 'wezterm' | 'windows' | 'vscode';

export const THEME_TARGETS: { id: ThemeTarget; label: string; filename: (t: TerminalTheme) => string }[] = [
  { id: 'ghostty', label: 'Ghostty', filename: (t) => `~/.config/ghostty/themes/petcraft-${t.id}` },
  { id: 'kitty', label: 'Kitty', filename: (t) => `~/.config/kitty/themes/petcraft-${t.id}.conf` },
  { id: 'alacritty', label: 'Alacritty', filename: (t) => `~/.config/alacritty/petcraft-${t.id}.toml` },
  { id: 'wezterm', label: 'WezTerm', filename: (t) => `~/.config/wezterm/colors/petcraft-${t.id}.toml` },
  { id: 'windows', label: 'Windows Terminal', filename: () => 'settings.json → "schemes"' },
  { id: 'vscode', label: 'VS Code', filename: () => 'settings.json' },
];

const NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;

export function themeSnippet(t: TerminalTheme, target: ThemeTarget): string {
  const c = t.colors;
  const title = `Petcraft ${t.name}`;
  switch (target) {
    case 'ghostty':
      return [
        `# ${title}`,
        `background = ${c.background}`,
        `foreground = ${c.foreground}`,
        `cursor-color = ${c.cursor}`,
        `selection-background = ${c.selection}`,
        ...c.ansi.map((hex, i) => `palette = ${i}=${hex}`),
      ].join('\n');
    case 'kitty':
      return [
        `# ${title}`,
        `background ${c.background}`,
        `foreground ${c.foreground}`,
        `cursor ${c.cursor}`,
        `selection_background ${c.selection}`,
        ...c.ansi.map((hex, i) => `color${i} ${hex}`),
      ].join('\n');
    case 'alacritty':
      return [
        `# ${title}`,
        '[colors.primary]',
        `background = "${c.background}"`,
        `foreground = "${c.foreground}"`,
        '',
        '[colors.cursor]',
        `cursor = "${c.cursor}"`,
        '',
        '[colors.selection]',
        `background = "${c.selection}"`,
        '',
        '[colors.normal]',
        ...NAMES.map((n, i) => `${n} = "${c.ansi[i]}"`),
        '',
        '[colors.bright]',
        ...NAMES.map((n, i) => `${n} = "${c.ansi[i + 8]}"`),
      ].join('\n');
    case 'wezterm':
      return [
        '[colors]',
        `background = "${c.background}"`,
        `foreground = "${c.foreground}"`,
        `cursor_bg = "${c.cursor}"`,
        `selection_bg = "${c.selection}"`,
        `ansi = [${c.ansi.slice(0, 8).map((h) => `"${h}"`).join(', ')}]`,
        `brights = [${c.ansi.slice(8).map((h) => `"${h}"`).join(', ')}]`,
        '',
        '[metadata]',
        `name = "${title}"`,
      ].join('\n');
    case 'windows': {
      const pick = (i: number) => c.ansi[i];
      const scheme: Record<string, string> = {
        name: title,
        background: c.background,
        foreground: c.foreground,
        cursorColor: c.cursor,
        selectionBackground: c.selection,
      };
      NAMES.forEach((n, i) => {
        const key = n === 'magenta' ? 'purple' : n;
        scheme[key] = pick(i);
        scheme[`bright${key[0].toUpperCase()}${key.slice(1)}`] = pick(i + 8);
      });
      return JSON.stringify(scheme, null, 2);
    }
    case 'vscode': {
      const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
      const colors: Record<string, string> = {
        'terminal.background': c.background,
        'terminal.foreground': c.foreground,
        'terminalCursor.foreground': c.cursor,
        'terminal.selectionBackground': c.selection,
      };
      NAMES.forEach((n, i) => {
        colors[`terminal.ansi${cap(n)}`] = c.ansi[i];
        colors[`terminal.ansiBright${cap(n)}`] = c.ansi[i + 8];
      });
      return JSON.stringify({ 'workbench.colorCustomizations': colors }, null, 2);
    }
  }
}
