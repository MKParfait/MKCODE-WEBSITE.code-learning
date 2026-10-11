# MKCode — Learn. Build. Create.

A responsive, multi-page coding-learning website built with HTML, CSS, and vanilla JavaScript.

## Pages
- `index.html` — Home and getting-started guide
- `courses.html` — searchable/filterable learning paths, lessons, exercises, and course FAQ
- `playground.html` — HTML/CSS/JavaScript editor and isolated preview
- `features.html` — feature descriptions and customization information
- `about.html` — mission and learning approach
- `contact.html` — contact form and guidance

All navigation links open the selected page in the **same browser tab**.

## Personalization
- Default appearance: **Light**
- Presets: Light, Dark, Midnight, Purple, and Forest
- Custom accent color, font family, text size, rounded/square corners, and soft/crisp interface styles
- Preferences persist across pages in the same browser using `localStorage`
- Reset returns to the default light theme

## Run locally
Open the `MKCode` folder in VS Code and use Live Server, or open `index.html` in a browser. No build step or backend is required for this static version.

## Contact form note
The contact form opens the visitor's configured email app and prepares a message to `parfaitmurindangabo@gmail.com`. The visitor must press Send in their email app. Direct server-side email delivery requires a backend or form service.

## Learning tools and limitations
- Courses cover HTML, CSS, JavaScript, Python, and Git/GitHub.
- Lesson completion is stored locally in the current browser and is not synchronized between devices.
- The playground runs HTML, CSS, and JavaScript in a sandboxed iframe; it does not run Python or Git commands.
- Google Fonts are loaded online, with local fallback fonts.
