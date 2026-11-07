# Gimmick Gecko — Website Design Specification (Revised Dark / Math-Focused Version)

## 1. Product overview

**Product:** Gimmick Gecko  
**Tagline:** *Spot the gimmick. Solve smarter.*

**Purpose:** Gimmick Gecko is an AI-assisted math competition practice website for students preparing for contests such as AMC, COMC, and similar olympiad-style problem sets. The site should make it immediately obvious that it is about **math learning**, **problem solving**, and **contest prep**.

This spec is based on the attached lo-fi sketches and revised with the following priorities:
- darker shades and stronger contrast
- more intuitive, accessible layout
- clearer math identity
- cleaner navigation and more obvious call-to-actions

This is a **prototype/design specification**, not a claim that AI solving, authentication, or progress syncing already exist.

---

## 2. Core design goals

### A. Make it obvious the site is for math
The interface should visually signal math from the first second. Use:
- formulas and notation in the hero area (e.g. `x^2 + y^2`, `mod`, diagrams, sigma, geometric icons)
- contest labels like **AMC 10/12**, **COMC**, **Geometry**, **Combinatorics**, **Modular Arithmetic**
- subtle graph-paper / coordinate-grid backgrounds
- cards labeled **Practice Problems**, **Topics**, **Upload a Problem**, **Step-by-Step Solution**, **Key Gimmick**
- a mascot that acts like a math guide, not just decoration

### B. Darker shades
Use a dark interface with bright, readable accents. It should feel modern, academic, and slightly playful.

### C. More intuitive and accessible
The UI should feel immediately understandable:
- clear page titles
- clear navigation
- strong section labels
- large readable buttons
- high contrast text
- consistent layout
- keyboard-friendly interactions
- mobile responsiveness

---

## 3. Visual style direction

### Brand personality
- clever
- approachable
- encouraging
- mathy / academic
- friendly but not childish

### Mascot
**Gimmick Gecko** should remain part of the identity.
- big eyes / expressive face
- appears on homepage and secondary pages
- uses small speech bubbles to guide the student
- should reinforce the teaching role
- should not distract from the content

### Visual language
- dark background with bright cards and accents
- soft rounded corners
- thin grid lines or graph-paper texture
- math symbols used decoratively but sparingly
- strong headings and obvious content zones
- cards for contests, topics, uploads, and solutions

---

## 4. Suggested accessible color palette

| Token | Value | Usage |
|---|---|---|
| Background | `#0F172A` | Main page background |
| Panel | `#111827` | Dark cards / sections |
| Panel 2 | `#1E293B` | Secondary panels |
| Text Primary | `#F8FAFC` | Main text |
| Text Secondary | `#CBD5E1` | Supporting text |
| Accent Green | `#22C55E` | Primary CTA / mascot accent |
| Accent Blue | `#38BDF8` | Links / filters / topic indicators |
| Accent Yellow | `#FACC15` | Gimmick highlight / key insight |
| Accent Purple | `#A78BFA` | Optional secondary accent |
| Border | `#334155` | Dividers / outlines |
| Danger / Error | `#F87171` | Validation states |

### Contrast expectations
- all body text should meet accessible contrast against the background
- buttons should have clear hover and focus states
- do not rely on color alone to convey meaning

---

## 5. Typography

### Recommended typography style
- **Headings:** bold, modern sans-serif
- **Body:** readable sans-serif
- **Math / code snippets:** mono or math-friendly fallback styling

### Type hierarchy
- H1: strong hero / page titles
- H2: section titles
- H3: card titles
- body text: 16px minimum on desktop, 15–16px on mobile
- buttons: clearly legible, medium/bold weight

---

## 6. Site map

1. `/` — Homepage
2. `/problems` — Past Problems & Questions
3. `/upload` — Upload / Solution
4. `/about` — About
5. `/login` — Log in

The three main sketched pages are:
- Homepage
- Past Problems & Questions
- Upload / Solution

---

## 7. Shared layout and components

### Header
- logo / mascot icon + website name on left
- navigation on right: **Home**, **Problems**, **Upload**, **About**, **Log in**
- active page should be visually highlighted
- sticky header on larger screens is a plus

### Shared components
- primary button
- secondary button
- contest card
- topic chip
- search field
- filter button / dropdown
- upload dropzone
- progress card
- solution step list
- gimmick callout
- hint reveal card
- mascot speech bubble

### Accessibility requirements
- keyboard navigable
- visible focus outline
- semantic headings
- labeled buttons and form fields
- alt text for mascot illustrations
- touch-friendly controls
- responsive behavior on mobile
- avoid tiny hit targets

---

## 8. Homepage (`/`)

### Purpose
The homepage should immediately explain:
1. this is a math competition tutor
2. the gecko helps you find the trick/gimmick
3. users can either browse past problems or upload their own

### Layout
#### Hero section
- large title: **Gimmick Gecko**
- subtitle/tagline: **Spot the gimmick. Solve smarter.**
- supporting line such as:  
  **AI-powered math competition practice for AMC, COMC, and olympiad-style problem solving.**
- gecko mascot in the hero area with a speech bubble
- decorative math content in background: equations, diagrams, modular notation, coordinate grid, geometric figure hints

