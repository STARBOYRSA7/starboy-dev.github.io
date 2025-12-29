// iPhone Weather App - Complete JavaScript
// Replace API_KEY with your actual OpenWeatherMap API key

// Configuration
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY_HERE';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const elements = {
    // Current weather
    cityName: document.getElementById('cityName'),
    currentDateTime: document.getElementById('currentDateTime'),
    temperature: document.getElementById('temperature'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    windSpeed: document.getElementById('windSpeed'),
    humidity: document.getElementById('humidity'),
    uvIndex: document.getElementById('uvIndex'),
    
    // Forecast containers
    hourlyContainer: document.getElementById('hourlyContainer'),
    dailyContainer: document.getElementById('dailyContainer'),
    
    // Additional details
    sunriseTime: document.getElementById('sunriseTime'),
    sunsetTime: document.getElementById('sunsetTime'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    
    // UI elements
    currentTime: document.getElementById('currentTime'),
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchClose: document.getElementById('searchClose'),
    searchOverlay: document.getElementById('searchOverlay'),
    locationBtn: document.getElementById('locationBtn'),
    menuBtn: document.getElementById('menuBtn'),
    loadingScreen: document.getElementById('loadingScreen'),
    errorToast: document.getElementById('errorToast'),
    errorMessage: document.getElementById('errorMessage'),
    searchResults: document.getElementById('searchResults'),
    
    // Canvas for dynamic background
    backgroundCanvas: document.getElementById('backgroundCanvas')
};

// Weather icons mapping (OpenWeatherMap icons)
const weatherIcons = {
    '01d': 'fas fa-sun',           // clear sky day
    '01n': 'fas fa-moon',          // clear sky night
    '02d': 'fas fa-cloud-sun',     // few clouds day
    '02n': 'fas fa-cloud-moon',    // few clouds night
    '03d': 'fas fa-cloud',         // scattered clouds
    '03n': 'fas fa-cloud',         // scattered clouds night
    '04d': 'fas fa-cloud',         // broken clouds
    '04n': 'fas fa-cloud',         // broken clouds night
    '09d': 'fas fa-cloud-showers-heavy', // shower rain
    '09n': 'fas fa-cloud-showers-heavy', // shower rain night
    '10d': 'fas fa-cloud-rain',    // rain day
    '10n': 'fas fa-cloud-rain',    // rain night
    '11d': 'fas fa-bolt',          // thunderstorm
    '11n': 'fas fa-bolt',          // thunderstorm night
    '13d': 'fas fa-snowflake',     // snow
    '13n': 'fas fa-snowflake',     // snow night
    '50d': 'fas fa-smog',          // mist
    '50n': 'fas fa-smog'           // mist night
};

// Major South African cities plus international cities and placeholder for your hometown
const sampleCities = [
    // South African Cities
    { name: 'Johannesburg', country: 'ZA', lat: -26.2041, lon: 28.0473 },
    { name: 'Cape Town', country: 'ZA', lat: -33.9249, lon: 18.4241 },
    { name: 'Durban', country: 'ZA', lat: -29.8587, lon: 31.0218 },
    { name: 'Pretoria', country: 'ZA', lat: -25.7479, lon: 28.2293 },
    { name: 'Port Elizabeth', country: 'ZA', lat: -33.9608, lon: 25.6022 },
    { name: 'Bloemfontein', country: 'ZA', lat: -29.0852, lon: 26.1596 },
    { name: 'East London', country: 'ZA', lat: -33.0292, lon: 27.8546 },
    { name: 'Pietermaritzburg', country: 'ZA', lat: -29.6167, lon: 30.3833 },
    { name: 'Polokwane', country: 'ZA', lat: -23.8962, lon: 29.4486 },
    { name: 'Nelspruit', country: 'ZA', lat: -25.4745, lon: 30.9703 },
    { name: 'Kimberley', country: 'ZA', lat: -28.7282, lon: 24.7499 },
    { name: 'Rustenburg', country: 'ZA', lat: -25.6544, lon: 27.2559 },
    
    // International Cities
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
    { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
    { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777 },
    
    // ADD YOUR HOMETOWN HERE - Replace the placeholder below
    { name: 'YOUR_HOMETOWN', country: 'ZA', lat: -25.0, lon: 28.0 } // Example coordinates - you need to update these
];

// App state
let currentWeatherData = null;
let currentLocation = sampleCities[0]; // Start with Johannesburg

// Initialize app
class WeatherApp {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initClock();
        this.initDynamicBackground();
        
        // Load initial weather data
        await this.loadWeatherData(currentLocation.name, currentLocation.lat, currentLocation.lon);
        
        // Update every 15 minutes
        setInterval(() => {
            if (currentLocation) {
                this.loadWeatherData(currentLocation.name, currentLocation.lat, currentLocation.lon);
            }
        }, 15 * 60 * 1000);
    }

    setupEventListeners() {
        // Search button
        elements.searchBtn.addEventListener('click', () => {
            elements.searchOverlay.classList.remove('hidden');
            elements.cityInput.focus();
        });

        // Close search
        elements.searchClose.addEventListener('click', () => {
            elements.searchOverlay.classList.add('hidden');
        });

        // Search input
        elements.cityInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearchSubmit(e.target.value);
            }
        });

        // Location button
        elements.locationBtn.addEventListener('click', () => {
            this.getUserLocation();
        });

        // Menu button - cycles through all cities
        elements.menuBtn.addEventListener('click', () => {
            // Find current city index
            const currentIndex = sampleCities.findIndex(city => 
                city.name === currentLocation.name && city.country === currentLocation.country
            );
            
            // Get next city (loop back to start if at end)
            const nextIndex = (currentIndex + 1) % sampleCities.length;
            const nextCity = sampleCities[nextIndex];
            
            // Update current location and load weather
            currentLocation = nextCity;
            this.loadWeatherData(nextCity.name, nextCity.lat, nextCity.lon);
        });
    }

    initClock() {
        const updateClock = () => {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            elements.currentTime.textContent = time;
            elements.currentDateTime.textContent = date;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    initDynamicBackground() {
        const canvas = elements.backgroundCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let time = 0;

        const drawBackground = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create gradient based on time of day
            const hour = new Date().getHours();
            let gradient;
            
            if (hour >= 6 && hour < 18) {
                // Day gradient
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
            } else {
                // Night gradient
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#0f2027');
                gradient.addColorStop(0.5, '#203a43');
                gradient.addColorStop(1, '#2c5364');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add subtle animated particles
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < 20; i++) {
                const x = (Math.sin(time * 0.001 + i) * 100 + i * 50) % canvas.width;
                const y = (Math.cos(time * 0.001 + i) * 100 + i * 30) % canvas.height;
                const size = Math.sin(time * 0.001 + i) * 2 + 3;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            time += 16; // ~60fps
            requestAnimationFrame(drawBackground);
        };

        drawBackground();

        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    async loadWeatherData(cityName, lat, lon) {
        try {
            elements.loadingScreen.classList.remove('hidden');
            
            let weatherData;
            
            if (lat && lon) {
                weatherData = await this.fetchWeatherByCoords(lat, lon);
            } else {
                weatherData = await this.fetchWeatherByCity(cityName);
            }
            
            currentWeatherData = weatherData;
            this.updateUI(weatherData);
            
            // Update forecast
            await this.updateForecast(weatherData.coord.lat, weatherData.coord.lon);
            
        } catch (error) {
            console.error('Error loading weather data:', error);
            this.showError('Unable to fetch weather data. Please try again.');
            
            // Fallback to mock data if API fails
            const mockData = this.generateMockWeatherData(cityName);
            this.updateUI(mockData.current);
            this.updateMockForecast();
            
        } finally {
            elements.loadingScreen.classList.add('hidden');
        }
    }

    async fetchWeatherByCity(city) {
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        return await response.json();
    }

    async fetchWeatherByCoords(lat, lon) {
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Location not found');
        }
        
        return await response.json();
    }

    async updateForecast(lat, lon) {
        try {
            const response = await fetch(
                `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error('Forecast not available');
            }
            
            const forecastData = await response.json();
            this.updateHourlyForecast(forecastData.list);
            this.updateDailyForecast(forecastData.list);
            
        } catch (error) {
            console.error('Error fetching forecast:', error);
            this.updateMockForecast();
        }
    }

    updateUI(data) {
        // Update current location
        currentLocation = {
            name: data.name,
            country: data.sys.country,
            lat: data.coord.lat,
            lon: data.coord.lon
        };
        
        // Update city name
        elements.cityName.innerHTML = `
            <i class="fas fa-location-dot"></i> ${data.name}, ${data.sys.country}
        `;
        
        // Update temperature
        elements.temperature.innerHTML = `
            ${Math.round(data.main.temp)}<span class="temp-unit">°C</span>
        `;
        
        // Update weather description
        elements.weatherDescription.textContent = 
            data.weather[0].description.charAt(0).toUpperCase() + 
            data.weather[0].description.slice(1);
        
        // Update details
        elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        elements.windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        elements.humidity.textContent = `${data.main.humidity}%`;
        elements.pressure.textContent = `${data.main.pressure} hPa`;
        elements.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        
        // Calculate sunrise/sunset times
        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);
        
        elements.sunriseTime.textContent = sunrise.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        elements.sunsetTime.textContent = sunset.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Simple UV index calculation (mock - real API would provide this)
        const hour = new Date().getHours();
        const uvIndex = hour >= 10 && hour <= 16 ? Math.floor(Math.random() * 6) + 3 : Math.floor(Math.random() * 3);
        elements.uvIndex.textContent = uvIndex;
    }

    updateHourlyForecast(hourlyData) {
        elements.hourlyContainer.innerHTML = '';
        
        // Get next 12 hours
        const next12Hours = hourlyData.slice(0, 12);
        
        next12Hours.forEach(hour => {
            const date = new Date(hour.dt * 1000);
            const time = date.toLocaleTimeString([], { hour: '2-digit' });
            const temp = Math.round(hour.main.temp);
            const iconCode = hour.weather[0].icon;
            const iconClass = weatherIcons[iconCode] || 'fas fa-question';
            
            const hourItem = document.createElement('div');
            hourItem.className = 'hourly-item';
            hourItem.innerHTML = `
                <div class="hour-time">${time}</div>
                <div class="hour-icon"><i class="${iconClass}"></i></div>
                <div class="hour-temp">${temp}°C</div>
            `;
            
            elements.hourlyContainer.appendChild(hourItem);
        });
    }

    updateDailyForecast(dailyData) {
        elements.dailyContainer.innerHTML = '';
        
        // Group by day and get one forecast per day for next 10 days
        const dailyForecasts = [];
        const seenDays = new Set();
        
        dailyData.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!seenDays.has(dayKey) && dailyForecasts.length < 10) {
                seenDays.add(dayKey);
                
                const temp = Math.round(forecast.main.temp);
                const iconCode = forecast.weather[0].icon;
                const iconClass = weatherIcons[iconCode] || 'fas fa-question';
                
                // Create temp range (simplified - real API would provide min/max)
                const tempHigh = temp + Math.floor(Math.random() * 5);
                const tempLow = temp - Math.floor(Math.random() * 5);
                
                dailyForecasts.push({
                    day: dayKey,
                    icon: iconClass,
                    high: tempHigh,
                    low: tempLow
                });
            }
        });
        
        // Create daily items
        dailyForecasts.forEach(day => {
            const dayItem = document.createElement('div');
            dayItem.className = 'daily-item';
            dayItem.innerHTML = `
                <div class="day-name">${day.day}</div>
                <div class="day-icon"><i class="${day.icon}"></i></div>
                <div class="day-temp-range">
                    <span style="color: rgba(255,255,255,0.7)">${day.low}°</span>
                    <span style="margin: 0 4px">/</span>
                    <span>${day.high}°</span>
                </div>
            `;
            
            elements.dailyContainer.appendChild(dayItem);
        });
    }

    updateMockForecast() {
        // Generate mock hourly forecast
        const now = new Date();
        elements.hourlyContainer.innerHTML = '';
        
        for (let i = 0; i < 12; i++) {
            const hour = (now.getHours() + i) % 24;
            const temp = 20 + Math.floor(Math.random() * 10) - 5;
            const iconClass = i % 3 === 0 ? 'fas fa-cloud-sun' : 'fas fa-sun';
            
            const hourItem = document.createElement('div');
            hourItem.className = 'hourly-item';
            hourItem.innerHTML = `
                <div class="hour-time">${hour}:00</div>
                <div class="hour-icon"><i class="${iconClass}"></i></div>
                <div class="hour-temp">${temp}°C</div>
            `;
            
            elements.hourlyContainer.appendChild(hourItem);
        }
        
        // Generate mock daily forecast
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        elements.dailyContainer.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const high = 22 + Math.floor(Math.random() * 8);
            const low = high - Math.floor(Math.random() * 6);
            const iconClass = i % 2 === 0 ? 'fas fa-sun' : 'fas fa-cloud-sun';
            
            const dayItem = document.createElement('div');
            dayItem.className = 'daily-item';
            dayItem.innerHTML = `
                <div class="day-name">${days[i]}</div>
                <div class="day-icon"><i class="${iconClass}"></i></div>
                <div class="day-temp-range">
                    <span style="color: rgba(255,255,255,0.7)">${low}°</span>
                    <span style="margin: 0 4px">/</span>
                    <span>${high}°</span>
                </div>
            `;
            
            elements.dailyContainer.appendChild(dayItem);
        }
    }

    generateMockWeatherData(city) {
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy'];
        const icons = ['01d', '02d', '03d', '10d', '11d'];
        const conditionIndex = Math.floor(Math.random() * conditions.length);
        
        const baseTemp = 22;
        const temp = baseTemp + Math.floor(Math.random() * 10) - 5;
        
        return {
            current: {
                name: city,
                sys: { country: 'ZA', sunrise: Date.now()/1000 - 36000, sunset: Date.now()/1000 + 36000 },
                coord: { lat: -26.2041, lon: 28.0473 },
                main: {
                    temp: temp,
                    feels_like: temp + 2,
                    humidity: 50 + Math.floor(Math.random() * 30),
                    pressure: 1000 + Math.floor(Math.random() * 30)
                },
                wind: { speed: 5 + Math.random() * 10 },
                weather: [{ description: conditions[conditionIndex], icon: icons[conditionIndex] }],
                visibility: 10000
            }
        };
    }

    handleSearchInput(query) {
        if (query.length < 2) {
            elements.searchResults.innerHTML = '';
            return;
        }
        
        // Filter sample cities
        const filteredCities = sampleCities.filter(city =>
            city.name.toLowerCase().includes(query.toLowerCase())
        );
        
        elements.searchResults.innerHTML = '';
        
        if (filteredCities.length === 0) {
            elements.searchResults.innerHTML = `
                <div class="no-results">No cities found. Try another search.</div>
            `;
            return;
        }
        
        filteredCities.forEach(city => {
            const cityElement = document.createElement('div');
            cityElement.className = 'search-result-item';
            cityElement.innerHTML = `
                <i class="fas fa-city"></i>
                <div class="city-info">
                    <div class="city-name">${city.name}</div>
                    <div class="city-country">${city.country}</div>
                </div>
            `;
            
            cityElement.addEventListener('click', () => {
                this.loadWeatherData(city.name, city.lat, city.lon);
                elements.searchOverlay.classList.add('hidden');
                elements.cityInput.value = '';
            });
            
            elements.searchResults.appendChild(cityElement);
        });
    }

    handleSearchSubmit(query) {
        if (query.trim()) {
            this.loadWeatherData(query.trim());
            elements.searchOverlay.classList.add('hidden');
            elements.cityInput.value = '';
        }
    }

    getUserLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }
        
        elements.loadingScreen.classList.remove('hidden');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Reverse geocode to get city name
                    const response = await fetch(
                        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
                    );
                    
                    if (response.ok) {
                        const locationData = await response.json();
                        if (locationData.length > 0) {
                            const city = locationData[0].name;
                            await this.loadWeatherData(city, latitude, longitude);
                        }
                    }
                } catch (error) {
                    // If reverse geocoding fails, use coordinates directly
                    await this.loadWeatherData(null, latitude, longitude);
                }
            },
            (error) => {
                elements.loadingScreen.classList.add('hidden');
                this.showError('Unable to get your location. Please check permissions.');
            }
        );
    }

    showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorToast.classList.remove('hidden');
        
        setTimeout(() => {
            elements.errorToast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
