# Helpers v6 sources (final approved set, 27 Oct 2026)

Python sources of the six helpers (geometry + motion). `export_web_v6.py` writes
`src/components/helpers/rig.generated.ts`, `src/components/helpers/helpers.css` and the brand-kit
downloads in `public/brand-kit/helpers/`. Needs Python 3 with cairosvg, Pillow, numpy and scipy:

    python3 export_web_v6.py /path/to/mimi-website

The motion sheet and the lineup video are built with `make_motion_v6.py html | frames A B | encode`
(writes next to the scripts). The full working set, sheets, checks and PDF live outside the repo in
mimi-helpers/v6/. The export also copies lineup.mp4, states.png, expressions.png and
HELPERS-SYSTEM.pdf from that folder, so run it from there.
