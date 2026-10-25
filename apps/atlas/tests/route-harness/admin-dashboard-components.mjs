import { jsxs, jsx } from "react/jsx-runtime";

// The route harness keeps client-only interactions out of the server-route
// test while retaining the identity-bearing render boundaries that the route
// supplies. Component-specific layout and accessibility assertions live in
// admin-dashboard-ui.test.mjs.
export function AdminShell({ children, name }) {
  return jsxs("div", {
    "data-route-harness": "admin-shell",
    children: [
      jsx("header", { children: jsx("span", { "aria-label": `${name} avatar`, children: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() }) }),
      children,
      jsx("footer", { children: jsx("strong", { children: name }) }),
    ],
  });
}

export function DashboardWelcome({ name }) {
  return jsx("p", { children: `Welcome, ${name}.` });
}
