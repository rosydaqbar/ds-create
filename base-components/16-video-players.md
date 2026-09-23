# Video Players

# Canvas region order

```text
Private video-control helpers
Public 16:9 video player
```

| Component set | Variant / property axes |
| --- | --- |
| `_Video volume slider handle` | Volume: 0% / 25% / 50% / 75% / 100% |
| `_Video volume slider` | State: Default / Hover |
| `_Video action button` | Type: Play / Pause / Fast backward / Fast forward / Skip backward / Skip forward / Volume none / Volume min / Volume max / Video minus / Video plus / AirPlay / Minimize 01 / Maximize 01 / Maximize 02 / Minimize 02 / Playback speed / Subtitles-CC; State: Default / Hover |
| `_Video actions bar` | Playing: False / True; Size: sm / md / lg; Timestamp indicator boolean |
| `_Video overlay action` | Paused: False / True; State: Default / Hover |
| `_Video action tooltip` | Badge: False / True |
| `Video player 16:9` | Size: sm / md / lg; Playing: False / True; Overlay action and Actions bar booleans |

Include `_Video timestamp indicator` as a standalone private helper.
