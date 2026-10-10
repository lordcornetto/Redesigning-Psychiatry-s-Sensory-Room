const beginSensoryButton = document.getElementById("beginSensory");
const auditLogKey = "sensoryAuditLogs";
const sessionDeadlineKey = "sensorySessionDeadline";

function recordAuditLog(control, value) {
    const entry = {
        timestamp: new Date().toISOString(),
        control,
        value
    };

    try {
        const logs = JSON.parse(localStorage.getItem(auditLogKey) || "[]");
        if (!Array.isArray(logs)) {
            throw new TypeError("Stored sensory audit logs are not a list.");
        }
        logs.push(entry);
        localStorage.setItem(auditLogKey, JSON.stringify(logs));
    } catch (error) {
        console.error("Unable to save sensory audit log:", error);
        alert("This control change could not be added to the audit log.");
    }
}

function clearAuditLogs() {
    try {
        localStorage.removeItem(auditLogKey);
    } catch (error) {
        console.error("Unable to clear sensory audit logs:", error);
        return false;
    }

    return true;
}

if (document.body.classList.contains("end-user-page")) {
    clearAuditLogs();
}

const adminControlsButton = document.getElementById("adminControls");
const adminPasswordPrompt = document.getElementById("adminPasswordPrompt");
const adminPasswordInput = document.getElementById("terminateSessionPassword");
const adminPasswordForm = document.getElementById("adminPasswordForm");
const adminPasswordError = document.getElementById("adminPasswordError");

if (adminControlsButton && adminPasswordPrompt) {
    adminControlsButton.addEventListener("click", function() {
        adminPasswordPrompt.hidden = false;
        adminPasswordInput?.focus();
    });
}

if (adminPasswordForm && adminPasswordInput && adminPasswordError) {
    adminPasswordForm.addEventListener("submit", function(event) {
        event.preventDefault();

        if (adminPasswordInput.value === "yes") {
            window.location.assign("staff_controls.html");
            return;
        }

        adminPasswordError.hidden = false;
        adminPasswordInput.value = "";
        adminPasswordInput.focus();
    });

    adminPasswordInput.addEventListener("input", function() {
        adminPasswordError.hidden = true;
    });
}

const brightnessButton = document.getElementById("brightnessLighting");
const brightnessOutput = document.getElementById("brightnessOutput");
const sensoryBackground = document.querySelector(".sensory-background");
const colourButtons = document.querySelectorAll(".colour-light-button");

const soundButton = document.getElementById("volumeSound");
const soundOutput = document.getElementById("volumeOutput");
const soundTypeButtons = document.querySelectorAll(".sound-type-button");
const previewSoundType = document.getElementById("previewSoundType");
const previewSoundLevel = document.getElementById("previewSoundLevel");
const previewSoundVolume = document.getElementById("previewSoundVolume");
const soundMeter = document.querySelector(".sound-meter");
const soundPlaybackStatus = document.getElementById("soundPlaybackStatus");
let currentSoundVolume = Number.parseInt(soundOutput?.textContent || "0", 10);
let activeSoundAudio = null;
let activeSoundType = null;

function setSoundVolume(volume) {
    currentSoundVolume = volume;
    if (soundOutput) {
        soundOutput.textContent = `${volume}%`;
    }
    if (activeSoundAudio) {
        activeSoundAudio.volume = volume / 100;
    }
    if (previewSoundLevel && previewSoundVolume && soundMeter) {
        previewSoundLevel.style.width = `${volume}%`;
        previewSoundVolume.textContent = `${volume}%`;
        soundMeter.setAttribute("aria-valuenow", String(volume));
    }
}

function stopSoundType(shouldLog = true) {
    if (activeSoundAudio) {
        activeSoundAudio.pause();
        activeSoundAudio.currentTime = 0;
        activeSoundAudio = null;
    }

    const stoppedSoundType = activeSoundType;
    activeSoundType = null;
    soundTypeButtons.forEach(function(button) {
        button.setAttribute("aria-pressed", "false");
    });
    if (previewSoundType) {
        previewSoundType.textContent = "No sound selected";
    }
    if (previewSoundLevel) {
        previewSoundLevel.style.backgroundColor = "";
    }
    if (soundPlaybackStatus) {
        soundPlaybackStatus.textContent = "";
    }
    if (shouldLog && stoppedSoundType) {
        recordAuditLog("Sound type", "Off");
    }
}

