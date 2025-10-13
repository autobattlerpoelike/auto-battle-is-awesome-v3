Auto Battle Is Awesome - Patch (updated files)

This zip contains the updated source files to fix combat, spawn, crits, damage numbers, and restore Character Status visibility.
Drop these files into your project's src/ folder (overwriting existing files with the same names):

Files included:
- src/systems/gameContext.tsx
- src/systems/combat.ts
- src/components/GameCanvas.tsx
- src/components/CharacterStatusPanel.tsx
- src/components/SkillTreePanel.tsx
- src/components/InventoryPanel.tsx
- src/components/Header.tsx
- src/App.tsx
- src/main.tsx

After copying, run:
  npm install
  npm run dev

Notes:
- These updates assume you have the rest of the project structure from v2/v3.
- If you kept earlier patches, this will overwrite only the listed files.
- If any errors appear, check the browser console and paste them here and I'll help fix them.
