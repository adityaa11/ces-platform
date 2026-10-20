# IDSER-012-05-04-02 — Transient multimodal reconstruction parity

- **State:** `planned`; executable only after explicit GO and `IDSER-012-05-04-01` CK PASS.
- **Parent map:** [IDSER-012-05-04](IDSER-012-05-04-authorized-multimodal-reconstruction.md).

## Sole scope

Use the `-04-01` resolved authorized references and the same pinned shared composer/estimator/route-policy identities to reconstruct in memory the source-slot order, source specification, ordered selected-image descriptor manifest, complete canonical logical request, conservative bytes/tokens, reserved output and BSS resource demand. Compare every stored hash, measurement and identity before returning bounded verified reconstruction metadata.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0402-01` | Every valid resolved v3 handoff exactly reconstructs logical-request, source-specification and selected-media-manifest hashes, slot/order, pinned identities and input/output token, byte and resource measurements without a serialized DB request. |
| `RC-01205-0402-02` | Estimator/route-policy drift, mismatched structural envelope and every resolved-reference integrity mismatch fail closed before a result is returned. |
| `RC-01205-0402-03` | Reconstruction is transient/read-only and emits only bounded proof metadata; no provider request, hydration, grant, BSS admitted job or semantic result is produced. |
| `RC-01205-0402-04` | The future SEM consumer contract is explicit: v3 refs/hashes, selected media commitments, pinned composition identities and exact parity checks; it remains no execution authority. |

## Boundaries

No source-scope policy changes, provider runtime, transport, hydration, execution grants, BSS admission, parser/finalizer or staging. CFC/HMN is limited to reconstruction parity.
