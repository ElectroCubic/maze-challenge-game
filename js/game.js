/*
GAME ENGINE
*/

const TEST_LEVEL = 10;

if (TEST_LEVEL < 1 || TEST_LEVEL > LEVELS.length) {
    throw new Error("Invalid TEST_LEVEL.");
}

const DIRS = {
    up: {
        dr: -1,
        dc: 0,
        opposite: "down"
    },
    down: {
        dr: 1,
        dc: 0,
        opposite: "up"
    },
    left: {
        dr: 0,
        dc: -1,
        opposite: "right"
    },
    right: {
        dr: 0,
        dc: 1,
        opposite: "left"
    }
};

let currentLevelIndex = 0;

let rows = [];
let grid = [];
let height = 0;
let width = 0;

let player = null;

let energy = 0;
let startEnergy = 100;
let pickupAmount = 10;

let hasTreasure = false;
let bluePending = null;

let collectedPickups = new Set();

let gameOver = false;
let energyFinished = false;

const $ = id => document.getElementById(id);

function key(r, c) {
    return `${r},${c}`;
}

function arrowDirection(a) {
    return {
        "↑": "up",
        "↓": "down",
        "←": "left",
        "→": "right"
    }[a] || null;
}

function findCell(symbol) {
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (grid[r][c] === symbol) {
                return {
                    r,
                    c
                };
            }
        }
    }

    return null;
}

function specialAt(r, c) {
    return LEVELS[currentLevelIndex].specials?.[key(r, c)] || null;
}

function wall(r, c) {
    return (
        r < 0 ||
        r >= height ||
        c < 0 ||
        c >= width ||
        grid[r][c] === "#"
    );
}

function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) {
        return;
    }

    currentLevelIndex = index;

    const level = LEVELS[index];

    rows = level.map.trim().split("\n").map(r => r.replace(/\r$/, ""));

    height = rows.length;
    width = rows[0]?.length || 0;

    if (!height || !width) {
        throw new Error(`Level ${index + 1} is empty.`);
    }

    if (!rows.every(r => r.length === width)) {
        const bad = rows.findIndex(
            r => r.length !== width
        );

        throw new Error(
            `Level ${index + 1}: row ${bad + 1} has ${rows[bad].length} columns; expected ${width}.`
        );
    }

    grid = rows.map(r => r.split(""));

    startEnergy = level.energy ?? 100;
    pickupAmount = level.pickup ?? 10;

    resetLevel();
}

function resetLevel() {
    player = findCell("S");

    if (!player) {
        throw new Error(
            `Level ${currentLevelIndex + 1} has no S.`
        );
    }

    if (!findCell("T")) {
        throw new Error(
            `Level ${currentLevelIndex + 1} has no T.`
        );
    }

    if (!findCell("E")) {
        throw new Error(
            `Level ${currentLevelIndex + 1} has no E.`
        );
    }

    energy = startEnergy;
    hasTreasure = false;
    bluePending = null;

    collectedPickups = new Set();

    gameOver = false;
    energyFinished = false;

    document
        .querySelectorAll("#next-level")
        .forEach(button => button.remove());

    render();
}

function render() {
    const maze = $("maze");

    maze.innerHTML = "";

    maze.style.setProperty(
        "--maze-width",
        width
    );

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            const cell = document.createElement("div");
            const value = grid[r][c];

            cell.className = "cell";

            if (value === "#") {
                cell.classList.add("wall");
            } else {
                cell.classList.add("path");

                if (value === "S") {
                    cell.classList.add("start");
                    cell.textContent = "S";
                }

                if (value === "E") {
                    cell.classList.add("exit");
                    cell.textContent = "⚑";
                }

                if (value === "T") {
                    if (hasTreasure) {
                        cell.classList.add("collected");
                    } else {
                        cell.classList.add("treasure");
                        cell.textContent = "💎";
                    }
                }

                if (
                    value === "+" &&
                    !collectedPickups.has(key(r, c))
                ) {
                    cell.classList.add("energy-pickup");
                    cell.textContent = "⚡";
                }

                const special = specialAt(r, c);

                if (special)
                {
                    cell.classList.remove("path");

                    cell.classList.add(
                        "special-" + special.type
                    );

                    cell.textContent = special.dir;
                }
            }

            if (player && player.r === r && player.c === c)
            {
                cell.classList.add("player");
                cell.textContent = "";
            }

            maze.appendChild(cell);
        }
    }

    $("energy").textContent = energy;

    const treasureElement = $("treasure");

    treasureElement.textContent =
        hasTreasure ? "✓" : "✗";

    treasureElement.className =
        hasTreasure
            ? "treasure-complete"
            : "treasure-missing";

    

    if (energyFinished) 
    {
        $("level-number").textContent = "OUT OF ENERGY!";
    } 
    else if (gameOver) 
    {
        $("level-number").textContent = "LEVEL COMPLETED!";
    } 
    else 
    {
        $("level-number").textContent = "LEVEL " + String(currentLevelIndex + 1);
    }

    const energyPercentage = (energy / startEnergy) * 100;

    $("energy-fill").style.width = `${energyPercentage}%`;
}

