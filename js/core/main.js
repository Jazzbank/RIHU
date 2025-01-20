var player = {
    // hyp is the hyperoperation. 1 represents addition, 2 represents multiplication, 3 represents exponentiation, and so on. Based on whatever this number is, the game loads things differently. This is a reset that resets the ENTIRE game.

    hyp: 1,
}

const RINGS = 8
const FPS = 20

var arcColors = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 60%)`)
var arcColorsSec = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 10%)`)
var arcColorsTer = Array.from({length: RINGS}, (_, i) => `hsl(${360 / RINGS * i}, 100%, 40%)`)

var mainCanvas = document.getElementById("mainCanvas")
mainCanvas.width = document.getElementById("mainCanvasDiv").style.width.replace('px', '')
mainCanvas.height = document.getElementById("mainCanvasDiv").style.height.replace('px', '')

function loadData() {
        // <button class="lapBtn">Circle X<br>Lap speed: {lapspeed} → (after)<br>Cost: x</button>
    // For now, the game has no saving.

    for (let i = 0; i < RINGS; i++) {
        document.getElementById("lapUpgrades").innerHTML += `<button class="lapBtn" id="lapBtn${i + 1}" onclick="upgradeCircle(${i})" style="color: ${arcColors[i]}; border-color: ${arcColors[i]}; background-color: ${arcColorsSec[i]};"><span style="font-size: 24px;">Circle ${i + 1} [Level <span id="lap${i + 1}Level">y</span>]</span><br>Lap speed: <span id="lapBtn${i + 1}Current">x</span> → <span id="lapBtn${i + 1}Next">y</span><br>Costs <span id="lapBtn${i + 1}Cost">z</span> points</button>`
    }

    let lapBtns = document.getElementsByClassName("lapBtn")

    if (player.hyp == 1) {
        let initRingPrices = Array.from({length: RINGS}, (_, x) => (x == 0) ? 10 : 1000/15 * Math.pow(15, x))
        let initRingSpeeds = Array.from({length: RINGS}, (_, x) => Math.max(0.2 - 0.015 * x, 0.1))
        let initRingEffects = Array.from({length: RINGS}, (_, x) => Math.pow(10, x))
        let initPriceScalings = Array.from({length: RINGS}, (_, x) => 1.3 + x * 0.05)
        let initLevelBases = Array.from({length: RINGS}, (_, x) => Math.max(0.1 - 0.015 * x, 0.01))

        let prestigeUpgrades = [
            // [desc, price, bought]. id corresponds to p{row}{column}
            ["Double all laps/sec.", ],
            ["Triple all ring multipliers."],
            ["Boost ring multiplie based<br>on laps this prestige.<br>1 + 0.0001x"],
            [""]
        ]

        Object.assign(player, {points: 0, prestige: {
            points: 0,
            unlocked: false,
            upgrades: {
                cols: 3,
                rows: 3,
                rowMults: [2, 10, 100] // By how much the same upgrades in a row increase by
            }
        }, delta: Date.now()}) // pPoints - Prestige points (soon...)
        // Every 5 levels, 1.3x boost to laps/sec?
        
        for (let i = 0; i < RINGS; i++) {
            Object.assign(player, 
                {["r" + (i+1)]: {
                    price: initRingPrices[i],
                    priceInit: initRingPrices[i],
                    priceScale: initPriceScalings[i],
                    level: 0,
                    levelBase: initLevelBases[i],
                    speed: initRingSpeeds[i],
                    speedInit: initRingSpeeds[i],
                    laps: 0,
                    lapsCeil: 1, // This is used to run the revComplete function every turn, along with laps. See comment in the mainLoop() function.
                    progress: 0,
                    effectBase: initRingEffects[i],
                    effect: 0,
                    unlocked: (i == 0) ? true : false,
                    unlockedUpgrade: (i == 0) ? true : false,
                    buttonStyle: `color: ${arcColors[i]}; border-color: ${arcColors[i]}; background-color: ${arcColorsSec[i]};`,
                }}
            )
        }
    }

    for (let i = 0; i < lapBtns.length; i++) {
        lapBtns[i].addEventListener("mouseenter", (e) => {
            if (player.points >= player[`r${i + 1}`].price) {
                e.target.style.color = arcColorsSec[i]
                e.target.style.cursor = "pointer"
                e.target.style.backgroundColor = arcColorsTer[i]
            }
        })

        lapBtns[i].addEventListener("mouseleave", (e) => {
            if (player.points >= player[`r${i + 1}`].price) {
                e.target.style.color = arcColors[i]
                e.target.style.backgroundColor = arcColorsSec[i]
            }
        })
    }
}

