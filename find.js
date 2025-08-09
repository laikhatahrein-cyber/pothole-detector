let potholeCount = 0;
let lastDetectionTime = 0;
let detecting = false;
const threshold = 15; // m/s² sensitivity
const minGap = 1500; // ms between detections

// UI elements
const counterDisplay = document.getElementById("counter");
const statusDisplay = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

// Load saved count
if (localStorage.getItem("potholeCount")) {
    potholeCount = parseInt(localStorage.getItem("potholeCount"));
    updateDisplay();
}

startBtn.addEventListener("click", () => {
    statusDisplay.textContent = "Status: Requesting permission...";
    
    if (window.DeviceMotionEvent) {
        // iOS requires permission
        if (typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission()
                .then(state => {
                    if (state === "granted") {
                        startDetection();
                    } else {
                        alert("Permission denied for motion sensors.");
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("Error requesting permission.");
                });
        } else {
            // Android or desktop with sensors
            startDetection();
        }
    } else {
        alert("No motion sensors found. Using keyboard simulation.");
        enableKeyboardSimulation();
    }
});

stopBtn.addEventListener("click", stopDetection);

resetBtn.addEventListener("click", () => {
    potholeCount = 0;
    updateDisplay();
    localStorage.setItem("potholeCount", potholeCount);
});

function startDetection() {
    detecting = true;
    statusDisplay.textContent = "Status: Detecting...";
    window.addEventListener("devicemotion", detectPothole);
    // Add keyboard event listener
    document.addEventListener("keydown", handleSpacePress);
}

function stopDetection() {
    detecting = false;
    statusDisplay.textContent = "Status: Stopped";
    window.removeEventListener("devicemotion", detectPothole);
    // Remove keyboard event listener
    document.removeEventListener("keydown", handleSpacePress);
}

function handleSpacePress(e) {
    if (detecting && e.code === "Space") {
        potholeCount++;
        updateDisplay();
        localStorage.setItem("potholeCount", potholeCount);
    }
}

function detectPothole(event) {
    if (!detecting) return;

    let acc = event.accelerationIncludingGravity;
    if (!acc) return;

    let totalAcc = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

    let currentTime = Date.now();
    if (totalAcc > threshold && (currentTime - lastDetectionTime) > minGap) {
        potholeCount++;
        lastDetectionTime = currentTime;
        updateDisplay();
        localStorage.setItem("potholeCount", potholeCount);
    }
}

function updateDisplay() {
    counterDisplay.textContent = `Potholes Detected: ${potholeCount}`;
    
    // Add shake animation
    document.body.classList.add('shake-animation');
    // Remove the animation class after it completes to allow it to trigger again
    setTimeout(() => {
        document.body.classList.remove('shake-animation');
    }, 500);
}

// Fallback for laptops without motion sensors
function enableKeyboardSimulation() {
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            potholeCount++;
            updateDisplay();
            localStorage.setItem("potholeCount", potholeCount);
        }
    });
    statusDisplay.textContent = "Status: Keyboard simulation enabled (Press Space)";
}
