/*
LEVEL EDITOR
Edit LEVELS to create/add levels.

Map symbols:
# wall
. path
S start
T treasure
E exit
+ energy pickup
R red tile
G green tile
Y yellow tile
B blue tile

Every row in a map must have the same width.

specials use zero-based "row,column" coordinates:
"2,4": { type:"red", dir:"↑" }

You can add as many level objects as you want.
*/

const LEVELS = [
    {
        energy: 100,
        pickup: 10,

        map: `
#######
#S....#
#.....#
#..T..#
#.....#
#....E#
#######
`,

        specials: {
            // "2,4": { type:"red", dir:"↑" }
        }
    },

    {
        energy: 100,
        pickup: 10,

        map: `
#########
#S......#
#.#####.#
#.....+.#
#.###.#.#
#...T.#E#
#########
`,

        specials: {
            // "2,5": { type:"green", dir:"↓" }
        }
    }
];
