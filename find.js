let potholeCount = 0;
let lastDetectionTime = 0;
let detecting = false;
const threshold = 20; // Increased sensitivity threshold for mobile
const minGap = 1000; // Reduced time gap between detections
let wakeLock = null; // For keeping the screen awake

// UI elements
const counterDisplay = document.getElementById("counter");
const statusDisplay = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

// Check if device has motion sensors
const hasMotionSensors = () => {
    return window.DeviceMotionEvent !== undefined;
};

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

async function startDetection() {
    detecting = true;
    statusDisplay.textContent = "Status: Detecting...";

    // Keep screen awake on mobile devices
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('Wake Lock not supported');
    }

    // Start motion detection if available
    if (hasMotionSensors()) {
        window.addEventListener("devicemotion", detectPothole);
        statusDisplay.textContent = "Status: Detecting using motion sensors...";
    } else {
        // Fallback to keyboard for desktop
        document.addEventListener("keydown", handleSpacePress);
        statusDisplay.textContent = "Status: Using keyboard (Press Space)";
    }
}

function stopDetection() {
    detecting = false;
    statusDisplay.textContent = "Status: Stopped";

    // Release wake lock
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }

    // Remove all event listeners
    window.removeEventListener("devicemotion", detectPothole);
    document.removeEventListener("keydown", handleSpacePress);
}

function handleSpacePress(e) {
    if (detecting && e.code === "Space") {
        registerPothole();
    }
}

function detectPothole(event) {
    if (!detecting) return;

    let acc = event.accelerationIncludingGravity;
    if (!acc) return;

    let totalAcc = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

    let currentTime = Date.now();
    if (totalAcc > threshold && (currentTime - lastDetectionTime) > minGap) {
        registerPothole();
        lastDetectionTime = currentTime;
    }
}

function registerPothole() {
    potholeCount++;
    updateDisplay();
    localStorage.setItem("potholeCount", potholeCount);
    
    // Visual feedback
    statusDisplay.style.backgroundColor = '#ffeb3b';
    setTimeout(() => {
        statusDisplay.style.backgroundColor = '';
    }, 200);
}

function updateDisplay() {
    counterDisplay.textContent = `Potholes Detected: ${potholeCount}`;
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
