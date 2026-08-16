/**
 * ====================================================================
 * RAJINQU - GOOGLE APPS SCRIPT (GAS) FOR GOOGLE DRIVE IMAGE UPLOADS
 * ====================================================================
 * Petunjuk Penggunaan:
 * 1. Buka https://script.google.com/
 * 2. Buat Project Baru, beri nama "RajinQu GDrive Upload Bridge"
 * 3. Copy-paste seluruh kode di bawah ini ke editor code.gs
 * 4. Ganti FOLDER_NAME atau biarkan default "RajinQu_Santri_Uploads"
 * 5. Klik "Deploy" -> "New Deployment"
 * 6. Pilih tipe: "Web App"
 * 7. Konfigurasi:
 *    - Description: "RajinQu Upload Endpoint v1"
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone" (PENTING: Pilih "Anyone" agar bisa diakses dari Next.js)
 * 8. Klik Deploy & Authorize Access
 * 9. Salin "Web App URL" dan masukkan ke .env sebagai GOOGLE_APPS_SCRIPT_URL
 */

const DEFAULT_FOLDER_NAME = "RajinQu_Santri_Uploads";

function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const payload = JSON.parse(jsonString);

    const base64Data = payload.image; // e.g., "data:image/jpeg;base64,/9j/4AAQSkZJRg..." or raw base64
    const fileName = payload.fileName || "kegiatan_" + new Date().getTime() + ".jpg";
    const mimeType = payload.mimeType || "image/jpeg";
    const santriName = payload.santriName || "Santri";
    const kegiatanName = payload.kegiatanName || "Kegiatan";

    if (!base64Data) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No image base64 data provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Ekstrak base64 murni jika ada prefix data URL
    let cleanBase64 = base64Data;
    if (base64Data.indexOf(",") > -1) {
      cleanBase64 = base64Data.split(",")[1];
    }

    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    // Cari atau buat folder tujuan
    const targetFolder = getOrCreateFolder(DEFAULT_FOLDER_NAME);

    // Buat file di Google Drive
    const file = targetFolder.createFile(blob);
    
    // Set file agar bisa dilihat publik (Public Read Only)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Set deskripsi metadata
    const desc = "Laporan Santri: " + santriName + " | Kegiatan: " + kegiatanName + " | Upload: " + new Date().toISOString();
    file.setDescription(desc);

    const fileId = file.getId();
    const webViewLink = file.getUrl();
    // Direct link untuk display gambar di web (thumbnail / uc export)
    const directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    const downloadUrl = file.getDownloadUrl();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileId: fileId,
      fileName: fileName,
      fileUrl: directImageUrl,
      previewUrl: webViewLink,
      downloadUrl: downloadUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "RajinQu Google Drive Image Uploader",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    const newFolder = DriveApp.createFolder(folderName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFolder;
  }
}
