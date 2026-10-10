const feedbackForm = document.getElementById("feedbackForm");

if (feedbackForm) {
    feedbackForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const formData = new FormData(feedbackForm);
        const feedback = {
            submittedAt: new Date().toISOString(),
            name: formData.get("name").trim(),
            likedExperiences: formData.getAll("experienceTypeLiked"),
            nextSessionSuggestions: formData.get("nextSessionSuggestions").trim(),
            experienceRating: Number(formData.get("experienceRating"))
        };

        try {
            const savedFeedback = JSON.parse(localStorage.getItem("sensoryFeedback") || "[]");
            if (!Array.isArray(savedFeedback)) {
                throw new TypeError("Stored feedback records are not a list.");
            }

            savedFeedback.push(feedback);
            localStorage.setItem("sensoryFeedback", JSON.stringify(savedFeedback));
            window.location.assign("main.html");
        } catch (error) {
            console.error("Unable to save feedback:", error);
            document.getElementById("feedbackSaveError").hidden = false;
        }
    });
}
