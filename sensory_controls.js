document.getElementById("beginSensory").addEventListener("click", function() {
    const selectedDisabilities = Array.from(document.querySelectorAll('input[name="disabilityType"]:checked')).map(input => input.value);
    const selectedSensoryPreferences = Array.from(document.querySelectorAll('input[name="sensoryPreference"]:checked')).map(input => input.value);
});

