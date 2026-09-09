/*
GAME ENGINE
*/

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
    const level =
        currentLevelIndex === -1
            ? SECRET_LEVEL
            : LEVELS[currentLevelIndex];

    return level.specials?.[key(r, c)] || null;
}

function wall(r, c) {
    if (
        r < 0 ||
        r >= height ||
        c < 0 ||
        c >= width
    ) {
        return true;
    }

    return grid[r][c] === "#";
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

            // Border Rendering Logic

            const isHidden = value === "H" || value === "O";

            if (!isHidden) {
                if (r === 0 || grid[r - 1]?.[c] === "H" || grid[r - 1]?.[c] === "O") {
                    cell.classList.add("maze-border-top");
                }

                if (r === height - 1 || grid[r + 1]?.[c] === "H" || grid[r + 1]?.[c] === "O") {
                    cell.classList.add("maze-border-bottom");
                }

                if (c === 0 || grid[r]?.[c - 1] === "H" || grid[r]?.[c - 1] === "O") {
                    cell.classList.add("maze-border-left");
                }

                if (c === width - 1 || grid[r]?.[c + 1] === "H" || grid[r]?.[c + 1] === "O") {
                    cell.classList.add("maze-border-right");
                }
            }

            if (value === "#") {
                cell.classList.add("wall");
            }
            else if (value === "H") {
                cell.classList.add("hidden-path");
            }
            else if (value == "O") {
                cell.classList.add("hidden-exit");
                cell.textContent = "⚑";
            }
            else if (value == "F") {
                cell.classList.add("fake-wall");
            }
            else {
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

                if (value === "+" && !collectedPickups.has(key(r, c)))
                {
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

    

    if (energyFinished) {
        $("level-number").textContent = "OUT OF ENERGY!";
    }
    else if (gameOver) {
        $("level-number").textContent = "LEVEL COMPLETED!";
    }
    else if (currentLevelIndex === -1) {
        $("level-number").textContent = "LEVEL ???";
    }
    else {
        $("level-number").textContent =
            "LEVEL " + String(currentLevelIndex + 1);
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

    if (grid[player.r][player.c] === "O") {
        loadSecretLevel();
        return;
    }

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

    // Secret level ending
    if (currentLevelIndex === -1) {
        showWinScreen(true);
        return;
    }

    // Normal level ending
    if (currentLevelIndex < LEVELS.length - 1) {
        showNextLevel();
    }
    else {
        showWinScreen(false);
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

function loadSecretLevel() {
    const level = SECRET_LEVEL;

    rows = level.map
        .trim()
        .split("\n")
        .map(r => r.replace(/\r$/, ""));

    height = rows.length;
    width = rows[0]?.length || 0;

    if (!height || !width) {
        throw new Error("Secret level is empty.");
    }

    if (!rows.every(r => r.length === width)) {
        throw new Error("Secret level has inconsistent row widths.");
    }

    grid = rows.map(r => r.split(""));

    startEnergy = level.energy ?? 100;
    pickupAmount = level.pickup ?? 10;

    currentLevelIndex = -1;

    resetLevel();
}

function showWinScreen(secret) {
    const title = $("win-title");
    const message = $("win-message");

    if (secret) {
        title.textContent = "YOU REALLY ESCAPED.";

        message.innerHTML =
            "You found something that wasn't<br>" +
            "supposed to be found.";
    }
    else {
        title.textContent = "YOU ESCAPED!";

        message.innerHTML =
            "You found the treasure.<br>" +
            "<em>But did you find everything?</em>";
    }

    $("win-screen").classList.add("show");
}

function hideWinScreen() {
    $("win-screen").classList.remove("show");
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

$("win-restart").addEventListener(
    "click",
    () => {
        hideWinScreen();
        loadLevel(0);
    }
);

loadLevel(currentLevelIndex);