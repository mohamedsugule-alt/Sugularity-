# Third-party Claude Code skills

Vendored from upstream on 2026-11-14. Each repo was reviewed before copying.
Only the skill folders were copied: the plugins' auto-run hooks, MCP servers
and webhook/telemetry config were left out on purpose.

| Skill folder | Upstream repo | Commit | License | Extra requirements |
|---|---|---|---|---|
| ponytail, ponytail-* | DietrichGebert/ponytail | 96608e0 | MIT | none |
| hallmark | Nutlope/hallmark | 04977e1 | MIT | Node; optional TOGETHER_API_KEY for image generation (installers + edit hook removed) |
| humanizer | blader/humanizer | b48c832 | MIT | none |
| impeccable | pbakaus/impeccable | 1995764 | Apache-2.0 | Node for the detector scripts |
| rea | morluto/rea (reverse-engineer-anything) | 9e24b36 | MIT | `npx -y rea-agents` at use time |
| graphify | Graphify-Labs/graphify | 52cb282 | Apache-2.0 | `pip install graphifyy` |
| taste | senlindesign/taste-skill | 6dce223 | none stated | Playwright MCP |
| scrapling | D4Vinci/Scrapling | bb223f2 | BSD-3-Clause | `pip install "scrapling[all]>=0.5.1"` |
| diagram-design | cathrynlavery/diagram-design | f6db0de | MIT | none |

To update one, re-copy its skill folder from the upstream repo.
