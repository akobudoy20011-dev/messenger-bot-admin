# ECLIPSE UI/UX MASTER SYSTEM

## Product
ECLIPSE Command Center is a private, cinematic operations interface for a Messenger bot and its connected game systems. It combines a celestial navigation layer with dense operational data.

Primary mental model:
- galaxy = spatial navigation
- command panel = operational workspace
- modules = distinct systems
- data surfaces = evidence/state, not decoration

## Design direction
**Cinematic Celestial Operations** — observatory + spacecraft command console + RPG world atlas.

Do not turn ECLIPSE into a generic SaaS dashboard, crypto dashboard, Discord admin template, or neon cyberpunk UI.

## Visual tokens
- Canvas: #050509
- Surface: #08070C
- Elevated: #0D0A12
- Subtle surface: rgba(255,255,255,.025)
- Border: rgba(216,210,227,.08)
- Strong border: rgba(216,210,227,.14)
- Primary text: #F4EFF8
- Secondary text: rgba(216,210,227,.68)
- Muted text: rgba(216,210,227,.38)
- Lilac: #A994C7
- Rose: #B9829B
- Deep rose: #7A3949
- Signal blue: #8FB0D2
- Success: #7DB59A
- Warning: #D3A96B
- Danger: #C77C87

## Typography
- Display: existing ECLIPSE display font
- UI: existing sans-serif
- Technical identifiers/log payloads: monospace
- Kicker: 9–10px, uppercase, 0.18–0.28em tracking
- Body: readable 11–14px
- Never use tiny text as the only way to communicate important state.

## Surfaces
Use three levels:
1. Canvas — galaxy/background
2. Surface — transparent operational panel
3. Elevated — focused/selected control or inspector

Prefer borders + depth + translucency over heavy shadows.

## Interaction
- Every interactive element must be keyboard reachable.
- Use semantic buttons/links for actions.
- Minimum practical touch target: ~44px.
- Hover is enhancement, never the only state.
- Focus-visible must be obvious.
- Motion should explain navigation, selection, loading, or state change.
- Respect prefers-reduced-motion.
- Avoid perpetual motion that competes with data.

## Galaxy rules
- Preserve pan, drag, wheel zoom, pinch zoom, node selection and responsive behavior.
- Galaxy is navigation, not wallpaper.
- Selected systems should have stronger visual hierarchy.
- Central sun represents ECLIPSE core/overview.
- Never put critical controls where touch/pointer navigation becomes unreliable.
- Maintain a low visual noise floor behind the command panel.

## Module rules
Each module needs:
- identity / context
- current state
- important metrics
- recent activity
- actionable controls when supported by the backend
- loading state
- empty state
- error/offline state

Do not reuse the exact same card grid for every module.

### Users
Identity, progression, economy, activity and moderation context.

### Economy
Circulation, inflow/outflow, ledger, suspicious activity and transaction context.

### RPG
World, players, classes, skills, spells, equipment, companions, quests, guilds, kingdoms, battles, bosses and loot.

### Games
Per-game activity, sessions/rounds, wins/losses, economy impact and recent activity. Do not invent metrics that the backend does not provide.

### Moderation
Live incidents, severity, confidence, actions, affected users and system state.

### Music
Current state, queue/job telemetry, requester/context and operational controls supported by the backend.

### Analytics
Trends with meaningful labels, units and time windows. Charts must answer a question.

### Logs
Operational history with level/source/time, readable scanning, filtering/search where data supports it, and safe clearing.

### Bot Health
Messenger connection, process, database, uptime, watchdog, traffic governor and music runtime state.

## Data visualization
- Prefer compact charts that expose trends.
- Always label the metric and time window.
- Avoid fake 3D charts, decorative gauges and unexplained percentages.
- Use consistent units and number formatting.
- Preserve accessible text equivalents for important values.

## Responsive strategy
Treat 375px, 768px, 1024px and 1440px as intentional layouts.
- Mobile: prioritize current state + primary action + critical telemetry.
- Tablet: split dense surfaces carefully.
- Desktop: allow multi-column operational views.
Never merely shrink desktop.

## Accessibility
- visible focus-visible
- semantic headings
- aria-labels for icon-only controls
- sufficient contrast
- keyboard navigation
- reduced motion
- no information conveyed by color alone

## Anti-patterns
Avoid:
- generic dashboard card walls
- excessive gradients
- excessive glow
- giant decorative typography
- emoji as UI icons
- fake data
- fake charts
- tiny unreadable labels
- hover-only functionality
- clickable divs
- unexplained badges
- unnecessary modal layers
- animation for its own sake
- destructive actions without clear affordance
- replacing real backend state with local mock state

## Engineering constraints
- Preserve existing API contracts.
- Preserve dashboard authentication/session handling.
- Preserve Messenger session/cookie handling.
- Preserve SSE/live events and health telemetry.
- Do not touch unrelated backend mechanics during UI work.
- Do not touch rpg/combat.js.
- Do not touch Lucien files.
- Do not expose secrets.
- Prefer reusable components over expanding one giant component.
- Validate builds after meaningful changes.

## Delivery loop
1. Inspect existing implementation.
2. Identify UX/design debt.
3. Establish tokens and primitives.
4. Refine shell/navigation.
5. Refine modules according to their domain.
6. Add loading/empty/error/accessibility states.
7. Validate mobile and reduced motion.
8. Run build/lint checks.
9. Review the result again for visual noise and regressions.
