# Local Builder preparation · v2

This is the complete runtime contract for a Manager request with `preparationVersion:2`. It replaces the global generation read set, init's cross-stage handbook and foundation documentation-page specs for **local preparation only**. Do not load Figma, library/build or consumer-docs instructions. Legacy saved jobs keep their original contract. The maintainer compiler/defaults encode the relevant SYSTEM Part C and foundation rules; `prepare-foundation-defaults.mjs` and its tests check those authoritative spec hashes. Changed contracts require regeneration/review by the maintainer, not a per-brand rewrite.

## Read and resolve

Read the trusted request and adjacent `source-pack.json` once. It covers the selected tree **and direct root files**, including knowledge and prior answers. Exact `../filename` keys refer only to listed `workspace/input/filename` files. Do not traverse any other system or execute source code. Text/HTML evidence includes source offsets (UTF-16 positions), appearance CSS facts and asset metadata; scripts, SVG geometry and embedded binary payloads remain on disk. This is extraction, not a generated summary. Images, PDF/office, unsupported/unreadable files and token inventories require native inspection or a lossless frozen import. Read original sections whenever extraction leaves meaning uncertain. Never silently exclude an unread source. No package installation is needed for a normal preparation.

The pack locks projectName, modes and Web/App/both from the saved form; they are explicit user answers. Do not ask product-type questions again when locked. A contradictory source needs a specific conflict question, not silently replacing the form choice. Latest context supersedes conflicting earlier context, newest active upload supersedes archives of that filename, and unchanged prior answers remain settled. Standing knowledge and frozen library values precede defaults. New systems use canonical collections, primitive → semantic aliases and UI-purpose descriptions; existing naming is kept unless the user chose Normalize. Do not rename frozen data during local preparation.

AI resolves product meaning, brand/status palette roles, font roles/weights, density, depth, corner character, semantic mode mappings, supported scope and genuine exceptions. Product description must come from user/input, including YOLO. Ask only unanswered/conflicting design questions in Builder. Without explicit YOLO, do not choose unresolved brand colors/fonts for the user. Suggest Inter, Geist, Plus Jakarta Sans only for an unspecified UI family. New systems include basic Standard/Reduced UI motion and Lucide utility icons. Excluding illustrative animation does not remove UI motion. Explicit static UI uses zero-motion values with a source-backed decision. Preserve selected font names; no font upload, installation, availability gate or substitution during local preparation.

## One decision file

Write `decisions.json` beside the trusted request. No executable code. Shape:

```json
{
  "format": "ds-create/foundation-decisions@1",
  "inputHash": "exact request inputHash",
  "inputRevision": 1,
  "product": {"name": "source product name", "description": "source product purpose", "platform": "Web"},
  "systemMode": "new",
  "naming": "normalize",
  "coverage": [{"path": "exact snapshot key", "hash": "exact snapshot hash", "status": "read"}],
  "decisions": [{"key": "design choice", "value": "chosen value", "decidedBy": "user", "source": "exact snapshot key"}],
  "domains": {
    "color": {"status": "included", "recipe": {}},
    "typography": {"status": "included", "recipe": {}},
    "space": {"status": "included", "recipe": {}},
    "shape": {"status": "included", "recipe": {}},
    "elevation": {"status": "included", "recipe": {}},
    "motion": {"status": "included", "recipe": {}}
  }
}
```

Use the actual revision/hash; never literal placeholder strings. Every decision needs an exact source key; AI choices additionally need `reason`. Cover every source once with path/hash and status `read`, `inspected`, `imported` or `archived` (archives only). Native inspections/imports need a note explaining what was checked. `unreadable` plus note is allowed only when returning questions, never ready. A coverage receipt attests the agent's actual source inspection; the tool validates coverage identity, not private reading behavior.

Each domain is included, or `{status:"excluded",reason,source}`. Exclusions require explicit source support. Basic new-system motion cannot be excluded. Unsupported recipe fields fail rather than disappearing. Use `extra:{collections:[],variables:[],textStyles:[],effectStyles:[],gridStyles:[]}` on a recipe for source-backed definitions beyond its supported expansion; definitions retain their metadata and pass the shared validator. New semantic definitions still need canonical names, descriptions/scopes, primitive aliases and matching WEB syntax for Web/both.

### Recipes

