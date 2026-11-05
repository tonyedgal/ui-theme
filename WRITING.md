# Documentation writing guide

Use an ASD-STE-inspired style for about 80% of the prose. This is a writing
standard for UI-Theme. It is not a formal ASD-STE100 compliance claim or a
measured percentage. Keep technical terms when a simpler word would change
the meaning.

## Write for consumers

Start with the task the reader needs to complete. Include information that helps
someone install, configure, use, customize, or troubleshoot UI-Theme. Put project
maintenance details in internal documentation.

Do not print registry revision hashes or other internal build metadata on
component pages. Explain a revision flag in the CLI reference when a reader needs
it to reproduce an installation or inspect an earlier version.

When unsure, inspect comparable framework or component documentation. Use the
pattern only when it improves the consumer's task. Keep technical detail that
supports a decision or action, and remove detail that does neither.

## Write clear instructions

- Use short sentences. Aim for 25 words or fewer when technical detail permits.
- Give each sentence one main fact or instruction.
- Use active voice. Name the person, component, or system that does the action.
- Use the same term for the same concept throughout the documentation.
- Define an unfamiliar term before using it in instructions.
- Remove filler, sales claims, and vague words.
- Use numbered steps when the order matters.
- Separate requirements, optional actions, and expected results.

## Preserve technical meaning

Keep API names, package names, framework names, commands, paths, and version
constraints exact. Do not rewrite code examples to satisfy a prose rule.
Use backticks for identifiers, flags, paths, and literal values in prose.
The website renders inline code and code blocks with Geist Mono. Other text
uses Outfit.

Use `theme` for the saved appearance preference. Use `resolvedTheme` for the
resulting light or dark appearance. Use `colorTheme` for a palette key. Keep
these concepts separate. Explain bootstrap, hydration, and persistence when
an instruction depends on them.

## Review existing documentation

Read the full page, including titles, descriptions, tables, link text, API
text, and AI Agent notes. Split long sentences where this improves clarity.
Check each instruction against the implemented behavior. Preserve limits and
unsupported cases. Do not turn a plan or a historical check into a current claim.

Keep required component sections and meaningful content in every section.
Use the MDX document as the prose source for the page and its Markdown copy.
Keep framework-specific notes inside the corresponding framework block.

Review authored guides and README files when they change. Preserve third-party
license text, generated files, changelogs, and historical verification records.
Correct those records only when the facts require a correction.

## Examples

| Avoid                                                | Use                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Wire the app-owned configuration into the provider.  | Keep settings in the app. Pass the settings to the provider.         |
| The persisted preference is subsequently resolved.   | The provider reads the saved preference and resolves the appearance. |
| Leverage the CLI to seamlessly scaffold the control. | Run the CLI to add the control’s source files.                       |
| It should work.                                      | Check that the selected palette changes the computed CSS colors.     |
