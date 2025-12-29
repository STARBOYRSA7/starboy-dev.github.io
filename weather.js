const API_KEY = "PUT_YOUR_OPENWEATHER_API_KEY_HERE";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherBox = document.getElementById("weather");
const errorBox = document.getElementById("error");

const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const desc = document.getElementById("desc");
const details = document.getElementById("details");
const icon = document.getElementById("icon");

searchBtn.addEventListener("click", getWeather);
cityInput.addEventListener("keypress", e => {
    if (e.key === "Enter") getWeather();
});

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    errorBox.textContent = "";
    weatherBox.classList.add("hidden");

    try {
        // First try South Africa
        let response = await fetch(
            `${BASE_URL}?q=${city},ZA&appid=${API_KEY}&units=metric`
        );

        // Fallback global search
        if (!response.ok) {
            response = await fetch(
                `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`
            );
        }

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();
        displayWeather(data);

    } catch {
        errorBox.textContent = "City not found. Try another South African city.";
    }
}

function displayWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temp.textContent = `${Math.round(data.main.temp)}°C`;
    desc.textContent = data.weather[0].description;
    details.textContent = `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`;

    icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    weatherBox.classList.remove("hidden");
}

window.scrollTo(0, 0);