- **Color:** `palettes:{family:{anchors:{"50":"#…","400":"#…","800":"#…","950":"#…"},steps:[50,100,200,300,400,500,600,700,800,900,950],purpose:"product use"}}`. Pin both endpoints and every supplied brand color at its intended step. Missing intermediate steps interpolate in OKLab; exact supplied anchors are retained, including warm/cool neutral hue shifts. Use all supplied steps unchanged when a palette is frozen. No universal main-color/600 assumption. `brand` and `neutral` are role families; feedback/support families use hue names. Base white/black/transparent and alpha primitives expand automatically. `tones:{danger:"red",warning:"amber",success:"green",info:"blue",accent:"accent"}` adds only required feedback/accent families. Brand and neutral are always present; do not add unused families. `categories:["sky",…]` adds four categorical roles per chosen family. `overrides:{"color/surface/base":{"Light":"palette/neutral/50","Dark":"palette/neutral/950"}}` changes exact default semantic mappings. All override refs are full primitive names. See the small `kit/manager/foundation-defaults.json` color rows **only if choosing overrides requires the actual default mapping**. All selected modes must resolve. On-solid fill states keep readable text in both modes. Contrast failures return exact pairs for design resolution; adjust the affected mapping/palette rather than bypassing the check.
- **Typography:** `families:{ui:"chosen font",display:"optional display font",mono:"optional code font"}`, `display:true|false`, `code:true|false`. Defaults expand the spec's heading/body scale, plus display/code only when chosen. `rows:[{role:"heading",size:"lg",fontSize:24,lineHeight:32,letterSpacing:-1,weights:["regular","medium"],family:"display"},…]` replaces the entire scale for a supplied/custom scale or different weight coverage. Tracking is percent. Omit campaign-only sizes from the UI scale. `weights:{regular:"Regular",medium:"Medium",semibold:"Semi Bold",bold:"Bold"}` maps exact font style strings; never invent an unavailable weight. Compiler generates primitive/semantic variables and all bound text styles from these rows. Extra metadata/custom weight axes can use explicit definitions.
- **Space:** `{base:4}` uses the spec scale, size roles and App-only Android touch minimum. `values:{"space/md":8,…}` and `sizes:{"size/control/md":40,…}` override source-backed dimensions. `grids:[{name:"grid/mobile",grids:[…]},…]` accepts explicit lossless layout-grid definitions. Grids require platform-specific judgement; none are fabricated when unspecified. Record a source-backed layout decision explaining the chosen grid scope.
- **Shape:** `{}` uses the soft spec roles. `values:{"radius/control":8,"radius/surface":12,…}` changes chosen radius/border roles together. Different/custom roles use extra definitions.
- **Elevation:** `{treatment:"layered"}` or `{treatment:"flat"}` expands the spec shadow/focus stacks. It depends on semantic shadow/surface/focus/danger colors. Supply `styles:[{name,effects:[…]},…]` to replace the recipe for frozen/custom/tactile effects; effect colors alias semantic color roles. No backdrop blurs unless needed by scope. Effects are validated with the current color definitions after assembly.
- **Motion:** `{}` expands all five durations, four easings, three delays with Standard/Reduced behavior. Recipe timings use milliseconds: `values:{"motion/duration/base":{"Standard":200,"Reduced":0},…}` overrides a complete mode pair. The compiler converts these once to native `TIMING` seconds (`0.2`/`0`) in primitives and semantic aliases. Easing recipes accept CSS curves or native `MotionEasing` objects and compile to native `EASING`, never STRING. Explicit `extra` definitions already use native seconds/objects. Explicit static UI can set all durations to zero while retaining modes and provenance. Frozen existing FLOAT/STRING motion is preserved; already-published types need a reviewed migration. No animated illustrations/prototypes are generated here.

For an **existing** source export use top-level `frozenSource:"exact snapshot key"`, `systemMode:"existing"`, naming confirmed by user, and each included domain's `names:{variables:[…],styles:[…]}` only for noncanonical collections. Canonical domain membership is derived by Node. An object-form export is imported losslessly; six-field compact variable plans with the documented text/effect shorthand are normalized mechanically with their origin format retained. Unknown compact metadata fails and asks for a named-object export, never a metadata-dropping rewrite. Use no recipe on a frozen domain unless adding genuinely new, non-conflicting definitions. Frozen variables/styles/metadata are never changed by the compiler. Contrast problems in an unchanged frozen import are reported as warnings, preserving its approved values; added/generated definitions must pass.

If modes were not supplied by an older form, set top-level `modes:["Light","Dark"]` to the source-settled modes. The current form locks these already.

## Compile and hand off

Call `ds_create_prepare_compile` with the existing session/job/attempt/lease. The portable listener uses `{"action":"compile","job_id":"…"}` on the same stdin. Node revalidates ownership/cancel/source, expands recipes, reuses independent cached domains, validates provenance/aliases/modes/metadata and contrast, stages the artifacts and commits canonical draft/plan/ledger/answers/sources/report. Cache keys include compiler/default version, recipe and relevant modes/platform; color changes still revalidate dependent effects and contrast. No artificial token-count minimum. Counts/cache receipt are evidence of deterministic work, not AI quality or Figma success.

Correct specific compiler errors in decisions.json and compile again. Do not reload all unchanged contracts/sources, handwrite duplicate artifacts, reset state or run another agent. Finish `ready` only after compile succeeds; normal saved-proof checks run again. Init and Figma steps remain pending user review/Publish. No auto approval, Figma calls, build or consumer site. Legacy saved requests may finish through their original canonical-artifact contract.

Missing/unreadable/conflicting inputs: finish `questions` with source coverage and actual concise questions. For terminal transport write `handoff.json` beside the request, containing `{outcome:"questions",message,questions:[{id,prompt,options:[]}],coverage:[…]}`, then send `{"action":"finish-file","job_id":"…"}`. This avoids long terminal JSON lines. Ready/blocked/failed/cancelled can use the same handoff. Read acknowledgements; failures do not release the owner or prove readiness. Report meaningful public stages through the same listener and obey cancellation. Return to waiting after a successful finish; do not replay blocked/cancelled publication.