function playSoundType(button, shouldLog = true) {
    if (activeSoundType === button.dataset.soundType && activeSoundAudio) {
        stopSoundType(shouldLog);
        return;
    }

    if (activeSoundAudio) {
        activeSoundAudio.pause();
        activeSoundAudio.currentTime = 0;
    }

    const selectedSoundType = button.dataset.soundType;
    activeSoundType = selectedSoundType;
    const audio = new Audio(button.dataset.soundSrc);
    activeSoundAudio = audio;
    audio.loop = true;
    audio.volume = currentSoundVolume / 100;

    if (previewSoundType && previewSoundLevel) {
        previewSoundType.textContent = selectedSoundType;
        previewSoundLevel.style.backgroundColor = button.dataset.soundColor;
    }
    soundTypeButtons.forEach(function(typeButton) {
        typeButton.setAttribute("aria-pressed", String(typeButton === button));
    });
    if (soundPlaybackStatus) {
        soundPlaybackStatus.textContent = "";
    }
    if (shouldLog) {
        recordAuditLog("Sound type", activeSoundType);
    }

    audio.addEventListener("error", function() {
        if (activeSoundAudio === audio) {
            if (soundPlaybackStatus) {
                soundPlaybackStatus.textContent = `Unable to load ${selectedSoundType} audio.`;
            }
            console.error(`Unable to load sound file: ${button.dataset.soundSrc}`);
        }
    }, { once: true });

    audio.play().catch(function(error) {
        if (activeSoundAudio === audio) {
            if (soundPlaybackStatus) {
                soundPlaybackStatus.textContent = `Unable to play ${selectedSoundType} audio.`;
            }
            console.error(`Unable to play ${selectedSoundType} audio:`, error);
        }
    });
}

const pressureButton = document.getElementById("pressureControl");
const pressureOutput = document.getElementById("pressureOutput");
const previewPressureWave = document.getElementById("previewPressureWave");
const previewPressureLevel = document.getElementById("previewPressureLevel");

const motionButton = document.getElementById("motionControl");
const motionOutput = document.getElementById("motionOutput");
const previewMotionCircle = document.getElementById("previewMotionCircle");
const previewMotionLevel = document.getElementById("previewMotionLevel");

if (brightnessButton && brightnessOutput) {
    let brightness = Number.parseInt(brightnessOutput.textContent, 10);

    if (sensoryBackground && Number.isFinite(brightness)) {
        sensoryBackground.style.setProperty("--room-brightness", brightness / 100);
    }

    brightnessButton.addEventListener("click", function() {
        brightness = Number.parseInt(brightnessOutput.textContent, 10);
        brightness = brightness >= 100 ? 0 : brightness + 25;
        brightnessOutput.textContent = `${brightness}%`;
        recordAuditLog("Lighting brightness", `${brightness}%`);

        if (sensoryBackground) {
            sensoryBackground.style.setProperty("--room-brightness", brightness / 100);
        }
    });
}

if (sensoryBackground && colourButtons.length > 0) {
    colourButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            sensoryBackground.style.setProperty("--room-color", button.dataset.color);
            recordAuditLog("Lighting colour", button.getAttribute("aria-label"));

            colourButtons.forEach(function(colourButton) {
                colourButton.setAttribute("aria-pressed", String(colourButton === button));
            });
        });
    });
}

if (soundButton && soundOutput) {
    const updateSoundPreview = function() {
        setSoundVolume(currentSoundVolume);
    };

    updateSoundPreview();
    soundButton.addEventListener("click", function() {
        currentSoundVolume = Number.parseInt(soundOutput.textContent, 10);
        const volume = currentSoundVolume >= 100 ? 0 : currentSoundVolume + 25;
        setSoundVolume(volume);
        recordAuditLog("Sound volume", `${volume}%`);
        updateSoundPreview();
    });
}

