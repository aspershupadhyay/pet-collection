import { asset } from '../utils/asset';
import { PetAction, PetDefinition } from '../types/pet';

export type ExportToolId =
  | 'claude'
  | 'vscode'
  | 'orca'
  | 'react'
  | 'manifest';

export interface ExportToolTab {
  id: ExportToolId;
  label: string;
  badge: string;
  filename: string;
}

export const EXPORT_TOOLS: ExportToolTab[] = [
  { id: 'claude', label: 'Claude Code (/buddy)', badge: 'CLI', filename: '~/.claude/buddy.json' },
  { id: 'vscode', label: 'VS Code / Cursor', badge: 'IDE', filename: '.vscode/settings.json' },
  { id: 'orca', label: 'Orca / Terminal Script', badge: 'SH', filename: 'spawn-buddy.sh' },
  { id: 'react', label: 'React / Next.js Widget', badge: 'TSX', filename: 'PixelCompanion.tsx' },
  { id: 'manifest', label: 'OpenPets Manifest', badge: 'JSON', filename: 'pet.json' },
];

export function generateToolSnippet(
  pet: PetDefinition,
  tool: ExportToolId,
  action: PetAction,
  variant?: string
): string {
  const activeVariant = variant || pet.sprites.variant;
  const folder = pet.sprites.folder;

  switch (tool) {
    case 'claude': {
      const asciiPreview = pet.claudeAscii.frames[0].join('\n');
      return `// 1. Add to ~/.claude/settings.json or run "/buddy" in Claude Code
{
  "companion": {
    "id": "${pet.id}",
    "name": "${pet.name}",
    "species": "${pet.claudeAscii.species}",
    "hat": "${pet.claudeAscii.hat.trim()}",
    "defaultState": "${action}",
    "reactions": {
      "onToolCall": "code",
      "onTestPass": "celebrate",
      "onTestFail": "alert",
      "onIdle5m": "sleep"
    }
  }
}

/* Terminal /buddy ASCII Preview:
${pet.claudeAscii.hat}
${asciiPreview}
*/`;
    }

    case 'vscode':
      return `// Paste into .vscode/settings.json or Cursor User Settings (ext: tonybaloney.vscode-pets)
{
  "vscode-pets.petType": "${folder}",
  "vscode-pets.petColor": "${activeVariant}",
  "vscode-pets.petSize": "medium",
  "vscode-pets.position": "explorer",
  "vscode-pets.theme": "${pet.habitat}",
  "vscode-pets.throwBallWithMouse": true
}`;

    case 'orca': {
      const l0 = pet.claudeAscii.frames[0][0] || '';
      const l1 = pet.claudeAscii.frames[0][1] || '';
      const l2 = pet.claudeAscii.frames[0][2] || '';
      const l3 = pet.claudeAscii.frames[0][3] || '';
      const l4 = pet.claudeAscii.frames[0][4] || '';
      return `#!/usr/bin/env bash
# ${pet.name} (${pet.species}) — Orca CLI / Terminal Prompt Companion
# Usage: source spawn-buddy.sh

export ORCA_PET_NAME="${pet.name}"
export ORCA_PET_STATE="${action}"

orca_buddy_render() {
  printf "\\033[38;5;220m%s\\033[0m\\n" "${pet.claudeAscii.hat}"
  printf "%s\\n" "${l0}"
  printf "%s  \\033[90m[%s: %s]\\033[0m\\n" "${l1}" "$ORCA_PET_NAME" "$ORCA_PET_STATE"
  printf "%s\\n" "${l2}"
  printf "%s\\n" "${l3}"
  printf "%s\\n" "${l4}"
}

orca_buddy_render`;
    }

    case 'react':
      return `import React, { useState } from 'react';

export type CompanionAction = 'idle' | 'walk' | 'run' | 'lie' | 'swipe' | 'with_ball';

export function ${pet.name.replace(/[^a-zA-Z0-9]/g, '')}Companion({
  initialAction = 'idle',
  variant = '${activeVariant}',
  size = 96,
}: {
  initialAction?: CompanionAction;
  variant?: string;
  size?: number;
}) {
  const [action, setAction] = useState<CompanionAction>(initialAction);
  const spriteUrl = \`https://raw.githubusercontent.com/tonybaloney/vscode-pets/main/media/${folder}/\${variant}_\${action}_8fps.gif\`;

  return (
    <div
      onClick={() => setAction(action === 'idle' ? 'swipe' : 'idle')}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        background: '#1B1B1E',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
      }}
    >
      <img
        src={spriteUrl}
        alt="${pet.name} (${pet.species})"
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      />
      <span style={{ fontSize: 11, color: '#A8A8AD', marginTop: 6, fontFamily: 'monospace' }}>
        ${pet.name} · {action}
      </span>
    </div>
  );
}`;

    case 'manifest':
      return JSON.stringify(
        {
          schema: 'https://openpets.dev/schema/v1/pet.json',
          id: pet.id,
          name: pet.name,
          species: pet.species,
          author: pet.author,
          toolOrigin: pet.toolOrigin,
          defaultVariant: activeVariant,
          availableVariants: pet.availableVariants,
          habitat: pet.habitat,
          sprites: {
            idle: asset(`/sprites/${folder}/${activeVariant}_idle_8fps.gif`),
            walk: asset(`/sprites/${folder}/${activeVariant}_walk_8fps.gif`),
            run: asset(`/sprites/${folder}/${activeVariant}_run_8fps.gif`),
            sleep: pet.sprites.sleep.replace(pet.sprites.variant, activeVariant),
            swipe: asset(`/sprites/${folder}/${activeVariant}_swipe_8fps.gif`),
            withBall: asset(`/sprites/${folder}/${activeVariant}_with_ball_8fps.gif`),
          },
          stats: pet.stats,
        },
        null,
        2
      );
  }
}

export function generateToolSnippets(
  pet: PetDefinition,
  action: PetAction,
  variant?: string
): { id: ExportToolId; name: string; badge: string; filename: string; code: string }[] {
  return EXPORT_TOOLS.map((tool) => ({
    id: tool.id,
    name: tool.label,
    badge: tool.badge,
    filename: tool.filename,
    code: generateToolSnippet(pet, tool.id, action, variant),
  }));
}