loadData()

function upgradeCircle(n) {
    if (player.points >= player[`r${n + 1}`].price) {
        player.points -= player[`r${n + 1}`].price
        player[`r${n + 1}`].level += 1
    }
}

function formatNormal(num, sig = 0) {
    // type 1 - below 1e12: comma formatted integer, else scientific notation
    // type 2 - below 1,000: float with 2 decimals, below 1e12: comma formatted integer, else scientific notation 
    num = (new ExpantaNum(num) === num) ? num.toNumber() : num

    if (num >= 1e12) {
        return num.toExponential(2).replace('+', '')
    } else if (num >= 1000) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } else {
        return num.toFixed(sig)
    }
}

function formatEN(num) {
    num = (new ExpantaNum(num) === num) ? num : new ExpantaNum(num)
    return num.toFixed(2)
}

function pointGen() {
    let effectSum = 0
    let lapsSum = 0

    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]

        if (ringData.unlocked) {
            effectSum += ringData.effect
            lapsSum += ringData.speed
        }
    }

    return new ExpantaNum(effectSum * lapsSum)
}

function revComplete(ring, mult) {
    if (player.hyp == 1) {
        var effectSum = 0

        for (let i = 0; i < RINGS; i++) {
            let ringData = player[`r${i + 1}`]

            if (ringData.unlocked) {
                effectSum += ringData.effect
            }
        }

        player.points += effectSum * mult
    }
}

function updateFormula() { // Yes... all this just to update that formula.
    let formulaText = 'Let '
    let formulaLetterFont = "CMU Serif"
    let formulaLetterSize = "20px"
    let formulaLetters = Array.from({length: RINGS}, (_, i) => 65 + i).map(n => String.fromCharCode(n))
    let effectSum = 0

    for (let i = 0; i < RINGS; i++) {
        effectSum += player["r" + (i + 1)].effect
    }

    for (let i = 0; i < formulaLetters.length; i++) {
        switch (i) {
            case 6: {
                formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formulaLetters[i]}</span> and `
                break
            }

            case 7: {
                formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formulaLetters[i]}</span>`
                break

            }

            default: {
                formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formulaLetters[i]}</span>, `
            }
        }
    }

    formulaText += " represent the amount of laps of each circle.<br><br>Your points per lap is:<br>"

    if (player.hyp == 1) {
        for (let i = 0; i < formulaLetters.length; i++) {
            switch (i) {
                case 7: {
                    formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formatNormal(player["r" + (i + 1)].effectBase)}${formulaLetters[i]}</span><br>`
                    break
    
                }
    
                default: {
                    formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formatNormal(player["r" + (i + 1)].effectBase)}${formulaLetters[i]}</span> + `
                }
            }
        }
    }

    if (player.hyp == 1) {
        for (let i = 0; i < formulaLetters.length; i++) {
            switch (i) {
                case 7: {
                    formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formatNormal(player["r" + (i + 1)].effectBase)}(${formatNormal(player["r" + (i + 1)].lapsCeil - 1)})</span> = ${formatNormal(effectSum)} `
                    break
                }
    
                default: {
                    formulaText += `<span style="font-family: ${formulaLetterFont}; font-size: ${formulaLetterSize}; color: ${arcColors[i]}">${formatNormal(player["r" + (i + 1)].effectBase)}(${formatNormal(player["r" + (i + 1)].lapsCeil - 1)})</span> + `
                }
            }
        }
    }


    return formulaText
}

