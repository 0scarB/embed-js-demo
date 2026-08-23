function assert(cond: boolean, msg = ""): void {
    if (!cond) {
        const e = new Error(msg);
        e.name = "ASSERTION FAILED"
        throw e
    }
}

function assertNotNull<T>(x: T | null, msg = ""): T {
    if (x === null) {
        const e = new Error(msg);
        e.name = `ASSERTION NOT NULL(${x})`
        throw e
    }
    return x
}

const ASPECT_RATIO = 16 / 9
const GAME_WIDTH   = 225
const GAME_HEIGHT  = 400
assert(GAME_HEIGHT / GAME_WIDTH === ASPECT_RATIO)

const BALL_RADIUS = 3
const BALL_SPEED  = 300

const PADDLE_WIDTH  = 30
const PADDLE_HEIGHT = 2*BALL_RADIUS
const PADDLE_SPEED  = 300

const BRICKS_X_SPACING = 25
const BRICKS_Y_SPACING = 10
const BRICKS_COLS      =  GAME_WIDTH  /      BRICKS_X_SPACING
const BRICKS_ROWS      = (GAME_HEIGHT / 4) / BRICKS_Y_SPACING
const BRICKS_MARGIN    = 2
const BRICK_WIDTH      = BRICKS_X_SPACING - BRICKS_MARGIN
const BRICK_HEIGHT     = BRICKS_Y_SPACING - BRICKS_MARGIN

let screenWidth  = -1
let screenHeight = -1

let ballX = GAME_WIDTH  / 2
let ballY = GAME_HEIGHT / 2
let ballDirectionX = 1 / Math.sqrt(2)
let ballDirectionY = 1 / Math.sqrt(2)

let paddleX = (GAME_WIDTH - PADDLE_WIDTH) / 2

let  moveLeftControlActive = false
let moveRightControlActive = false

let bricksCount = BRICKS_ROWS * BRICKS_COLS
const bricksPos = Array(bricksCount * 2).fill(0)
{
    let y = BRICKS_MARGIN / 2
    let i = 0
    for (let j = 0; j < BRICKS_ROWS; ++j) {
        let x = BRICKS_MARGIN / 2
        for (let k = 0; k < BRICKS_COLS; ++k) {
            bricksPos[i  ] = x
            bricksPos[i+1] = y
            i += 2
            x += BRICKS_X_SPACING
        }
        y += BRICKS_Y_SPACING
    }
}

let prevFrameTimestamp = -1.0

let gameToScreenScaleFactor = -1.0

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const canvasCtx = assertNotNull(canvas.getContext("2d"), "Canvas not supported!")

function collideBallWithRect(
    rectX: number, rectY: number,
    rectWidth: number, rectHeight: number
): boolean {
    const rMinX = rectX
    const rMaxX = rectX + rectWidth
    const rMinY = rectY
    const rMaxY = rectY + rectHeight
    if (rMinX < ballX && ballX < rMaxX) {
        const bMinY = ballY - BALL_RADIUS
        const bMaxY = ballY + BALL_RADIUS
        if (ballDirectionY < 0
            && bMinY < rMaxY && bMaxY > rMaxY
        ) {
            ballDirectionY = -ballDirectionY
            ballY = 2*rMaxY - bMinY
            return true
        }
        if (ballDirectionY > 0
            && bMaxY > rMinY && bMinY < rMinY
        ) {
            ballDirectionY = -ballDirectionY
            ballY = 2*rMinY - bMaxY
            return true
        }
    }
    if (rMinY < ballY && ballY < rMaxY) {
        const bMinX = ballX - BALL_RADIUS
        const bMaxX = ballX + BALL_RADIUS
        if (ballDirectionX < 0
            && bMinX < rMaxX && bMaxX > rMaxX
        ) {
            ballDirectionX = -ballDirectionX
            ballX = 2*rMaxX - bMinX
            return true
        }
        if (ballDirectionX > 0
            && bMaxX > rMinX && bMinX < rMinX
        ) {
            ballDirectionX = -ballDirectionX
            ballX = 2*rMinX - bMaxX
            return true
        }
    }
    return false
}

