// Scriptable script to download and update itself and E2NovaCheckIn.sgmodule

// Function to download the file
async function downloadFile(url) {
    const request = new Request(url);
    return await request.loadString();
}

// Function to save the file to iCloud
function saveToICloud(content, fileName) {
    const fm = FileManager.iCloud();
    const surgePath = fm.documentsDirectory();
    if (!fm.isDirectory(surgePath)) {
        fm.createDirectory(surgePath);
    }

    const filePath = surgePath + fileName;
    fm.writeString(filePath, content);
    console.log(`File saved to ${filePath}`);
}

// Function to update this script
async function updateSelf() {
    const selfUrl = "https://raw.githubusercontent.com/LienCF/surge_modules/master/update_local_module.js";
    const selfFileName = "Update E2NovaCheckIn.sgmodule.js";

    try {
        const content = await downloadFile(selfUrl);
        const fm = FileManager.iCloud();
        const scriptPath = fm.joinPath(fm.documentsDirectory(), selfFileName);
        fm.writeString(scriptPath, content);
        console.log("Update E2NovaCheckIn.sgmodule.js has been successfully updated in iCloud Drive.");
    } catch (error) {
        console.error("Error updating Update E2NovaCheckIn.sgmodule.js:", error);
    }
}

// Main function
async function updateE2NovaCheckIn() {
    const url = "https://github.com/LienCF/surge_modules/raw/master/E2NovaCheckIn.sgmodule";
    const fileName = "E2NovaCheckIn.sgmodule";
}

// Run the script
await updateSelf();
await updateE2NovaCheckIn();

// Gracefully complete the script for use with Apple Shortcuts
Script.complete();
