# CFC checkpoint — ASI-001

- **Ticket / batch:** `ASI-001` / `Admin Sign-In Phase`
- **State:** `awaiting_review`
- **Remediation base:** `57be27cbcb2c8acc05d04241b01b885eb8894738`
- **Frozen CK authority:** [ASI-001 first CK review](ASI-001-57be27cb-review.md)
- **Remediated finding:** `CK-001`, clause `CK-001.a`
- **HMN authorization consumed:** none; this is the first user-authorized CFC pass for the consolidated CK review.

## Bounded remediation

The Admin sign-in title now opts out of the application's generic `h1` ten-character maximum so `Welcome back.` uses the available compact card width rather than wrapping. A short-viewport compact rule reduces only surrounding vertical space at 600 px and below; the card, controls, labels, copy, footer content, and documented metadata omissions are preserved. No form behavior, theme-provider code, route behavior, public authentication surface, or later ASI ticket scope changed.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/atlas/app/globals.css:125` sets `.admin-sign-in-card h1 { max-width: none; }`; `:129` reduces only compact short-viewport surrounding padding. The rendered probe at `/admin/sign-in`, `390 x 844`, dark theme measured heading `top=206.75`, `bottom=242.58`, `height=35.83`, `width=304`; footer `top=784`, `bottom=844`, `height=60`; `scrollWidth=clientWidth=390`; `scrollHeight=clientHeight=844`; all inputs/buttons were within the viewport. | `pnpm --filter @atlas/app exec node --input-type=module -e "<Playwright compact rendered probe using Chrome>"` — PASS. It rendered the direct route, clicked the existing Dark theme control (`data-theme=dark`, dark `aria-pressed=true`, light `aria-pressed=false`), refreshed the route, and recorded the exact compact geometry above. | PASS: the initial 390 x 844 compact composition has the one-line heading, fully rendered non-omitted footer, usable controls, and no horizontal overflow. |

The same rendered probe additionally confirmed the preserved short compact presentation at `375 x 812` and `360 x 800`: each has `scrollWidth=clientWidth`, all controls in bounds, and its non-omitted footer ends at the viewport boundary. This is supporting direct-regression evidence; it does not extend the frozen oracle.

## Direct regressions checked

```text
pnpm --filter @atlas/app exec eslint components/AdminSignIn.tsx app/admin/sign-in/page.tsx
PASS (exit 0)

pnpm --filter @atlas/app build
PASS (exit 0; route inventory includes ? /admin/sign-in)

Rendered interaction probe at /admin/sign-in
PASS: after the existing Submit action, path remained /admin/sign-in,
password type remained password, and the status region remained hidden.
```

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint. It does not issue CK `PASS`; CK
must verify only frozen clause `CK-001.a`, this remediation diff, and any
direct regressions introduced by it.
