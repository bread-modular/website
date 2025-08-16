---
title: Input/Output Metadata
summary: How to define and render input/output specifications in module documentation.
---

The Bread Modular website supports structured input/output metadata for modules. This allows for consistent, ordered, and well-documented I/O specifications that can be rendered anywhere in the module documentation.

## Metadata Structure

In your module's markdown frontmatter, define inputs and outputs as arrays with shortname and description fields:

```yaml
---
title: Your Module
description: Module description
inputs:
  - shortname: "Audio In"
    description: "Main audio input signal"
  - shortname: "CV In"
    description: "Control voltage input for modulation"
  - shortname: "Gate"
    description: "Gate/trigger input"
outputs:
  - shortname: "Audio Out"
    description: "Processed audio output signal"
  - shortname: "CV Out"
    description: "Control voltage output"
---
```

## Rendering I/O Sections

Use the `[io/]` symbol anywhere in your module content to render the input/output section:

```markdown
This module processes audio signals through various filters.

[io/]

## Additional Features

More content here...
```

## Key Features

- **Ordered Lists**: Both inputs and outputs are automatically numbered in order
- **Structured Data**: Each I/O has a shortname and detailed description  
- **Responsive Design**: The I/O section adapts to different screen sizes
- **Consistent Styling**: Matches the overall site design and typography

## Example Output

The `[io/]` symbol will render as a two-column grid (single column on mobile):

- **Inputs** column with numbered list of all inputs
- **Outputs** column with numbered list of all outputs  
- Each item shows the shortname prominently with the description below
- Clean, professional styling with proper spacing and typography

## Migration from Legacy Format

Old format:
```markdown
## Inputs
1. Audio In
2. CV In  
3. Gate

## Outputs
1. Audio Out
2. CV Out
```

New format:
```yaml
inputs:
  - shortname: "Audio In"
    description: "Main audio input signal"
  - shortname: "CV In" 
    description: "Control voltage input for modulation"
  - shortname: "Gate"
    description: "Gate/trigger input"
outputs:
  - shortname: "Audio Out"
    description: "Processed audio output signal"
  - shortname: "CV Out"
    description: "Control voltage output"
```

Then use `[io/]` in content where you want it rendered.