function move(input) {
    if (gameOver) {
        return;
    }

    if (energy <= 0) {
        lose();
        return;
    }

    let direction = input;
    let freeYellowMove = false;

    if (bluePending)
    {
        direction = bluePending;
        bluePending = null;
    }
    else
    {
        const special = specialAt(
            player.r,
            player.c
        );

        // Red blocked movement costs energy.
        if (special && special.type === "red" &&
            input === arrowDirection(special.dir))
        {
            energy--;

            render();

            if (energy <= 0) {
                lose();
            }

            return;
        }

        // Yellow inversion is free.
        if (special &&special.type === "yellow")
        {
            const d = arrowDirection(special.dir);

            if (input === d) {
                direction = DIRS[input].opposite;
                freeYellowMove = true;
            }
        }
    }

    const d = DIRS[direction];

    if (!d) {
        return;
    }

    const nr = player.r + d.dr;
    const nc = player.c + d.dc;

    // Walls cost nothing.
    if (wall(nr, nc)) {
        render();
        return;
    }

    // Normal valid movement costs 1.
    // Yellow inversion costs 0.
    if (!freeYellowMove) {
        energy--;
    }

    player = {r: nr, c: nc};

    handleTile();

    if (gameOver) {
        render();
        return;
    }

    render();

    if (energy <= 0) {
        lose();
    }
}

function handleTile() {
    const special = specialAt(
        player.r,
        player.c
    );

    if (
        grid[player.r][player.c] === "T" &&
        !hasTreasure
    ) {
        hasTreasure = true;
    }

    if (
        grid[player.r][player.c] === "+" &&
        !collectedPickups.has(
            key(player.r, player.c)
        )
    ) {
        collectedPickups.add(
            key(player.r, player.c)
        );

        energy = Math.min(
            startEnergy,
            energy + pickupAmount
        );
    }

    if (
        special &&
        special.type === "green"
    ) {
        const direction =
            arrowDirection(special.dir);

        const d = DIRS[direction];

        const nr = player.r + d.dr;
        const nc = player.c + d.dc;

        if (!wall(nr, nc)) {
            player = {
                r: nr,
                c: nc
            };

            handleTile();
        }
    }

    if (
        special &&
        special.type === "blue"
    ) {
        bluePending =
            arrowDirection(special.dir);
    }

    if (
        grid[player.r][player.c] === "E"
    ) {
        if (hasTreasure) {
            completeLevel();
            return;
        }
    }
}

function completeLevel() {
    gameOver = true;

    if (currentLevelIndex < LEVELS.length - 1) {
        showNextLevel();
    }
}

function showNextLevel() {
    const existing = $("next-level");

    if (existing) {
        return;
    }

    const button = document.createElement("button");

    button.id = "next-level";
    button.className = "reset";
    button.textContent = "Next Level →";

    button.addEventListener("click", () => {
        loadLevel(currentLevelIndex + 1);
    });

    document
        .querySelector(".game")
        .appendChild(button);
}

function lose() {
    if (energyFinished) {
        return;
    }

    energyFinished = true;
    gameOver = true;

    render();
}

document.addEventListener(
    "keydown",
    event => {
        const keys = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",

            w: "up",
            W: "up",

            s: "down",
            S: "down",

            a: "left",
            A: "left",

            d: "right",
            D: "right"
        };

        const direction = keys[event.key];

        if (direction) {
            event.preventDefault();
            move(direction);
        }
    }
);

document
    .querySelectorAll(".control[data-dir]")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => move(button.dataset.dir)
        );
    });

$("reset").addEventListener(
    "click",
    resetLevel
);

loadLevel(TEST_LEVEL - 1);