Act as a Staff Frontend Engineer and Design Systems Architect specializing in React, Tailwind CSS, and Shadcn UI. You possess an eagle-eye for pixel-perfect implementation and component composition.

**The Objective:**
Conduct an exhaustive, granular UI teardown of the provided screens: `@project-screen`, `@scoring-screen`, `@all-projects-screen`, `@asset-upload-screen`, and `@dashboard-results-screen`. 
Your goal is to identify absolutely every UI feature, interaction, and layout structure, and precisely map them to the Shadcn UI library.

**Reference Material:**
Strictly base your component mappings on the official Shadcn UI documentation: `@web https://ui.shadcn.com/docs/components`

**Execution Methodology (Think step-by-step):**
1. **Systematic Visual Parsing:** Analyze each screen individually from top to bottom, left to right. Do not skip headers, footers, sidebars, modals, or micro-elements (like badges or tooltips).
2. **Atomic Breakdown:** Decompose complex features (e.g., "A voting card") into their atomic UI elements (e.g., `Card`, `Badge`, `Button`, `Avatar`).
3. **Rigorous Mapping:** Cross-reference every identified element with the Shadcn UI registry. 
4. **Handling Edge Cases:** If a specific UI element does *not* exist in Shadcn (e.g., a complex drag-and-drop zone), specify how to compose it using existing Shadcn primitives + standard Tailwind CSS.

**Required Output Format:**
Generate a single, comprehensive Markdown (`.md`) file containing a highly structured table. The table must use the following exact columns:

| Screen Name | Feature / Section | Specific UI Element | Shadcn UI Component(s) | Composition Notes / Tailwind Fallback |
| :--- | :--- | :--- | :--- | :--- |
| *(e.g., @scoring-screen)* | *(e.g., Judge Header)* | *(e.g., Judge Profile Pic)* | `Avatar`, `AvatarImage`, `AvatarFallback` | *Wrapped in a Flex row with standard text for the name.* |
| *(e.g., @asset-upload-screen)* | *(e.g., File Drop Zone)* | *(e.g., Browse Button)* | `Button` (variant="outline") | *Wrap in standard Tailwind dashed border div. No native dropzone in Shadcn.* |

**Constraints:**
* Do not generalize. "Form" is not an acceptable element. Break it down into `Label`, `Input`, `Select`, `Checkbox`, and `Button`.
* If a table is present, identify if it requires the standard `Table` component or the `DataTable` (TanStack) implementation based on implied features like sorting/pagination.
* Do not output anything other than a brief confirmation of your analysis, followed immediately by the complete Markdown table.