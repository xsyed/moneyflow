# Phase 1: Project Setup

## Goal
Create Angular 18 project with Angular Material and basic configuration.

## Steps

### 1.1 Create Angular Project
```bash
ng new money-stream --style=scss --routing=false --ssr=false
cd money-stream
```

### 1.2 Add Angular Material
```bash
ng add @angular/material
```
- Choose a prebuilt theme (Indigo/Pink or custom)
- Enable global typography: Yes
- Enable animations: Yes

### 1.3 Configure App Structure
Create folder structure:
```
src/app/
├── components/
├── services/
├── models/
```

### 1.4 Update app.config.ts
- Import `provideAnimationsAsync`
- Import necessary Material modules

### 1.5 Clean Up Default Files
- Remove default Angular template content from `app.component.html`
- Set up basic app shell with Material toolbar

### 1.6 Set Up Global Styles
In `styles.scss`:
- Set full height for html/body
- Remove default margins
- Set a clean background color

## Deliverables
- [ ] Working Angular 18 project
- [ ] Angular Material installed and configured
- [ ] Basic app shell with toolbar
- [ ] Folder structure created
