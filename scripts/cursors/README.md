# TFL Cursor Pack Importer

TFL Studio uses native browser cursor images instead of a fake DOM cursor. The importer accepts an **already extracted** Windows cursor pack and normalizes common `.cur` / `.ani` roles.

```powershell
npm run cursor:import -- "C:\\Users\\you\\Downloads\\My Cursor Pack" my-cursor-pack
```

Output:

```text
public/cursors/imported/my-cursor-pack/
  default-00.cur
  pointer-00.cur
  ...
  manifest.json
```

`.ani` files are parsed directly as RIFF/ACON. Their embedded `.cur` frames and approximate timing are written into the manifest, so no runtime ANI parser is required in the browser.

The script intentionally does not unpack `.zip` / `.rar` archives. Extract the source pack first, and review its license before adding generated assets to the production catalog.
