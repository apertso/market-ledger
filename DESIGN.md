---
name: Market Ledger
description: A compact settlement ledger with readable live metrics on every screen.
colors:
  paper: '#f4f3ec'
  surface: '#ffffff'
  ink: '#173b32'
  muted: '#58675e'
  positive: '#28704c'
  negative: '#a54120'
  rule: '#ccd2c7'
  rule-soft: '#e7eae1'
  table-head: '#f8f9f4'
  input-rule: '#7d8d80'
  focus: '#346c57'
  error-surface: '#fbefe5'
  action-hover: '#285445'
typography:
  headline:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '20px'
    fontWeight: 550
    lineHeight: 1.15
    letterSpacing: '-0.025em'
  body:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.5
  action:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '13px'
    fontWeight: 500
    lineHeight: 1.5
  ledger:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1"
  label:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '13px'
    fontWeight: 550
    lineHeight: 1.5
  small:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '11px'
    fontWeight: 400
    lineHeight: 1.5
  mobile-label:
    fontFamily: 'IBM Plex Sans Variable, sans-serif'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.35
rounded:
  square: '0'
  compact: '4px'
spacing:
  step-4: '4px'
  step-6: '6px'
  step-8: '8px'
  step-10: '10px'
  step-12: '12px'
  step-16: '16px'
  step-20: '20px'
  step-24: '24px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.surface}'
    typography: '{typography.action}'
    rounded: '{rounded.compact}'
    padding: '6px 12px'
  button-primary-hover:
    backgroundColor: '{colors.action-hover}'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.action}'
    rounded: '{rounded.compact}'
    padding: '6px 12px'
  button-secondary-hover:
    backgroundColor: '{colors.rule-soft}'
  input-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.square}'
    height: '32px'
  navigation-active:
    textColor: '{colors.ink}'
  ledger-container:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.square}'
  ledger-row:
    typography: '{typography.ledger}'
    padding: '8px 12px'
  imbalance-positive:
    textColor: '{colors.positive}'
  imbalance-negative:
    textColor: '{colors.negative}'
---

# Design System: Market Ledger

## Overview

**Creative North Star: "Settlement ledger"**

The finished interface is a compact working sheet. Warm paper surrounds a white ledger; deep green ink, thin rules, and aligned numerical columns give the data its hierarchy. The tone is restrained, orderly, and practical.

The desktop layout uses dense rows and small controls. Phones retain larger values and touch targets, with all five metrics visible in each instrument group. Short headings and plain state text keep attention on the data. Self-hosted IBM Plex Sans and small authored SVGs provide the visual identity; there are no shipping raster assets.

**Key Characteristics:**

- A continuous ruled working surface.
- Tabular figures and aligned numerical columns.
- Dense desktop rows with larger mobile values.
- All five metrics visible in each mobile instrument group.
- Compact controls, clear focus, and concise state text.

## Colors

Warm neutrals support green ink and sparse functional color. The frontmatter records the exact extracted values.

### Primary

- **Ledger Ink** (`ink`): headings, primary actions, active navigation, and numerical text.
- **Action Hover** (`action-hover`): the primary button's hover fill.
- **Focus Green** (`focus`): keyboard and field focus outlines.

### Secondary

- **Positive Green** (`positive`): positive book imbalance.
- **Rust** (`negative`): negative book imbalance, invalid fields, and producer errors.

### Neutral

- **Warm Paper** (`paper`): page background.
- **White Sheet** (`surface`): ledger and input surfaces.
- **Muted Ink** (`muted`): state text, units, ranges, inactive navigation, and mobile metric labels.
- **Structural Rule** (`rule`): major dividers and the ledger boundary.
- **Soft Rule** (`rule-soft`): row/field separators and secondary-button hover.
- **Header Wash** (`table-head`): table headings and row hover.
- **Input Boundary** (`input-rule`): the stronger resting form boundary.
- **Error Paper** (`error-surface`): the producer error notice.

### Named Rules

**The State With Words Rule.** Producer state is plain text beside Pause/Resume, and colored imbalance retains its signed number.

## Typography

**Display and Body Font:** IBM Plex Sans Variable, with a sans-serif fallback, self-hosted through Fontsource.

**Character:** One technical sans-serif carries both interface copy and data. Moderate variable weights create hierarchy. Tables and numerical inputs use tabular figures.

### Hierarchy

- **Headline:** desktop page titles use the headline token; phones increase them to 24px.
- **Body:** the inherited base is the body token. Visible desktop controls and data use the smaller roles below.
- **Action / Ledger:** desktop buttons and numerical rows use these tokens; instrument names strengthen to weight 600.
- **Label:** desktop field labels use the label token.
- **Small:** producer state, validation errors, the reset notice, and Applied feedback use the small token.
- **Micro:** table headings, ranges, and units use the micro size; headings strengthen to weight 550.
- **Mobile:** ledger values and inputs use 16px; button text and field labels use 15px. Metric labels use the mobile-label token. State text, reset notice, and Applied feedback use 13px; ranges and units use 12px.

