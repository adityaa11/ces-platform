Atlas UI/UX Refactor — Standalone Build
===========================================

This build fixes the sandbox/browser preview issue from the previous package.

Every HTML route now contains its CSS and JavaScript inline, so a route can be
opened directly without resolving assets/styles.css or assets/app.js.

Routes:
- index.html
- sign-in.html
- sign-up.html
- reset-password.html
- project-library.html
- main-workflow.html
- workflow-detail.html
- project-facts.html
- ces-result.html
- changes-done.html

For the best cross-route navigation experience, unzip the package and open
index.html or project-library.html from the extracted folder.