if (soundTypeButtons.length > 0) {
    soundTypeButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            playSoundType(button);
        });
    });
}

if (pressureButton && pressureOutput) {
    let pressure = Number.parseInt(pressureOutput.textContent, 10);

    const updatePressurePreview = function() {
        if (previewPressureWave && previewPressureLevel) {
            const amplitude = pressure * 0.32;
            const points = Array.from({ length: 17 }, function(_, index) {
                const x = index * 12.5;
                const y = 40 + Math.sin(index * Math.PI / 4) * amplitude;
                return `${x},${y}`;
            });
            previewPressureWave.setAttribute("d", `M${points.join(" L")}`);
            previewPressureLevel.textContent = `${pressure}%`;
        }
    };

    updatePressurePreview();
    pressureButton.addEventListener("click", function() {
        pressure = Number.parseInt(pressureOutput.textContent, 10);
        pressure = pressure >= 100 ? 0 : pressure + 25;
        pressureOutput.textContent = `${pressure}%`;
        recordAuditLog("Seat pressure", `${pressure}%`);
        updatePressurePreview();
    });
}

if (motionButton && motionOutput) {
    let motion = Number.parseInt(motionOutput.textContent, 10);

    const updateMotionPreview = function() {
        if (previewMotionCircle && previewMotionLevel) {
            previewMotionCircle.style.width = `${motion}%`;
            previewMotionCircle.style.height = `${motion}%`;
            previewMotionLevel.textContent = `${motion}%`;
        }
    };

    updateMotionPreview();
    motionButton.addEventListener("click", function() {
        motion = Number.parseInt(motionOutput.textContent, 10);
        motion = motion >= 100 ? 0 : motion + 25;
        motionOutput.textContent = `${motion}%`;
        recordAuditLog("Motion", `${motion}%`);
        updateMotionPreview();
    });
}

if (beginSensoryButton) {
    beginSensoryButton.addEventListener("click", function(event) {
        const selectedSensoryPreferences = Array.from(document.querySelectorAll('input[name="sensoryPreference"]:checked'));
        const sensoryPreferenceError = document.getElementById("sensoryPreferenceError");

        if (selectedSensoryPreferences.length === 0) {
            event.preventDefault();
            sensoryPreferenceError.hidden = false;
            document.querySelector('input[name="sensoryPreference"]').focus();
            return;
        }

        sensoryPreferenceError.hidden = true;
        const hasDisability = document.getElementById("ifDisability").checked;
        const preferences = {
            hasDisability,
            disabilities: hasDisability
                ? Array.from(document.querySelectorAll('input[name="disabilityType"]:checked')).map(input => input.value)
                : [],
            otherDisabilities: hasDisability ? document.getElementById("otherDisabilities").value.trim() : "",
            sensoryPreferences: selectedSensoryPreferences.map(input => input.value)
        };

        try {
            sessionStorage.setItem("sensoryPreferences", JSON.stringify(preferences));
            sessionStorage.removeItem(sessionDeadlineKey);
        } catch (error) {
            event.preventDefault();
            console.error("Unable to save sensory preferences:", error);
            alert("Your preferences could not be saved. Please try again.");
        }
    });
}

const isPatientControlsPage = document.body.classList.contains("patient-controls");
const isStaffControlsPage = document.body.classList.contains("staff-controls");

