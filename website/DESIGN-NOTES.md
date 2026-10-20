# Website design research — 2026-10-21

The requested scope is a better local marketing website using AKHOO's approved
app artwork. No store, production website or app source is changed.

## References reviewed

- [Waze communities](https://www.waze.com/communities): illustration-led
  storytelling and a clear transition from product explanation to community.
- [Apple's app introduction](https://www.apple.com/newsroom/2024/02/introducing-apple-sports-a-new-app-for-sports-fans/):
  present the product inside a device, with a clear visual hierarchy.
- [21st phone-scroll component](https://preview.21st.dev/%4021st/components/phone-scroll):
  device presentation as an interactive section, not a template copied into AKHOO.

No third-party artwork, testimonials or marketing statistics were copied.

## MCP and library investigation

- [21st MCP](https://mcp.21st.dev/mcp) provides component discovery and generation.
  Its official setup requires an API key. It was researched but not connected.
- [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/) provides design
  context from Figma. It was researched but not connected; this project already
  has approved artwork and no Figma source was supplied for this task.
- The PolicyLayer precheck for `@21st-dev/magic` failed with
  `{"status":"error","error":"terminated"}`. No registry verdict was obtained.
  No MCP server or MCP client configuration was installed or modified.
- [Motion](https://motion.dev/docs/quick-start) was installed as the pinned npm
  **library**, not as an MCP server. Its `animate`, `inView` and `scroll` APIs drive
  the website transitions. The install audit reported no vulnerabilities.
- The existing browser MCP was used to inspect references and verify the local
  result, including responsive sizes and the three language directions.

## Applied changes

Larger artwork, a compact device mockup in the hero, service buttons that open an
interactive phone walkthrough, stronger section hierarchy, a larger real Three.js
gift and gentle section reveals. The demonstration is explicitly labeled and
does not submit requests or access location. Existing contact and download flows
are preserved. Approved app videos and images are reused without redesigning them.
