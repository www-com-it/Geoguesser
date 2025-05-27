function enableSelection(containerSelector) {
    const container = document.querySelector(containerSelector);
    const options = container.querySelectorAll("div");
    options.forEach(option => {
        option.addEventListener("click", function() {
            options.forEach(opt => opt.classList.remove("selected"));
            this.classList.add("selected");
        });
    });
}
enableSelection(".round");
enableSelection(".times");

const startButton = document.getElementById("start");
const all = document.querySelector(".total");
const loader = document.querySelector(".loader");
loader.style.display = "none";

startButton.addEventListener("click", () => {

    const selectedRound = document.querySelector(".round .selected");
    const selectedTime = document.querySelector(".times .selected");

    if (!selectedRound || !selectedTime) {
        alert("Please select the number of rounds and the max-time for each round!");
        return;
    }

    // Salva le impostazioni della partita in localStorage
    const matchSettings = {
        rounds: selectedRound.textContent.trim(),
        time: selectedTime.textContent.trim()
    };
    localStorage.setItem("matchSettings", JSON.stringify(matchSettings));

    loader.style.display = "flex";
    all.style.opacity = "0.1";
    setTimeout(() => {
        loader.style.display = "none";
        window.location.href = "game.html";
    }, 2500);
});