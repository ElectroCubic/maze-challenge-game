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

*/

const LEVELS = [
    {
        energy: 20,
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

        specials: {}
    },

    {
        energy: 20,
        pickup: 10,

        map: `
#######
#S....#
#.###.#
#...T.#
###...#
#....E#
#######
    `,

        specials: {}
    },

    {
        energy: 20,
        pickup: 10,

        map: `
############
#T........S#
#..........#
#..........#
#..........#
#..........#
#.....######
#.....######
#.....######
#.....######
#E....######
############
    `,

        specials: {}
    },

    {
        energy: 20,
        pickup: 20,

        map: `
############
#.......E..#
#..........#
#T###.######
#.#.....+..#
#.######.###
#.#........#
#.###.######
#.#........#
#.########.#
#.....S....#
############
        `,

        specials: {}
    },
];
