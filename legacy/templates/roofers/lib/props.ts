// Niche prop illustration sets (see components/Props.tsx): the trade's own objects as brand-
// tintable line art (currentColor only, one stroke system). Authored + adversarially verified by
// the prop workflow (2026-07-12), then visually reviewed. An empty/missing set renders nothing.
export interface PropPath {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}
export interface PropSpec {
  viewBox: string;
  paths: PropPath[];
}

export const PROP_SETS: Record<string, Record<string, PropSpec>> = {
  "roofing": {
    "hammer": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M48.2,34.4 L54.2,24 L34.4,12.6 C26.7,6.8 16.3,10.4 10.3,20.8 C18.7,16 23.4,17.3 27.4,22.4 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M48.2,34.4 L54.2,24 L34.4,12.6 C26.7,6.8 16.3,10.4 10.3,20.8 C18.7,16 23.4,17.3 27.4,22.4 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M30,23.9 L15,49.9 Q12.6,54 15.2,55.5 Q17.8,57 20.2,52.9 L35.2,26.9",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "nail": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 47.1,9.3 L 22,37.4 L 16,48 L 25.9,40.9 L 50.9,12.7 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 47.1,9.3 L 22,37.4 L 16,48 L 25.9,40.9 L 50.9,12.7 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 43.4,6 L 54.6,16",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 53.9,10.3 L 57.4,9.8 M 49.2,6 L 49.3,2.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "shingle": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 7,8 L 57,8 Q 59,8 59,10 L 59,31 Q 59,33 57,33 L 7,33 Q 5,33 5,31 L 5,10 Q 5,8 7,8 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 5,33 L 5,49 Q 5,51 7,51 L 57,51 Q 59,51 59,49 L 59,33",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 14,33 L 14,51 M 32,33 L 32,51 M 50,33 L 50,51",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 7,8 L 57,8 Q 59,8 59,10 L 59,31 Q 59,33 57,33 L 7,33 Q 5,33 5,31 L 5,10 Q 5,8 7,8 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 23,21.5 L 23,33 M 41,21.5 L 41,33",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "plywood": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 4,30 L 40,6 L 60,20 L 24,44 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 4,30 L 40,6 L 60,20 L 24,44 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 4,30 L 4,38 L 24,52 L 60,28 L 60,20 M 24,44 L 24,52",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 18,28.9 C 25.5,25.9 30.3,18.7 38,15.5 M 21.2,32.8 C 29.5,29.2 35.1,21.5 43.6,17.8 M 27.6,34.5 C 34.6,31.8 38.8,25 46,22.3",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "gable": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 11,38 L 32,15.4 L 53,38 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 6,38 L 32,10 L 44,23 M 50,29.5 L 58,38",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 6,38 L 11,38 L 32,15.4 L 53,38 L 58,38",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 44,23 L 44,14 M 50,29.5 L 50,14 M 42,11.5 L 52,11.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 11,38 L 11,54 M 53,38 L 53,54",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 28.5,28 A 3.5,3.5 0 1 1 35.5,28 A 3.5,3.5 0 1 1 28.5,28 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "ladder": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 7.6,53.3 L 29.2,23.3 L 38.4,29.6 L 18.4,60.7 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 7.6,53.3 L 29.2,23.3 M 18.4,60.7 L 38.4,29.6",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 11.7,47.7 L 22.2,54.8 M 17.2,39.9 L 27.3,46.8 M 22.8,32.2 L 32.5,38.8",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 28.1,33.4 L 46.5,7.8 M 37,39.5 L 54.1,13",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 34.2,24.9 L 42.7,30.6 M 38.3,19.2 L 46.5,24.7 M 42.4,13.5 L 50.3,18.9",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    }
  },
  "plumbing": {
    "wrench": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M9.5 17.4 L22.2 4.6 L24.3 6.8 L20.1 13.8 L22.2 15.9 L29.3 11.7 L31.4 15.2 L29.3 21.6 L31 24.1 L26.1 29 L20.8 28.7 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M48.7 51.7 L26.1 29 L20.8 28.7 L9.5 17.4 L22.2 4.6 L24.3 6.8 L20.1 13.8 L22.2 15.9 L29.3 11.7 L31.4 15.2 L29.3 21.6 L31 24.1 L53.7 46.7 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M31.7 22 L24 29.7 M35.2 25.5 L27.5 33.2",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "pipe": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M11.5 13 L11.5 35 A21.5 21.5 0 0 0 33 56.5 L50 56.5 L50 42.5 L33 42.5 A7.5 7.5 0 0 1 25.5 35 L25.5 13 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M11.5 13 L11.5 35 A21.5 21.5 0 0 0 33 56.5 L50 56.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M25.5 13 L25.5 35 A7.5 7.5 0 0 0 33 42.5 L50 42.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M8 13 L8 8.5 L29 8.5 L29 13 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M50 39 L54.5 39 L54.5 60 L50 60 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "droplet": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M32 6 C36 15 51 27 51 39 A19 19 0 1 1 13 39 C13 27 28 15 32 6 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M32 6 C36 15 51 27 51 39 A19 19 0 1 1 13 39 C13 27 28 15 32 6 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M26.7 50.3 A12.5 12.5 0 0 1 19.9 42.2",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "valve": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M9 34 L9 54 L55 34 L55 54 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M9 34 L9 54 L55 34 L55 54 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M22 16 A10 10 0 1 1 42 16 A10 10 0 1 1 22 16 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M32 6 L32 44",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M22 16 L42 16",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "plunger": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M11.9 48.4 C17.3 36.5 26.4 33.2 35 36 C43.6 38.8 48.7 46.7 46.1 59.6 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M11.9 48.4 C17.3 36.5 26.4 33.2 35 36 C43.6 38.8 48.7 46.7 46.1 59.6 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M14.1 44.9 L46.4 55.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M32.9 35.3 L42.4 5.8 L46.6 7.2 L37.1 36.7",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "gauge": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M9.5 29 A22.5 22.5 0 1 1 54.5 29 A22.5 22.5 0 1 1 9.5 29 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M9.5 29 A22.5 22.5 0 1 1 54.5 29 A22.5 22.5 0 1 1 9.5 29 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M32 10.5 L32 15 M18.9 15.9 L22.1 19.1 M45.1 15.9 L41.9 19.1 M13.5 29 L18 29 M50.5 29 L46 29",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M32 29 L39.3 16.4",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M29.2 29 A2.8 2.8 0 1 1 34.8 29 A2.8 2.8 0 1 1 29.2 29 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M27 50.9 L27 57.5 L37 57.5 L37 50.9",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    }
  },
  "hvac": {
    "fan": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 5 32 A 27 27 0 1 1 59 32 A 27 27 0 1 1 5 32 Z",
          "fill": "currentColor",
          "opacity": 0.07
        },
        {
          "d": "M 5 32 A 27 27 0 1 1 59 32 A 27 27 0 1 1 5 32 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 26.5 32 A 5.5 5.5 0 1 1 37.5 32 A 5.5 5.5 0 1 1 26.5 32 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 28.5 25.9 C 24 20 26 12 33.5 10.5 C 38.5 9.4 43.5 12.5 44 17 C 44.4 21 40 24.5 35.5 25.9 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 38.1 28.5 C 44 24 52 26 53.5 33.5 C 54.6 38.5 51.5 43.5 47 44 C 43 44.4 39.5 40 38.1 35.5 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 35.5 38.1 C 40 44 38 52 30.5 53.5 C 25.5 54.6 20.5 51.5 20 47 C 19.6 43 24 39.5 28.5 38.1 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 25.9 35.5 C 20 40 12 38 10.5 30.5 C 9.4 25.5 12.5 20.5 17 20 C 21 19.6 24.5 24 25.9 28.5 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "thermostat": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 16.5 32 A 15.5 15.5 0 1 1 47.5 32 A 15.5 15.5 0 1 1 16.5 32 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 6 32 A 26 26 0 1 1 58 32 A 26 26 0 1 1 6 32 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 16.5 32 A 15.5 15.5 0 1 1 47.5 32 A 15.5 15.5 0 1 1 16.5 32 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 10 32 L 12.5 32 M 16.4 16.4 L 18.2 18.2 M 32 10 L 32 12.5 M 47.6 16.4 L 45.8 18.2 M 51.5 32 L 54 32",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 32 32 L 39.4 24.6",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "flame": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 37 8.5 C 38.5 16.5 50 26.5 50 37.5 C 50 48.3 42 55.5 32 55.5 C 22 55.5 14 48.3 14 37.5 C 14 30 20.5 27.6 23 20 C 24.5 15.4 31.5 13.8 37 8.5 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 37 8.5 C 38.5 16.5 50 26.5 50 37.5 C 50 48.3 42 55.5 32 55.5 C 22 55.5 14 48.3 14 37.5 C 14 30 20.5 27.6 23 20 C 24.5 15.4 31.5 13.8 37 8.5 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 35 27 C 35.8 31.5 40.5 35.5 40.5 41 C 40.5 45.8 37 48.5 32.5 48.5 C 28 48.5 24.5 45.8 24.5 41 C 24.5 37.5 27 36.3 28.3 32.7 C 29 30.5 32.5 29.5 35 27 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "snowflake": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 32 23 L 39.8 27.5 L 39.8 36.5 L 32 41 L 24.2 36.5 L 24.2 27.5 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 32 8 L 32 56 M 11.2 20 L 52.8 44 M 52.8 20 L 11.2 44",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 25.9 13.5 L 32 17 L 38.1 13.5 M 51.1 28 L 45 24.5 L 45 17.5 M 51.1 36 L 45 39.5 L 45 46.5 M 38.1 50.5 L 32 47 L 25.9 50.5 M 12.9 36 L 19 39.5 L 19 46.5 M 12.9 28 L 19 24.5 L 19 17.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "duct": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 12.5 32.5 L 25.5 32.5 L 25.5 51.5 L 12.5 51.5 Z",
          "fill": "currentColor",
          "opacity": 0.12
        },
        {
          "d": "M 8 28 L 34 13 L 56 13 L 56 41 L 30 56 L 8 56 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 8 28 L 30 28 L 30 56 M 30 28 L 56 13",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 12.5 32.5 L 25.5 32.5 L 25.5 51.5 L 12.5 51.5 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 21 20.5 L 43 20.5 L 43 48.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "filter": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 13 16 L 51 16 L 51 48 L 13 48 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 11 9 L 53 9 A 4 4 0 0 1 57 13 L 57 51 A 4 4 0 0 1 53 55 L 11 55 A 4 4 0 0 1 7 51 L 7 13 A 4 4 0 0 1 11 9 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 13 16 L 51 16 L 51 48 L 13 48 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 17 43 L 22 21 L 27 43 L 32 21 L 37 43 L 42 21 L 47 43",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    }
  },
  "dental": {
    "tooth": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 32 14 C 29 9.5 25 8.5 21 11 C 15.5 14.5 13.5 21 16 27.5 C 18.5 34 20 42 21 50 C 21.6 53 24.6 53.4 25.5 50.5 C 27 45.5 27.5 41 29.5 38.5 C 30.4 37.4 33.6 37.4 34.5 38.5 C 36.5 41 37 45.5 38.5 50.5 C 39.4 53.4 42.4 53 43 50 C 44 42 45.5 34 48 27.5 C 50.5 21 48.5 14.5 43 11 C 39 8.5 35 9.5 32 14 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 32 14 C 29 9.5 25 8.5 21 11 C 15.5 14.5 13.5 21 16 27.5 C 18.5 34 20 42 21 50 C 21.6 53 24.6 53.4 25.5 50.5 C 27 45.5 27.5 41 29.5 38.5 C 30.4 37.4 33.6 37.4 34.5 38.5 C 36.5 41 37 45.5 38.5 50.5 C 39.4 53.4 42.4 53 43 50 C 44 42 45.5 34 48 27.5 C 50.5 21 48.5 14.5 43 11 C 39 8.5 35 9.5 32 14 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "toothbrush": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 14.7 53 L 34.6 36.3 C 36.1 35 38 35.6 39.5 34.3 L 50.9 24.6 A 4.2 4.2 0 0 0 45.5 18.2 L 34.1 27.9 C 32.6 29.2 32.8 31 31.3 32.3 L 11.3 49 A 2.7 2.7 0 0 0 14.7 53 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 14.7 53 L 34.6 36.3 C 36.1 35 38 35.6 39.5 34.3 L 50.9 24.6 A 4.2 4.2 0 0 0 45.5 18.2 L 34.1 27.9 C 32.6 29.2 32.8 31 31.3 32.3 L 11.3 49 A 2.7 2.7 0 0 0 14.7 53 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 34.7 26.3 L 30.7 21.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 38.9 22.8 L 34.9 18",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 43.1 19.2 L 39.1 14.4",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "mirror": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 30 19 A 12 12 0 1 0 54 19 A 12 12 0 1 0 30 19 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 30 19 A 12 12 0 1 0 54 19 A 12 12 0 1 0 30 19 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 35.4 14.5 A 8 8 0 0 1 38.5 11.8",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 34.1 29.3 L 15 54",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "shield": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 32 9 C 25.5 12 18 13.5 12 14 C 12 26 14.5 40 32 55 C 49.5 40 52 26 52 14 C 46 13.5 38.5 12 32 9 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 32 9 C 25.5 12 18 13.5 12 14 C 12 26 14.5 40 32 55 C 49.5 40 52 26 52 14 C 46 13.5 38.5 12 32 9 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 23 31 L 29.5 37.5 L 41 24.5",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "sparkle": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 26 18 Q 29 34 45 37 Q 29 40 26 56 Q 23 40 7 37 Q 23 34 26 18 Z",
          "fill": "currentColor",
          "opacity": 0.1
        },
        {
          "d": "M 26 18 Q 29 34 45 37 Q 29 40 26 56 Q 23 40 7 37 Q 23 34 26 18 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 49 9 Q 50.3 15.7 57 17 Q 50.3 18.3 49 25 Q 47.7 18.3 41 17 Q 47.7 15.7 49 9 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 52 37 Q 53 42 58 43 Q 53 44 52 49 Q 51 44 46 43 Q 51 42 52 37 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    },
    "floss": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M 23 30 L 35 30 A 7 7 0 0 1 42 37 L 42 48 A 7 7 0 0 1 35 55 L 23 55 A 7 7 0 0 1 16 48 L 16 37 A 7 7 0 0 1 23 30 Z",
          "fill": "currentColor",
          "opacity": 0.08
        },
        {
          "d": "M 23 30 L 35 30 A 7 7 0 0 1 42 37 L 42 48 A 7 7 0 0 1 35 55 L 23 55 A 7 7 0 0 1 16 48 L 16 37 A 7 7 0 0 1 23 30 Z",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 16 37 L 42 37",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        },
        {
          "d": "M 32 30 C 32 22 36 18 43 16.5 C 50 15 53.5 11 54 6",
          "fill": "none",
          "stroke": "currentColor",
          "strokeWidth": 3
        }
      ]
    }
  }
};

import { site } from "./content";

export function setForNiche(): Record<string, PropSpec> {
  return PROP_SETS[site.niche ?? "roofing"] ?? PROP_SETS.roofing ?? {};
}

/** Stable per-niche slot: placements reference an index, each niche fills it with its own tool
 *  (roofing slot 0 = hammer; plumbing slot 0 = wrench). Server-safe. */
export function propIdByIndex(i: number): string | null {
  const ids = Object.keys(setForNiche());
  return ids[i % Math.max(1, ids.length)] ?? null;
}
