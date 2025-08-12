// initialize some useful global variables
var densityData = {}
var latitude = 38.627003
var longitude = -90.199402


async function updateDensityData() {
    try {
        // send latitude and longitude to Flask
        const response = await fetch('/update_coords', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude })
        })
        // use response to update densityData and the visual page
        const data = await response.json()
        densityData = data
        recalculateDensities()
    } catch (error) {
        console.error("Failed to update densityData:", error)
    }
}

function recalculateDensities() {
    // get a list of checked trees
    // loop over checked trees and sum up the tree counts (change to densities later)
    // update the 4 elements visually with the final tree densities
    const form = document.getElementById("tree-form")
    const checkedTrees = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
    let citywide = 0
    let le_500 = 0
    let le_1000 = 0
    let le_2500 = 0
    checkedTrees.forEach(tree => {
        citywide += densityData[tree]['citywide']
        le_500 += densityData[tree]['le_500']
        le_1000 += densityData[tree]['le_1000']
        le_2500 += densityData[tree]['le_2500']
    })
    let citywide_density = Math.round(citywide / 61.72, 0) // stl square mileage
    let le_500_density = Math.round(le_500 / (Math.PI * (500/5280)**2), 0)
    let le_1000_density = Math.round(le_1000 / (Math.PI * (1000/5280)**2), 0)
    let le_2500_density = Math.round(le_2500 / (Math.PI * (2500/5280)**2), 0)
    
    let le_500_var = le_500_density / citywide_density - 1
    let le_1000_var = le_1000_density / citywide_density - 1
    let le_2500_var = le_2500_density / citywide_density - 1

    function formatPercent(value) {
        if (!isFinite(value)) {
            return '-'
        }
        return (value >= 0 ? '+':'') + Math.round(value * 100) + '%'
    }
    
    le_500_text = `500 ft: ${le_500_density} (${formatPercent(le_500_var)})`
    le_1000_text = `1000 ft: ${le_1000_density} (${formatPercent(le_1000_var)})`
    le_2500_text = `2500 ft: ${le_2500_density} (${formatPercent(le_2500_var)})`

    document.getElementById('density-citywide').textContent = `citywide: ${citywide}`
    document.getElementById('density-500').textContent = le_500_text
    document.getElementById('density-1000').textContent = le_1000_text
    document.getElementById('density-2500').textContent = le_2500_text
}

// handler for tree checkboxes on/off
function handleCheckBoxChange() {
    recalculateDensities()
}

// on page load, add logic to initialize map and enable selecting new location
document.addEventListener("DOMContentLoaded", function () {
    const map = L.map('map').setView([38.627003, -90.199402], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    
    // initialize marker
    let marker = L.marker([latitude,longitude]).addTo(map)

    // initialize 500 ft radius ring
    let circle500 = L.circle([latitude,longitude], {
        color: 'green',
        filledColor: 'green',
        fillOpacity: 0.2,
        radius: 152.4 // feet to meters
    }).addTo(map)

    // initialize 1000 ft radius ring
    let circle1000 = L.circle([latitude,longitude], {
        color: 'green',
        filledColor: 'green',
        fillOpacity: 0.1,
        radius: 304.8 // feet to meters
    }).addTo(map)

    // initialize 2500 ft radius ring
    let circle2500 = L.circle([latitude,longitude], {
        color: 'green',
        filledColor: 'green',
        fillOpacity: 0.1,
        radius: 762 // feet to meters
    }).addTo(map)

    // update latitude & longitude to marker's location
    // move marker and radii
    // update density data to reflect new marker
    map.on('click', async function (e) {
        latitude = e.latlng.lat
        longitude = e.latlng.lng
        marker.setLatLng(e.latlng)
        circle500.setLatLng(e.latlng)
        circle1000.setLatLng(e.latlng)
        circle2500.setLatLng(e.latlng)
        await updateDensityData()
    })

    // ask user for permission to use current location
    // if refused, use default location
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            
            map.setView([latitude,longitude], 13)
            marker.setLatLng([latitude,longitude])
            await updateDensityData()
        },
        async (error) => { 
            console.warn("Location access denied or failed. Using default location.", error)
            map.setView([latitude,longitude], 13)
            marker.setLatLng([latitude,longitude])
            await updateDensityData()
        }
    )
})