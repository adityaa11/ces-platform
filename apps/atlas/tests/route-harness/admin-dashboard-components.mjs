import { jsx } from "react/jsx-runtime";

// The route harness isolates authorization effects. Component-specific markup
// and accessibility assertions live in admin-dashboard-ui.test.mjs.
export function AdminShell({ children }) {
  return children;
}

export function DashboardWelcome({ name }) {
  return jsx("p", { children: `Welcome, ${name}.` });
}