if (isPatientControlsPage) {
    const savedPreferences = sessionStorage.getItem("sensoryPreferences");
    window.sensoryPreferences = savedPreferences ? JSON.parse(savedPreferences) : null;

    const selectedPreferences = window.sensoryPreferences?.sensoryPreferences || [];
    const disabilityNames = {
        autismSpectrumDisorder: "Autism Spectrum Disorder",
        attentionDeficitHyperactivityDisorder: "Attention Deficit Hyperactivity Disorder",
        traumaDifficulties: "Trauma-related Difficulties"
    };
    const selectedDisabilities = window.sensoryPreferences?.disabilities || [];
    const presetDisabilities = selectedDisabilities
        .filter(disability => Object.hasOwn(disabilityNames, disability))
        .map(disability => disabilityNames[disability]);
    const preferenceControls = {
        roomLighting: [".room-lighting"],
        noise: [".sound-controls", "#soundIndicator"],
        pressure: [".pressure", "#pressureIndicator"],
        motion: [".motion", "#motionIndicator"]
    };

    for (const [preference, selectors] of Object.entries(preferenceControls)) {
        for (const selector of selectors) {
            const control = document.querySelector(selector);
            if (control) {
                control.style.display = selectedPreferences.includes(preference) ? "" : "none";
            }
        }
    }

    if (window.sensoryPreferences?.hasDisability && presetDisabilities.length > 0) {
        const presetNotice = document.getElementById("disabilityPresetNotice");
        const presetHeading = document.getElementById("disabilityPresetHeading");
        presetHeading.textContent = `Settings automatically tuned for: ${presetDisabilities.join(", ")}`;
        presetNotice.hidden = false;

        const disabilities = selectedDisabilities;
        const traumaPresetSelected = disabilities.includes("traumaDifficulties");
        const autismPresetSelected = disabilities.includes("autismSpectrumDisorder");
        const adhdPresetSelected = disabilities.includes("attentionDeficitHyperactivityDisorder");
        const demoLevel = 25;
        const pressureMotionLevel = adhdPresetSelected ? 0 : autismPresetSelected ? 75 : traumaPresetSelected ? 50 : demoLevel;
        const soundVolumeLevel = adhdPresetSelected ? 0 : demoLevel;
        const lightingLevel = adhdPresetSelected ? 50 : demoLevel;
        const presetValues = {
            roomLighting: ["Lighting brightness", brightnessOutput, null, lightingLevel],
            noise: ["Sound volume", soundOutput, previewSoundVolume, soundVolumeLevel],
            pressure: ["Seat pressure", pressureOutput, previewPressureLevel, pressureMotionLevel],
            motion: ["Motion", motionOutput, previewMotionLevel, pressureMotionLevel]
        };

        for (const preference of selectedPreferences) {
            const preset = presetValues[preference];
            if (!preset) {
                continue;
            }

            const [controlName, controlOutput, previewOutput, presetLevel] = preset;
            if (controlOutput) {
                controlOutput.textContent = `${presetLevel}%`;
            }
            if (preference === "noise") {
                setSoundVolume(presetLevel);
            }
            if (previewOutput) {
                previewOutput.textContent = `${presetLevel}%`;
            }
            if (preference === "noise" && previewSoundLevel && soundMeter) {
                previewSoundLevel.style.width = `${presetLevel}%`;
                soundMeter.setAttribute("aria-valuenow", String(presetLevel));
            }
            if (preference === "motion" && previewMotionCircle) {
                previewMotionCircle.style.width = `${presetLevel}%`;
                previewMotionCircle.style.height = `${presetLevel}%`;
            }
            if (preference === "roomLighting" && sensoryBackground) {
                sensoryBackground.style.setProperty("--room-brightness", presetLevel / 100);
                const presetColor = adhdPresetSelected
                    ? "lightyellow"
                    : autismPresetSelected
                        ? "lightskyblue"
                        : null;
                if (presetColor) {
                    const presetColorButton = Array.from(colourButtons)
                        .find(button => button.dataset.color === presetColor);
                    if (presetColorButton) {
                        sensoryBackground.style.setProperty("--room-color", presetColorButton.dataset.color);
                        colourButtons.forEach(function(button) {
                            button.setAttribute("aria-pressed", String(button === presetColorButton));
                        });
                        const colorName = presetColorButton.getAttribute("aria-label");
                        const profileName = adhdPresetSelected ? "ADHD" : "ASD";
                        recordAuditLog("Lighting colour", `${colorName} (unvalidated ${profileName} demo preset)`);
                    }
                }
            }
            if (preference === "noise" && (autismPresetSelected || adhdPresetSelected)) {
                const presetSoundType = adhdPresetSelected ? null : "White Noise";
                const soundTypeButton = presetSoundType
                    ? Array.from(soundTypeButtons).find(button => button.dataset.soundType === presetSoundType)
                    : null;
                if (adhdPresetSelected) {
                    stopSoundType(false);
                    recordAuditLog("Sound type", "Off (unvalidated ADHD demo preset)");
                } else if (soundTypeButton) {
                    playSoundType(soundTypeButton, false);
                    recordAuditLog("Sound type", "White Noise (unvalidated ASD demo preset)");
                }
            }
            if (preference === "pressure" && previewPressureWave) {
                const amplitude = presetLevel * 0.32;
                const points = Array.from({ length: 17 }, function(_, index) {
                    const x = index * 12.5;
                    const y = 40 + Math.sin(index * Math.PI / 4) * amplitude;
                    return `${x},${y}`;
                });
                previewPressureWave.setAttribute("d", `M${points.join(" L")}`);
            }

            recordAuditLog(controlName, `${presetLevel}% (unvalidated demo preset)`);
        }
    }

}