## Layout

The desktop sheet is capped at 1040px. Its header has a 48px minimum height and shares the sheet's alignment. Main content has 24px vertical padding. At 1088px and below, the main sheet has 24px side margins. At 760px and below, margins become 20px and main top padding becomes 20px; navigation spans a second header row.

The desktop ledger is a full-width six-column table. Values align right and instrument names align left. Both heading and body cells have 8px by 12px padding. The page heading sits 12px above the table, with plain producer state and Pause/Resume on its right.

At 760px and below, each instrument becomes a three-column, two-row group containing its symbol and all five metrics. Groups have 10px by 12px padding and 6px by 12px gaps. A muted label appears above each value. Values may wrap, and cells have a 34px minimum height. Column headings remain available to assistive technology. This mobile layout requires no horizontal scrolling or expansion.

Settings use a ruled form capped at 480px. Each field pairs a flexible label/range region with a 160px input column, a 16px gap, and 10px vertical padding. At 760px and below, field padding becomes 14px. At 420px and below, the input column becomes 155px and the gap becomes 12px. A short reset notice and Apply action follow the three fields.

## Elevation & Depth

There are no box shadows. Paper, white surfaces, header wash, and one-pixel rules establish depth. Focus outlines indicate interaction state rather than elevation.

### Named Rules

**The Flat Sheet Rule.** Working surfaces remain flat; dividers and tonal changes distinguish their roles.

## Shapes

Ledger and field boundaries are square. Buttons use the compact radius. Thin horizontal separators preserve the continuous sheet. Authored stroke SVGs supply the brand mark and Pause/Resume icons. Button icons are 14px on desktop and 18px on phones, with a 1.8 stroke width.

## Components

### Buttons

Desktop buttons have a 32px minimum height, 6px by 12px padding, and an 8px icon gap. Phones use a 44px minimum height and 10px by 16px padding. Primary actions use Ledger Ink with White Sheet text; secondary actions are transparent with an ink boundary. Hover changes the fill over 120ms ease-out. Disabled actions use opacity 0.45 and a default cursor. Keyboard focus is a two-pixel Focus Green outline offset by 4px.

### Cards / Containers

The white square ledger is the main container pattern, with a one-pixel Structural Rule boundary and no shadow. Header Wash marks headings and row hover; Soft Rule separates desktop rows and mobile instrument groups. The settings form uses horizontal field rules.

### Inputs / Fields

White square input wrappers are 32px high on desktop and 44px on phones. Numerical inputs use 6px by 10px padding, tabular figures, and a muted unit. Input Boundary supplies the one-pixel resting border; focus uses a two-pixel Focus Green outline offset by 3px. Invalid fields use a Rust boundary and explicit error text. Empty errors take no space. Labels, ranges, and errors are programmatically associated. Applied feedback is a short status beside Apply and clears when the form is edited.

### Navigation

Desktop text links use 13px type and a 20px gap. Muted Ink is the default; hover returns to Ledger Ink. The active link has weight 550 and a two-pixel ink underline, with a current-page attribute. Mobile navigation uses 15px type, a 24px gap, and a 48px minimum height.

### Producer state and error notice

Initializing, Running, Paused, or Error appears as plain text next to Pause/Resume. The error notice uses Error Paper and a rust boundary, with a secondary restart action. It has 12px desktop padding and stacks with 16px padding and 14px text on phones.

### Responsive ledger

The same table content supplies desktop columns and mobile instrument groups. Mobile labels come from cell data attributes, while explicit accessible names pair each metric with its value. Signed imbalance uses Positive Green or Rust without an additional chart. The ledger has no optional metadata band or disclosure.

## Do's and Don'ts

### Do:

- **Do** retain tabular figures and desktop numerical alignment.
- **Do** keep all five metrics visible within each mobile instrument group.
- **Do** preserve readable mobile values and 44px mobile control targets.
- **Do** pair imbalance color with its signed value and retain plain producer state.
- **Do** preserve visible focus and the stronger input boundary.
- **Do** use the existing flat surfaces, thin rules, compact controls, and concise labels.
- **Do** honor the existing reduced-motion preference, which removes transitions.

### Don't:

- **Don't** introduce decorative tick animation; the ledger updates quietly.
- **Don't** hide mobile metrics behind horizontal scrolling or expansion.

The record derives from `src/styles.css`, the app/dashboard/settings stylesheets, and their matching templates. It describes the finished compact implementation of the confirmed settlement ledger world.
