import{c as a}from"./index-ZCkS5xWp.js";const u=[{id:"claude",label:"Claude Code (/buddy)",badge:"CLI",filename:"~/.claude/buddy.json"},{id:"vscode",label:"VS Code / Cursor",badge:"IDE",filename:".vscode/settings.json"},{id:"orca",label:"Orca / Terminal Script",badge:"SH",filename:"spawn-buddy.sh"},{id:"react",label:"React / Next.js Widget",badge:"TSX",filename:"PixelCompanion.tsx"},{id:"manifest",label:"OpenPets Manifest",badge:"JSON",filename:"pet.json"}];function f(e,o,t,r){const i=r||e.sprites.variant,s=e.sprites.folder;switch(o){case"claude":{const n=e.claudeAscii.frames[0].join(`
`);return`// 1. Add to ~/.claude/settings.json or run "/buddy" in Claude Code
{
  "companion": {
    "id": "${e.id}",
    "name": "${e.name}",
    "species": "${e.claudeAscii.species}",
    "hat": "${e.claudeAscii.hat.trim()}",
    "defaultState": "${t}",
    "reactions": {
      "onToolCall": "code",
      "onTestPass": "celebrate",
      "onTestFail": "alert",
      "onIdle5m": "sleep"
    }
  }
}

/* Terminal /buddy ASCII Preview:
${e.claudeAscii.hat}
${n}
*/`}case"vscode":return`// Paste into .vscode/settings.json or Cursor User Settings (ext: tonybaloney.vscode-pets)
{
  "vscode-pets.petType": "${s}",
  "vscode-pets.petColor": "${i}",
  "vscode-pets.petSize": "medium",
  "vscode-pets.position": "explorer",
  "vscode-pets.theme": "${e.habitat}",
  "vscode-pets.throwBallWithMouse": true
}`;case"orca":{const n=e.claudeAscii.frames[0][0]||"",c=e.claudeAscii.frames[0][1]||"",l=e.claudeAscii.frames[0][2]||"",d=e.claudeAscii.frames[0][3]||"",m=e.claudeAscii.frames[0][4]||"";return`#!/usr/bin/env bash
# ${e.name} (${e.species}) — Orca CLI / Terminal Prompt Companion
# Usage: source spawn-buddy.sh

export ORCA_PET_NAME="${e.name}"
export ORCA_PET_STATE="${t}"

orca_buddy_render() {
  printf "\\033[38;5;220m%s\\033[0m\\n" "${e.claudeAscii.hat}"
  printf "%s\\n" "${n}"
  printf "%s  \\033[90m[%s: %s]\\033[0m\\n" "${c}" "$ORCA_PET_NAME" "$ORCA_PET_STATE"
  printf "%s\\n" "${l}"
  printf "%s\\n" "${d}"
  printf "%s\\n" "${m}"
}

orca_buddy_render`}case"react":return`import React, { useState } from 'react';

export type CompanionAction = 'idle' | 'walk' | 'run' | 'lie' | 'swipe' | 'with_ball';

export function ${e.name.replace(/[^a-zA-Z0-9]/g,"")}Companion({
  initialAction = 'idle',
  variant = '${i}',
  size = 96,
}: {
  initialAction?: CompanionAction;
  variant?: string;
  size?: number;
}) {
  const [action, setAction] = useState<CompanionAction>(initialAction);
  const spriteUrl = \`https://raw.githubusercontent.com/tonybaloney/vscode-pets/main/media/${s}/\${variant}_\${action}_8fps.gif\`;

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
        alt="${e.name} (${e.species})"
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      />
      <span style={{ fontSize: 11, color: '#A8A8AD', marginTop: 6, fontFamily: 'monospace' }}>
        ${e.name} · {action}
      </span>
    </div>
  );
}`;case"manifest":return JSON.stringify({schema:"https://openpets.dev/schema/v1/pet.json",id:e.id,name:e.name,species:e.species,author:e.author,toolOrigin:e.toolOrigin,defaultVariant:i,availableVariants:e.availableVariants,habitat:e.habitat,sprites:{idle:a(`/sprites/${s}/${i}_idle_8fps.gif`),walk:a(`/sprites/${s}/${i}_walk_8fps.gif`),run:a(`/sprites/${s}/${i}_run_8fps.gif`),sleep:e.sprites.sleep.replace(e.sprites.variant,i),swipe:a(`/sprites/${s}/${i}_swipe_8fps.gif`),withBall:a(`/sprites/${s}/${i}_with_ball_8fps.gif`)},stats:e.stats},null,2)}}export{u as E,f as g};
