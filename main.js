const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

let provinceMap = new Image();
provinceMap.src = "./img/map/province_map.png";

let provinceData = [];
let countryData = {};
let provinceByColor = {};

let ownership = {};

provinceMap.onload = async () => {
    ctx.drawImage(provinceMap, 0, 0);

    const [provinceJson, countryJson] = await Promise.all([
        fetch("./data/provincedata.json").then(res => res.json()),
                                                          fetch("./data/countrydata.json").then(res => res.json())
    ]);

    provinceData = provinceJson;
    ownership = {};

    // Build country color lookup
    countryJson.forEach(c => {
        countryData[c.tag] = {
            name: c.name,
            color: c.color
        };
    });

    // Build province lookup and ownership map
    provinceData.forEach(p => {
        provinceByColor[p.idColor.toLowerCase()] = p;
        ownership[p.idColor.toLowerCase()] = p.owner;
    });

    recolorMap();
};

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    const province = provinceByColor[hex];
    if (!province) {
        console.log("Clicked non-province color:", hex);
        return;
    }

    // Toggle owner
    const currentOwner = ownership[hex];
    const newOwner = currentOwner === "uk" ? "ire" : "uk";
    ownership[hex] = newOwner;

    console.log(`Province "${province.name}" changed from ${currentOwner} to ${newOwner}`);
    recolorMap();
});

function recolorMap() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const hex = rgbToHex(r, g, b);
        const ownerTag = ownership[hex];
        const country = countryData[ownerTag];

        if (country) {
            const newColor = hexToRgb(country.color);
            data[i] = newColor.r;
            data[i + 1] = newColor.g;
            data[i + 2] = newColor.b;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("").toLowerCase();
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}