function update(frameTimestamp: number) {
    // Calculate change in time since last frame
    if (prevFrameTimestamp === -1.0)
        prevFrameTimestamp = frameTimestamp
    const dt = (frameTimestamp - prevFrameTimestamp) * 0.001
    prevFrameTimestamp = frameTimestamp

    // Move paddle
    if (moveLeftControlActive)
        paddleX -= PADDLE_SPEED*dt
    if (moveRightControlActive)
        paddleX += PADDLE_SPEED*dt
    // Clamp paddle within screen bounds
    if (paddleX < -PADDLE_WIDTH/2)
        paddleX = -PADDLE_WIDTH/2
    if (paddleX > GAME_WIDTH - PADDLE_WIDTH/2)
        paddleX = GAME_WIDTH - PADDLE_WIDTH/2

    // Move ball
    ballX += ballDirectionX*BALL_SPEED*dt
    ballY += ballDirectionY*BALL_SPEED*dt
    // Collide ball with bricks
    for (let i = 0; i < bricksCount * 2; i += 2) {
        if (collideBallWithRect(bricksPos[i], bricksPos[i+1],
                                BRICK_WIDTH, BRICK_HEIGHT)
        ) {
            // Mark brick for removal
            bricksPos[i] = -1
        }
    }
    // Remove bricks that the ball collided with
    let i = 0;
    for (let j = 0; j < bricksCount * 2; j += 2) {
        if (bricksPos[j] !== -1) {
            bricksPos[i  ] = bricksPos[j  ]
            bricksPos[i+1] = bricksPos[j+1]
            i += 2
        }
    }
    bricksCount = i / 2
    // Collide ball with paddle
    collideBallWithRect(paddleX, GAME_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT)
    // Collide ball with top wall
    collideBallWithRect(-1024, -1024, 1024+GAME_WIDTH+1024, 1024)
    // Collide ball with left wall
    collideBallWithRect(-1024, -1024, 1024, 1024 + 2*GAME_HEIGHT + 1024)
    // Collide ball with right wall
    collideBallWithRect(GAME_WIDTH, -1024, 1024, 1024 + 2*GAME_HEIGHT + 1024)
    // Collide ball with bottom wall
    collideBallWithRect(-1024, 2*GAME_HEIGHT, 1024+GAME_WIDTH+1024, 1024)
}

function render() {
    // Clear screen
    canvasCtx.clearRect(0, 0, screenWidth, screenHeight)

    canvasCtx.fillStyle = "#FFF"

    // Draw paddle
    canvasCtx.fillRect(
        paddleX * gameToScreenScaleFactor,
        (GAME_HEIGHT - PADDLE_HEIGHT) * gameToScreenScaleFactor,
        PADDLE_WIDTH * gameToScreenScaleFactor,
        PADDLE_HEIGHT * gameToScreenScaleFactor,
    )

    // Draw bricks
    for (let i = 0; i < bricksCount * 2; i += 2) {
        const x = bricksPos[i]
        const y = bricksPos[i+1]
        canvasCtx.fillRect(x * gameToScreenScaleFactor, y * gameToScreenScaleFactor,
                           BRICK_WIDTH  * gameToScreenScaleFactor,
                           BRICK_HEIGHT * gameToScreenScaleFactor)
    }

    // Draw ball
    canvasCtx.beginPath()
    canvasCtx.arc(ballX * gameToScreenScaleFactor, ballY * gameToScreenScaleFactor,
                  BALL_RADIUS*gameToScreenScaleFactor,
                  0, 2*Math.PI)
    canvasCtx.fill()
}

function resize() {
    const bodyWidth  = document.body.clientWidth
    const bodyHeight = document.body.clientHeight

    if (bodyWidth * ASPECT_RATIO > bodyHeight) {
        screenHeight = bodyHeight
        screenWidth  = Math.floor(screenHeight / ASPECT_RATIO)
        gameToScreenScaleFactor = screenHeight / GAME_HEIGHT
    } else {
        screenWidth  = bodyWidth
        screenHeight = Math.floor(screenWidth * ASPECT_RATIO)
        gameToScreenScaleFactor = screenWidth / GAME_WIDTH
    }

    canvas.width  = screenWidth
    canvas.height = screenHeight
    canvas.style.width  = screenWidth +"px"
    canvas.style.height = screenHeight+"px"

    render()
}
resize();
window.onresize = resize

window.onkeydown = (event: KeyboardEvent) => {
    switch (event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
            moveLeftControlActive = true;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            moveRightControlActive = true;
            break;
    }
}
window.onkeyup = (event: KeyboardEvent) => {
    switch (event.key) {
        case "ArrowLeft":
        case "A":
        case "a":
            moveLeftControlActive = false;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            moveRightControlActive = false;
            break;
    }
}

function gameLoop(frameTimestamp: number) {
    update(frameTimestamp);
    render();
    requestAnimationFrame(gameLoop)
}
requestAnimationFrame(gameLoop)

