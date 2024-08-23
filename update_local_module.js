// Scriptable script to download and store E2NovaCheckIn.sgmodule

// Function to download the file
async function downloadFile(url) {
    const request = new Request(url);
    return await request.loadString();
}

// Function to save the file to iCloud
function saveToICloud(content, fileName) {
    const fm = FileManager.iCloud();
    const surgePath = fm.documentsDirectory() + "/Surge/";

    if (!fm.isDirectory(surgePath)) {
        fm.createDirectory(surgePath);
    }

    const filePath = surgePath + fileName;
    fm.writeString(filePath, content);
    console.log(`File saved to ${filePath}`);
}

// Main function
async function updateE2NovaCheckIn() {
    const url = "https://github.com/LienCF/surge_modules/raw/master/E2NovaCheckIn.sgmodule";
    const fileName = "E2NovaCheckIn.sgmodule";

    try {
        const content = await downloadFile(url);
        saveToICloud(content, fileName);
        console.log("E2NovaCheckIn.sgmodule has been successfully updated.");
    } catch (error) {
        console.error("Error updating E2NovaCheckIn.sgmodule:", error);
    }
}

// Run the script
await updateE2NovaCheckIn();

// Gracefully complete the script for use with Apple Shortcuts
Script.complete();