if (isStaffControlsPage) {
    const auditLogList = document.getElementById("auditLogList");
    const auditLogStatus = document.getElementById("auditLogStatus");
    const terminateSessionButton = document.getElementById("terminateSession");

    terminateSessionButton?.addEventListener("click", function() {
        clearAuditLogs();
        sessionStorage.removeItem(sessionDeadlineKey);
        window.location.assign("main.html");
    });

    try {
        const logs = JSON.parse(localStorage.getItem(auditLogKey) || "[]");
        if (!Array.isArray(logs)) {
            throw new TypeError("Stored sensory audit logs are not a list.");
        }

        if (logs.length === 0) {
            auditLogStatus.textContent = "No control changes have been logged yet.";
        } else {
            logs.slice().reverse().forEach(function(log) {
                const row = document.createElement("tr");
                const timestampCell = document.createElement("td");
                const controlCell = document.createElement("td");
                const valueCell = document.createElement("td");

                timestampCell.textContent = new Date(log.timestamp).toLocaleString();
                controlCell.textContent = log.control;
                valueCell.textContent = log.value;
                row.append(timestampCell, controlCell, valueCell);
                auditLogList.append(row);
            });
        }
    } catch (error) {
        console.error("Unable to load sensory audit logs:", error);
        auditLogStatus.textContent = "Audit logs could not be loaded.";
    }
}

if (isPatientControlsPage || isStaffControlsPage) {
    const timeLimit = document.getElementById("timeLimit");
    const match = timeLimit && timeLimit.textContent.trim().match(/^(\d+):([0-5]\d)$/);
    let deadline = Number(sessionStorage.getItem(sessionDeadlineKey));

    if (!Number.isFinite(deadline) || deadline <= 0) {
        if (isPatientControlsPage && match) {
            const initialSeconds = Number(match[1]) * 60 + Number(match[2]);
            deadline = Date.now() + initialSeconds * 1000;
            sessionStorage.setItem(sessionDeadlineKey, String(deadline));
        } else {
            deadline = null;
        }
    }

    if (timeLimit && deadline !== null) {
        const updateTimeLimit = function() {
            const remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

            if (remainingSeconds === 0) {
                timeLimit.textContent = "00:00";
                clearAuditLogs();
                sessionStorage.removeItem(sessionDeadlineKey);
                window.location.assign("feedback_form.html");
                return true;
            }

            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            timeLimit.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            return false;
        };

        if (!updateTimeLimit()) {
            const timer = window.setInterval(function() {
                if (updateTimeLimit()) {
                    window.clearInterval(timer);
                }
            }, 1000);
        }
    } else if (timeLimit && isStaffControlsPage) {
        timeLimit.textContent = "No active session";
    } else if (isPatientControlsPage && !match) {
        console.error("The session time limit must use the MM:SS format.");
    }
}


console.log("Sensory Preferences:", window.sensoryPreferences);