function update() {
    let c = mainCanvas.getContext('2d')
    c.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    
    document.getElementById("formula").innerHTML = updateFormula()
    
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]

        if (player.hyp == 1) {
            player[`r${i + 1}`].effect = (player[`r${i + 1}`].lapsCeil - 1) * player[`r${i + 1}`].effectBase
        }

        if (ringData.unlocked) {
            c.beginPath()
            c.arc(mainCanvas.width / 2, mainCanvas.height / 2, 35+35*i, -0.25 * 2 * Math.PI, ((ringData.laps) % 1 - 0.25) * 2 * Math.PI, false)
            c.strokeStyle = arcColors[i]
            c.lineWidth = 20
            c.stroke()

            player[`r${i + 1}`].speed = ringData.speedInit + ringData.level * ringData.levelBase, 2
            player[`r${i + 1}`].price = ringData.priceInit * Math.pow(ringData.priceScale, ringData.level)
        }

        // Upon getting five levels of a circle, the next one's upgrade button will appear, up to the 8th one.
        if (ringData.level >= 5) {
            if (player[`r${i + 2}`].unlockedUpgrade != true) {
                player[`r${i + 2}`].unlockedUpgrade = true
            }
        }

        if (ringData.level == 1) {
            if (player[`r${i + 1}`].unlocked != true) {
                player[`r${i + 1}`].unlocked = true
            }
        }

        if (ringData.unlockedUpgrade) {
            if (player.points < ringData.price) {
                if (!document.getElementById("lapBtn" + (i + 1)).classList.contains("locked")) {
                    document.getElementById("lapBtn" + (i + 1)).classList.add("locked")
                    document.getElementById("lapBtn" + (i + 1)).style.cssText = ""
                }
            } else {
                if (document.getElementById("lapBtn" + (i + 1)).classList.contains("locked")) {
                    document.getElementById("lapBtn" + (i + 1)).classList.remove("locked")
                    document.getElementById("lapBtn" + (i + 1)).style.cssText = ringData.buttonStyle
                }
            }

            if (document.getElementById("lapBtn" + (i + 1)).style.display != "revert") {
                document.getElementById("lapBtn" + (i + 1)).style.display = "revert";
            }

            document.getElementById("lapBtn" + (i + 1) + "Current").innerHTML = formatNormal(ringData.speed, 2)
            document.getElementById("lapBtn" + (i + 1) + "Next").innerHTML = formatNormal(ringData.speed + ringData.levelBase, 2)
            document.getElementById("lapBtn" + (i + 1) + "Cost").innerHTML = formatNormal(ringData.price, 2)
            document.getElementById("lap" + (i + 1) + "Level").innerHTML = ringData.level
        }
    }

    document.getElementById("points").innerHTML = (player.hyp == 1) ? formatNormal(player.points) : formatNormal(player.points);
    document.getElementById("pointGen").innerHTML = formatNormal(pointGen(), 2)
}

function mainLoop(delta) {
    for (let i = 0; i < RINGS; i++) {
        let ringData = player[`r${i + 1}`]

        if (ringData.unlocked) {
            
            ringData.laps = ringData.laps + ringData.speed * delta
            console.log("Hello!")
            if (ringData.laps > ringData.lapsCeil) {
                let frameLaps = Math.floor(ringData.laps - ringData.lapsCeil) + 1
                ringData.lapsCeil = Math.ceil(ringData.laps)
                revComplete(i + 1, frameLaps)
            }

            
        }
    }

}

window.setInterval(function() {
    let now = Date.now()
    let diff = (now - player.delta) / 1000

    mainLoop(diff)

    player.delta = now

    update()
}, 1000/FPS)