#### Primary action buttons
- **Browse Problems**
- **Upload a Problem**

These should be large and obvious.

#### Secondary info cards
Use a 3-card section below the hero:
1. **Contest Practice** — AMC / COMC / topic-based sets
2. **Learn the Gimmick** — key insight extraction, hints, and step-by-step solutions
3. **Track Progress** — practice streaks, solved counts, topic coverage

#### Progress preview
A progress section can show:
- problems solved this week
- favorite topics
- practice streak
- sample progress bar

If not logged in, clearly label it as **demo progress**.

### Homepage content suggestions
Possible supporting copy:
- “Practice real-style contest math problems.”
- “Upload a problem and get a guided explanation.”
- “Learn the hidden trick behind each solution.”

---

## 9. Past Problems & Questions (`/problems`)

### Purpose
This page helps users browse by contest or topic.

### Layout
#### Top section
- page title: **Past Problems & Questions**
- short description: **Browse contest-style math practice by competition or topic.**
- search bar
- filter controls
- optional sort control
- Home button or breadcrumb

#### Main content structure
Use a clear 2-column layout on desktop:

**Left side:** Contest collections
- AMC 12A 2026
- AMC 10A 2026
- COMC 2026
- future contests / sets

**Right side:** Topics
- Modular Arithmetic
- Combinatorics
- Geometry
- Algebra
- Number Theory

Each item should look obviously clickable.

### Recommended UI improvements over the sketch
- instead of plain text links, use **cards or list rows**
- include short sublabels such as:
  - “25 problems”
  - “Difficulty: Medium–Hard”
  - “Popular topic”
- use icons or badges sparingly for clarity

### Interactions
- search filters the visible list
- topic chips filter results
- clicking a contest or topic can lead to a demo problem detail or the upload/solution page in the prototype

### Important content note
Do **not** claim official licensed question banks unless they actually exist in the repo/product. For the prototype, use sample labels and clearly marked placeholder content.

---

## 10. Upload / Solution (`/upload`)

### Purpose
This is the most important “active learning” page. The user uploads a problem and receives:
- a solution
- the key gimmick/trick
- optional hint(s)

### Layout
Use a 2-column layout on desktop.

#### Left column
**Upload block**
- big visible dropzone or upload button
- accepted file types clearly labeled
- supportive helper text
- file status after selection

**Solution block**
- section title: **Step-by-Step Solution**
- numbered steps
- clean spacing
- math-friendly formatting

**Key Gimmick block**
- highlighted in yellow accent
- title: **Key Gimmick**
- one concise sentence explaining the main trick

**Hint block**
- button: **Reveal Hint**
- reveals one hint at a time in future versions
- in prototype can reveal a single demo hint

#### Right column
- large gecko illustration pointing at the solution
- short encouraging message in a speech bubble
- optional checklist like:
  - Upload your problem
  - Read the steps
  - Spot the gimmick

### Upload UX expectations
- accept `.png`, `.jpg`, `.jpeg`, `.webp`, `.pdf`
- show selected filename
- show file-size validation message
- prototype should not pretend AI has actually solved the uploaded file unless that integration exists

### Example demo problem
Use clearly labeled demo content, such as:

**Problem:** Find the remainder when `7^2026` is divided by `10`.

**Solution idea:** look for the repeating cycle of last digits.

**Key Gimmick:** identify periodicity instead of brute force.

**Hint:** check the last digits of `7^1`, `7^2`, `7^3`, and `7^4`.

---

## 11. Content tone

### Voice
- supportive
- clear
- smart but not intimidating
- a little playful

### Example mascot speech bubbles
- “Every hard problem has a hidden trick.”
- “Try spotting the pattern first.”
- “Geometry? Let’s look for the key observation.”
- “Modular arithmetic loves repeating cycles.”

---

## 12. Responsiveness

### Desktop
- 2-column hero
- 2-column problems page
- 2-column upload page

### Tablet/mobile
- stack sections vertically
- keep large buttons
- keep page titles visible
- search/filter should remain usable without crowding
- mascot can shrink or move below main content

---

## 13. Prototype acceptance criteria

- [ ] Dark theme with strong contrast is implemented.
- [ ] The site is visually and textually obvious as a math learning / contest prep website.
- [ ] Homepage includes gecko mascot, title, tagline, math-themed hero visuals, and clear actions.
- [ ] Problems page includes search, filter, contest cards, topic chips, and obvious math labels.
- [ ] Upload page includes upload area, step-by-step solution, key gimmick, hint reveal, and mascot guidance.
- [ ] Navigation is intuitive and consistent.
- [ ] Keyboard access and visible focus states are present.
- [ ] Mock/demo features are clearly identified as demos.

---

## 14. Implementation guidance for FreeBuff

1. Work on **`branch-2`**, not `main`.
2. Use the lo-fi sketch as the layout reference and this revised spec as the UX/style guide.
3. Prioritize:
   - accessible dark theme
   - clear math branding
   - responsive layout
   - obvious navigation
   - working prototype interactions
4. Build the following first:
   - homepage
   - past problems page
   - upload / solution page
5. Keep all AI solving, authentication, and stored progress clearly marked as mocked unless the repo already has real integrations.
6. Preserve the playful gecko personality while making the interface feel more polished and academic.

