# Future animated theme controls

Status: reference backlog only. Build these controls after the current component
structure, packaging, and navigation review. No implementation is approved by this
note.

## Classification

Group controls by their interaction, not their motion style. Keep Toggles,
Switchers, Selectors, and Disclosures as the primary groups. Use a Liquid or Gooey
motion tag for the fluid examples. An Animated selectors view can be a filter or
subgroup later; it does not need a separate top-level section.

- A binary light/dark control belongs under Toggles.
- Permanently visible appearance choices belong under Switchers.
- Floating menus, swatch pickers, and radial choice menus belong under Selectors.
- Controls that expand within document flow belong under Disclosures.
- A generic action menu or speed dial belongs in the general registry unless it
  is adapted specifically for appearance or color-theme selection.

## References to review before implementation

| Reference                                                                                                | Observed interaction                                                                                                                                                                                                           | Proposed UITheme placement                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/Users/tony/Developer/Spaceman/spaceman-ui/registry/spaceman/color-theme-picker/color-theme-picker.tsx` | A floating horizontal palette menu. It supports spring entry/exit, placement correction, press-drag-release selection, arrow keys, Home/End, Escape, and a selected palette indicator. The source uses an older theme runtime. | Selectors: a Color Theme Picker. The inspected source is a spring-animated picker; do not assume it already has the same liquid deformation as the other references. |
| [Mercury Menu](https://www.crafterui.com/components/mercury-menu#code)                                   | The reference describes a trigger that swells into a dropdown, staggered rows, spring overshoot, and a liquid rim that stretches during dragging.                                                                              | Selectors: a liquid appearance or palette selector after adapting the choices to UITheme.                                                                            |
| [Mercury Dial](https://www.crafterui.com/components/mercury-dial)                                        | The reference describes a speed dial whose items emerge as droplets, spread into an arc, and stretch during dragging. Its usage example contains generic insert actions.                                                       | Selectors: a radial appearance or palette picker if adapted to theme choices. Keep generic insert actions outside UITheme.                                           |

The web reader could not retrieve the two remote pages. The built-in browser
loaded both pages. Their descriptions and the dial usage example were inspected.
The remote source and full interaction behavior still need a build-time review.

## Future implementation requirements

- Choose neutral UITheme component names. The reference product names identify
  research sources, not public APIs or component names.
- Use `uitheme-web` for theme state and page-theme transitions. Do not bring the
  older runtime from the local picker into the new controls.
- Keep local menu/icon motion separate from the page-theme transition.
- Keep the shared `cn` utility. Apply the approved component file structure.
- Use theme tokens and Tailwind classes for colors, spacing, radii, and states.
- Support keyboard selection, touch, focus return, selected-state announcements,
  reduced motion, interrupted motion, and viewport edges. Dragging must not be
  the only way to select a choice.
- Keep filters and deformation effects local to the component. Review their
  rendering cost before selecting the technique.
- Keep one canonical page per component. A motion tag must not create duplicate
  source, installation records, search entries, or documentation pages.
- Follow the current inspiration and credits instructions in `AGENTS.md` when a
  new referenced component is built. Do not add credits to existing components
  because these references were added to this backlog.
- Keep this backlog internal. Publish consumer guidance when the controls exist
  and their behavior has been verified.
