/**
 * Three samples in the shape Coros exports, one of them with no timestamp.
 *
 * The extensions are kept verbatim — heart rate and cadence really are in the files the sync
 * downloads, and the parser is expected to walk past them rather than trip over them.
 */
export const GPX_FILE_MOCK = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="COROS Wearables" version="1.1">
 <trk>
  <trkseg>
   <trkpt lat="47.2205832" lon="38.9222712">
    <ele>11</ele>
    <time>2026-07-26T05:01:04Z</time>
    <extensions>
     <gpxdata:hr>93</gpxdata:hr>
     <gpxdata:cadence>85</gpxdata:cadence>
    </extensions>
   </trkpt>
   <trkpt lat="47.2205549" lon="38.9222738">
    <ele>11</ele>
    <time>2026-07-26T05:01:24Z</time>
   </trkpt>
   <trkpt lat="47.2205396" lon="38.9222550">
    <ele>11</ele>
   </trkpt>
  </trkseg>
 </trk>
</gpx>`;

/** A file whose points never made it out of the watch — valid GPX, no run in it. */
export const GPX_EMPTY_MOCK = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
