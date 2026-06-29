=== COLOR SYSTEM ===

LIGHT MODE (default theme):
- Background (app base): #FFF8F0 (warm cream, not pure white)
- Surface (cards, sheets): #FFFFFF
- Surface raised/elevated (modals, active cards): #FFFDF9
- Primary accent (CTAs, active nav, key actions): #FF7A59 (warm coral-orange)
- Primary accent hover/pressed: #E8623F
- Secondary accent (AI features, highlights, badges): #7C6FF0 (soft violet — links back to Synapse's indigo brand identity)
- Secondary accent subtle background: #ECE9FE
- Success: #4CAF82
- Success subtle background: #E3F5EB
- Warning: #F2A93B
- Warning subtle background: #FCF1DC
- Danger: #E85C5C
- Danger subtle background: #FCE6E6
- Text primary: #2B2520 (warm near-black, not pure black)
- Text secondary: #7A7268
- Text tertiary / placeholder: #B0A89D
- Border / divider: #F0E6D8
- Bottom nav bar background: #FFFFFF with a subtle top border #F0E6D8

DARK MODE (toggle destination, NOT default):
- Background (app base): #1C1815
- Surface (cards, sheets): #262019
- Surface raised: #2E2620
- Primary accent: #FF8F73 (lightened coral for dark-mode contrast)
- Primary accent hover/pressed: #FFA68C
- Secondary accent: #A39BFF
- Secondary accent subtle background: #332D52
- Success: #6FCB9F
- Success subtle background: #1F3329
- Warning: #F2BB66
- Warning subtle background: #3A2F18
- Danger: #F08080
- Danger subtle background: #3A2020
- Text primary: #F5F0E8
- Text secondary: #B8AFA3
- Text tertiary: #7A7268
- Border / divider: #3A332B
- Bottom nav bar background: #262019 with top border #3A332B

=== TYPOGRAPHY ===
- Font family: "Plus Jakarta Sans" (rounded, friendly, highly legible sans-serif). Fallback: system-ui, sans-serif.
- Display/Heading (page titles): 28px, weight 700, line-height 1.2, letter-spacing -0.01em
- Section headers: 20px, weight 700, line-height 1.3
- Card titles: 16px, weight 600, line-height 1.4
- Body text: 15px, weight 400, line-height 1.5
- Secondary/caption text: 13px, weight 500, line-height 1.4
- Button label: 15px, weight 600
- Nav bar label: 11px, weight 600, letter-spacing 0.02em

=== SPACING SCALE ===
Use a consistent 4px base scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px
- Screen horizontal padding: 20px
- Card internal padding: 20px
- Gap between stacked cards: 16px
- Gap between related elements inside a card: 12px
- Section vertical spacing (between major page sections): 32px

=== CORNER RADII (critical to the "soft" feel) ===
- Cards / surfaces: 24px
- Buttons (primary, secondary): 18px
- Pills / badges / tags: 999px (fully rounded)
- Input fields: 16px
- Bottom sheet / modal top corners: 28px
- Avatar images: fully circular
- Small icon containers (e.g. icon-in-colored-circle): 14px or fully circular, never sharp square

=== SHADOWS ===
Soft, diffused, warm-tinted shadows only — never sharp/cold gray shadows.
- Card resting shadow: 0px 2px 8px rgba(43, 37, 32, 0.06)
- Card elevated/active shadow: 0px 8px 24px rgba(43, 37, 32, 0.10)
- Bottom nav shadow (casts upward): 0px -4px 16px rgba(43, 37, 32, 0.05)
- Floating action button shadow: 0px 6px 16px rgba(255, 122, 89, 0.35) — tinted with the primary accent color, not gray

=== COMPONENT STYLES ===

Buttons:
- Primary button: solid #FF7A59 background, white text, 18px radius, 14px vertical padding, 24px horizontal padding, no border
- Secondary button: #FFFFFF background, #FF7A59 1.5px border, #FF7A59 text, same radius/padding
- Ghost/tertiary button: transparent background, #7A7268 text, no border, underline on press only
- All buttons: subtle scale-down (0.97x) on tap/press for tactile feedback

Cards:
- White (#FFFFFF) surface, 24px radius, 20px padding, resting shadow as defined above
- No visible border in light mode; in dark mode use a 1px #3A332B border instead of shadow (shadows read poorly on dark backgrounds)

Bottom Navigation Bar:
- Fixed to bottom, full width, white background, top border #F0E6D8, height 64px + safe-area-inset-bottom padding
- 5 icon+label items, evenly spaced
- Active item: icon and label in primary accent color #FF7A59, with a small filled rounded-pill highlight (#FCEAE3 background, 999px radius) behind the icon
- Inactive items: icon and label in text tertiary #B0A89D
- Center item gets a subtly larger icon (28px vs 24px for others) to signal primary importance

Input fields:
- Background #FFF8F0 (matches app background, slightly recessed feel) or white if on a colored section
- 16px radius, 14px vertical padding, 16px horizontal padding
- 1.5px border #F0E6D8 default, border becomes #FF7A59 on focus with a subtle glow (0px 0px 0px 4px rgba(255,122,89,0.12))
- Placeholder text in text tertiary color

Badges / Pills (e.g. unread counts, status tags):
- Fully rounded (999px radius)
- Small size: 20px height, 8px horizontal padding, 11px bold text
- Notification count badge specifically: solid #E85C5C background, white text, positioned top-right of icon

Avatars:
- Always perfectly circular
- 2px white border ring when shown in a stack/list context for separation

Progress bars / streaks (used for habits, attendance, CGPA progress):
- Track: #F0E6D8 (light) / #3A332B (dark), fully rounded ends
- Fill: gradient from #FF7A59 to #7C6FF0 for a warm-to-cool friendly transition, fully rounded ends
- Height: 8px for inline progress, 12px for prominent dashboard widgets

=== MOTION FEELING (describe in any animated/interactive mockups) ===
- Everything should feel bouncy but not childish — use ease-out easing, slightly overshoot on entrance (springy, 300-400ms), quick snappy exits (150-200ms)
- Tap states: immediate scale-down feedback, no delay
- Page transitions: soft slide + fade, never harsh cuts

=== OVERALL MOOD REFERENCE ===
Calm, encouraging, warm, like a supportive study companion rather than a corporate productivity tool. Generous whitespace, never cramped. Rounded everywhere. Warm cream/coral/violet palette instead of cold blue/gray SaaS tones. This is the FULL design system — apply it consistently to every screen I ask you to design afterward in this same project/session.
