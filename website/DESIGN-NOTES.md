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

## Further exploration requested by the user

The user asked for sources outside the existing MCP tools, and for new ideas.
This pass researched different products rather than repeating 21st/Figma:

- [Magic UI MCP](https://magicui.design/docs/mcp) is an official component-context
  server. Its [Animated Beam](https://magicui.design/docs/components/animated-beam)
  demonstration suggested a visual connection between people. The website uses
  its own SVG/CSS implementation; no Magic UI source was copied.
- [React Bits](https://reactbits.dev/components/circular-gallery) suggested
  browsing scenes through an interactive gallery. AKHOO uses explicit accessible
  scenario buttons instead of an infinite gallery.
- [React Bits MCP setup](https://reactbits.dev/get-started/mcp) documents registry
  access via the shadcn MCP server, rather than a separate unofficial server.
- [Mobbin MCP](https://mobbin.com/mcp) offers real product design references and
  requires a Pro or Team plan. No plan was purchased or account connected.
- [Gojek](https://www.gojek.com/en-id) was visually reviewed for its large service
  imagery and high-contrast transitions between sections. No Gojek assets,
  statistics or text were copied.

The registry precheck for `@magicuidesign/mcp` returned
`{"status":"error","error":"terminated"}`. The check did not complete, and no
verdict is claimed. No new MCP server was connected or configuration changed.
Public documentation and demos supplied the references directly.

The new local direction puts four selectable situations in the hero. Selection
updates the artwork and caption, and carries the issue into the phone preview.
A contrasting three-step section explains the connection from requester to
helper to completing the help. Buttons jump to either demo role. The new text is
translated into Arabic, English and Hebrew, with reduced-motion behavior.

## App colors and stronger animation

At the user's request, the muted green direction was replaced with the approved
app palette. Sources: `src/lib/theme.ts`, `src/features/home/HomeScreen.web.tsx`
and `previews/home-motion/styles.css`. Primary blue is `#1768E5`, the home surface
is `#F2FBFF`, and blue-to-teal controls follow the app's dock. The reward panel
retains its gold treatment.

`brand-motion.js` owns the new interaction animations and their cleanup. Its
visibility observer enables only visible sections; page visibility and reduced
motion suspend or cancel animations. Floating and pointer-tilt transforms use
separate wrappers, so they do not overwrite each other. Scene switches use
perspective/opacity and buttons use a short press response. No animation controls
or autoplay scene rotation were added.

## Clearer narrative and purposeful icons — 2026-10-21

The latest pass responds to unclear storytelling and misplaced icons. Research:

- [NN/g: Homepage design principles](https://www.nngroup.com/articles/homepage-design-principles/)
  recommends explaining the offering immediately, using concrete examples and
  making the next action clear. Applied here: a direct explanation of roadside
  requests and nearby helpers, download as the primary action, then benefits,
  a hands-on walkthrough, the helper role, rewards and partnership information.
- [NN/g: Icon usability](https://www.nngroup.com/articles/icon-usability/)
  explains why icons need recognizable meaning and nearby text. Applied here:
  one stroke-based family, labeled service selectors attached to the scene they
  control, and location/chat/status icons next to their respective benefits.
- [Be My Eyes](https://www.bemyeyes.com/) puts a plain explanation of who it
  connects and how directly beneath its emotional headline. This informed the
  balance of human tone and concrete explanation, not any copied text, artwork,
  availability promises or statistics.

Removed floating heart/star/check decorations, ornamental orbs, giant wordmarks,
duplicate section labels and the repeated three-step introduction. The blue
section now explains three actual benefits; the phone alone teaches the steps.
The existing app illustrations, videos, interactive gift and blue/teal palette
remain. Motion is concentrated on scene changes, small illustration movement and
button feedback. Arabic, English and Hebrew carry the same factual meaning.
Scene controls inherit the document direction, including Arabic/Hebrew RTL.

The rewrite also removes superseded hero/service DOM construction and unused
journey/motion CSS. No new MCP integration, subscription or external imagery was
needed for this pass. The website stays local; only the source branch is pushed.
