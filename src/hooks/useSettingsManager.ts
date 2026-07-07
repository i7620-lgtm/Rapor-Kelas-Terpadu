import { useCallback } from "react";
import { deleteImageFromDB, processAndCompressImage, saveImageToDB, getImageDimensions } from "../utils/imageDB";

export const useSettingsManager = ({
  settings,
  setSettings,
  setPendingSemester,
  setShowSemesterModal,
  showToast,
}) => {
  const handleSettingsChange = useCallback((keyOrEvent, value) => {
    let key;
    let actualValue;
    let isFile = false;
    let isRemoveImage = false;
    let isProcessedFile = false;

    if (keyOrEvent && typeof keyOrEvent === "object" && "target" in keyOrEvent) {
      const target = keyOrEvent.target;
      key = target.name || target.id;
      if (target.type === "checkbox") {
        actualValue = target.checked;
      } else if (target.type === "file" || (target.files && target.files.length > 0)) {
        isFile = true;
        actualValue = target.files;
      } else if (target.type === "remove_image" || (target.name === key && target.type === "remove_image")) {
        isRemoveImage = true;
        actualValue = null;
      } else if (target.type === "file_processed") {
        isProcessedFile = true;
        actualValue = target.value;
      } else {
        actualValue = target.value;
      }
    } else {
      key = keyOrEvent;
      actualValue = value;
    }

    if (!key) return;

    if (isRemoveImage) {
      deleteImageFromDB(key)
        .then(() => {
          setSettings((prev) => ({ ...prev, [key]: null }));
          showToast("Gambar berhasil dihapus.", "success");
        })
        .catch((err) => {
          console.error("Failed to delete image", err);
          setSettings((prev) => ({ ...prev, [key]: null }));
        });
      return;
    }

    if (isProcessedFile) {
      try {
        const dataURLtoBlob = (dataurl) => {
          let arr = dataurl.split(","),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };
        const imgBlob = dataURLtoBlob(actualValue);
        const dims = getImageDimensions(key);
        processAndCompressImage(imgBlob, dims.width, dims.height)
          .then((compressedBlob) => {
            saveImageToDB(key, compressedBlob).then(() => {
              const url = URL.createObjectURL(compressedBlob);
              setSettings((prev) => ({ ...prev, [key]: url }));
              showToast("Latar belakang gambar berhasil transparan & disimpan!", "success");
            });
          })
          .catch((err) =>
            console.error("Error compressing file_processed image", err)
          );
      } catch (e) {
        console.error("Failed to parse base64 for file_processed", e);
      }
      return;
    }

    if (isFile) {
      const files = actualValue;
      if (files && files.length > 0) {
        const file = files[0];
        const dims = getImageDimensions(key);
        processAndCompressImage(file, dims.width, dims.height)
          .then((compressedBlob) => {
            saveImageToDB(key, compressedBlob)
              .then(() => {
                const url = URL.createObjectURL(compressedBlob);
                setSettings((prev) => ({ ...prev, [key]: url }));
                showToast("Gambar berhasil disimpan!", "success");
              })
              .catch((err) => {
                console.error("Failed to save image to DB", err);
                showToast(
                  "Gagal menyimpan gambar ke database lokal.",
                  "error"
                );
              });
          })
          .catch((err) => {
            console.error("Failed to compress image", err);
            showToast("Gagal memproses gambar.", "error");
          });
      }
      return;
    }

    if (key === "semester" && actualValue !== settings.semester) {
      setPendingSemester(actualValue);
      setShowSemesterModal(true);
    } else {
      if (key.includes(".")) {
        const parts = key.split(".");
        setSettings((prev) => {
          const current = { ...prev };
          let pointer = current;
          for (let i = 0; i < parts.length - 1; i++) {
            pointer[parts[i]] = { ...pointer[parts[i]] };
            pointer = pointer[parts[i]];
          }
          pointer[parts[parts.length - 1]] = actualValue;

          if (parts[0] === "predikats") {
            const valA = parseInt(current.predikats?.a || "90", 10);
            const valB = parseInt(current.predikats?.b || "80", 10);
            const valC = parseInt(current.predikats?.c || "70", 10);
            const valD = parseInt(current.predikats?.d || "0", 10);

            current.qualitativeGradingMap = {
              A: { min: valA, max: 100 },
              B: { min: valB, max: valA - 1 },
              C: { min: valC, max: valB - 1 },
              D: { min: valD, max: valC - 1 },
            };
          }

          return current;
        });
      } else {
        setSettings((prev) => ({ ...prev, [key]: actualValue }));
      }
    }
  }, [
    settings?.semester,
    setSettings,
    setPendingSemester,
    setShowSemesterModal,
    showToast,
  ]);

  return { handleSettingsChange };
};
