"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./HomeComponents.module.scss";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import ky from "ky";
import Signature from "./Signature/Signature";
import Field from "./Field/Field";
import Actions from "./Actions/Actions";
import Modal from "@/shared/Modals/Modals";

export interface Page {
  id: string;
  imageData?: string;
  rotation: number;
}

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | null;

export interface PlacedSignature {
  id: string;
  signatureId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface PlacedText {
  id: string;
  pageId: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: "left" | "center" | "right";
  isEditing?: boolean;
  originalWidth?: number;
  originalFontSize?: number;
  isDragging?: boolean;
  dragStart?: { x: number; y: number };
  isResizing?: boolean;
  resizeHandle?: string | null;
  resizeStart?: { x: number; y: number; width: number; height: number };
  isRotating?: boolean;
  rotationStartAngle?: number;
  initialMouseAngle?: number;
}

const CONTAINER_HEIGHT = 300;

const HomeComponents: React.FC = () => {
  const id_user = Cookies.get("id_user");
  const token = Cookies.get("token");
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [show, setShow] = useState<boolean>(false);

  const [signatureType, setSignatureType] = useState<"Подпись" | "Печать">(
    "Подпись"
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 50,
    width: 30,
    height: 15,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    initialCursorX: number;
    initialCursorY: number;
    initialCropX: number;
    initialCropY: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{
    initialCropX: number;
    initialCropY: number;
    initialCropWidth: number;
    initialCropHeight: number;
    initialCursorX: number;
    initialCursorY: number;
  } | null>(null);

  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);

  const [opacity, setOpacity] = useState<number>(100);
  const [signatures, setSignatures] = useState<string[]>([]);
  const [isLoadingSignatures, setIsLoadingSignatures] =
    useState<boolean>(false);

  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropAreaRef = useRef<HTMLDivElement | null>(null);

  const [imgNaturalWidth, setImgNaturalWidth] = useState<number>(0);
  const [imgNaturalHeight, setImgNaturalHeight] = useState<number>(0);

  const [displayedImgWidth, setDisplayedImgWidth] = useState<number>(0);
  const [displayedImgHeight, setDisplayedImgHeight] = useState<number>(0);

  const [pageSignatures, setPageSignatures] = useState<{
    [key: string]: PlacedSignature[];
  }>({});

  const [pageTexts, setPageTexts] = useState<{ [key: string]: PlacedText[] }>(
    {}
  );
  const [isAddingText, setIsAddingText] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  interface AppStateSnapshot {
    pages: Page[];
    pageSignatures: { [key: string]: PlacedSignature[] };
    pageTexts: { [key: string]: PlacedText[] };
    currentPageIndex: number;
  }

  const [historyStack, setHistoryStack] = useState<AppStateSnapshot[]>([]);
  const [selectedElement, setSelectedElement] = useState<{
    type: "signature" | "text";
    id: string;
  } | null>(null);

  const pushToHistory = useCallback(() => {
    const snapshot: AppStateSnapshot = {
      pages: pages.map(({ id, imageData, rotation }) => ({
        id,
        imageData,
        rotation,
      })),
      pageSignatures: JSON.parse(JSON.stringify(pageSignatures)),
      pageTexts: JSON.parse(JSON.stringify(pageTexts)),
      currentPageIndex,
    };
    setHistoryStack((prev) => [...prev, snapshot]);
  }, [pages, pageSignatures, pageTexts, currentPageIndex]);

  const startAction = useCallback(() => {
    pushToHistory();
  }, [pushToHistory]);

  const handleCancel = useCallback(() => {
    setShow(false);
    setSelectedImage(null);
    setOpacity(100);
    setSignatureType("Подпись");
    setCropArea({ x: 50, y: 50, width: 30, height: 15 });
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeStart(null);
    setResizeHandle(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const undo = useCallback(() => {
    setHistoryStack((prevHistory) => {
      if (!Array.isArray(prevHistory) || prevHistory.length === 0)
        return prevHistory;
      const newHistory = prevHistory.slice(0, prevHistory.length - 1);
      const lastSnapshot = prevHistory[prevHistory.length - 1];
      setPages(lastSnapshot.pages);
      setPageSignatures(lastSnapshot.pageSignatures);
      setPageTexts(lastSnapshot.pageTexts);
      setCurrentPageIndex(lastSnapshot.currentPageIndex);
      return newHistory;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  useEffect(() => {
    const token = Cookies.get("token");
    const id_user = Cookies.get("id_user");
    if (token && id_user) {
      setUserLoggedIn(true);
      setIsLoadingSignatures(true);
      ky.get(
        `https://scan-back-production.up.railway.app/api/user/${id_user}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      )
        .json<{ signatures: string[] }>()
        .then((data) => {
          setSignatures(data.signatures);
        })
        .catch((err) => {
          console.error("Ошибка при загрузке подписей пользователя", err);
        })
        .finally(() => {
          setIsLoadingSignatures(false);
        });
    }
  }, []);

  useEffect(() => {
    if (userLoggedIn && id_user) {
      const LOCAL_STORAGE_KEY = `homeComponentsState_${id_user}`;
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        try {
          const parsedState: AppStateSnapshot = JSON.parse(savedState);
          if (parsedState.pages) setPages(parsedState.pages);
          if (parsedState.pageSignatures)
            setPageSignatures(parsedState.pageSignatures);
          if (parsedState.pageTexts) setPageTexts(parsedState.pageTexts);
          if (parsedState.currentPageIndex !== undefined)
            setCurrentPageIndex(parsedState.currentPageIndex);
        } catch (error) {
          console.error("Ошибка при загрузке состояния из localStorage", error);
        }
      }
    }
  }, [userLoggedIn, id_user]);

  useEffect(() => {
    if (userLoggedIn && id_user) {
      const LOCAL_STORAGE_KEY = `homeComponentsState_${id_user}`;
      const stateToSave: AppStateSnapshot = {
        pages,
        pageSignatures,
        pageTexts,
        currentPageIndex,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Ошибка при сохранении состояния в localStorage", error);
      }
    }
  }, [
    pages,
    pageSignatures,
    pageTexts,
    currentPageIndex,
    userLoggedIn,
    id_user,
  ]);

  const handleAddPages = useCallback(
    (newPages: Page[]) => {
      const pagesWithRotation = newPages.map((page) => ({
        ...page,
        rotation: 0,
      }));
      const updatedPages = [...pages, ...pagesWithRotation];
      setPages(updatedPages);
      setCurrentPageIndex(pages.length);
    },
    [pages]
  );

  const handleClosePage = useCallback(
    (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= pages.length) return;
      const confirmDelete = window.confirm(
        "Вы уверены, что хотите удалить страницу?"
      );
      if (confirmDelete) {
        pushToHistory();
        const newPages = pages.filter((_, index) => index !== pageIndex);

        if (pages[pageIndex]) {
          const pageId = pages[pageIndex].id;
          const updatedSigs = { ...pageSignatures };
          delete updatedSigs[pageId];
          setPageSignatures(updatedSigs);
          const updatedTexts = { ...pageTexts };
          delete updatedTexts[pageId];
          setPageTexts(updatedTexts);
        }

        setPages(newPages);
        if (currentPageIndex >= newPages.length && newPages.length > 0) {
          setCurrentPageIndex(newPages.length - 1);
        } else if (newPages.length === 0) {
          setCurrentPageIndex(0);
        }
      }
    },
    [pages, pushToHistory, pageSignatures, pageTexts, currentPageIndex]
  );

  const handlePageClick = useCallback((index: number) => {
    setCurrentPageIndex(index);
  }, []);

  const callSignatureModal = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];
        if (!allowedTypes.includes(file.type)) {
          alert("Допустимы только PNG, JPG или JPEG");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result && typeof ev.target.result === "string") {
            const img = new Image();
            img.onload = () => {
              setImgNaturalWidth(img.naturalWidth);
              setImgNaturalHeight(img.naturalHeight);
              setSelectedImage(ev.target!.result as string);
              setShow(true);
            };
            img.src = ev.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const cropAreaToOriginal = useCallback(() => {
    const { x, y, width, height } = cropArea;
    const cropX = (x / 100) * displayedImgWidth;
    const cropY = (y / 100) * displayedImgHeight;
    const cropWidth = (width / 100) * displayedImgWidth;
    const cropHeight = (height / 100) * displayedImgHeight;

    const origX = Math.round((cropX / displayedImgWidth) * imgNaturalWidth);
    const origY = Math.round((cropY / displayedImgHeight) * imgNaturalHeight);
    const origWidth = Math.round(
      (cropWidth / displayedImgWidth) * imgNaturalWidth
    );
    const origHeight = Math.round(
      (cropHeight / displayedImgHeight) * imgNaturalHeight
    );

    return { x: origX, y: origY, width: origWidth, height: origHeight };
  }, [
    cropArea,
    imgNaturalWidth,
    imgNaturalHeight,
    displayedImgWidth,
    displayedImgHeight,
  ]);

  const rgbToHsl = (
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  interface ColorRange {
    name: string;
    minOpacity: number;
    maxOpacity: number;
    isColorMatch: (h: number, s: number, l: number) => boolean;
  }

  const colorRanges: ColorRange[] = [
    {
      name: "Black",
      minOpacity: 0,
      maxOpacity: 4,
      isColorMatch: (h, s, l) => l <= 50,
    },
    {
      name: "Gray",
      minOpacity: 80,
      maxOpacity: 90,
      isColorMatch: (h, s, l) => s <= 10 && l > 50 && l <= 80,
    },
    {
      name: "White",
      minOpacity: 90,
      maxOpacity: 100,
      isColorMatch: (h, s, l) => l >= 95 && s <= 10,
    },
    {
      name: "Pink",
      minOpacity: 80,
      maxOpacity: 90,
      isColorMatch: (h, s, l) =>
        h >= 300 && h <= 360 && s >= 10 && s <= 100 && l >= 50 && l <= 95,
    },
    {
      name: "Pastel",
      minOpacity: 70,
      maxOpacity: 80,
      isColorMatch: (h, s, l) => s >= 10 && s <= 60 && l >= 60 && l <= 90,
    },
    {
      name: "Green",
      minOpacity: 60,
      maxOpacity: 70,
      isColorMatch: (h, s, l) =>
        h >= 60 && h <= 180 && s >= 20 && s <= 100 && l >= 10 && l <= 90,
    },
    {
      name: "Blue",
      minOpacity: 60,
      maxOpacity: 70,
      isColorMatch: (h, s, l) =>
        h >= 180 && h <= 270 && s >= 20 && s <= 100 && l >= 10 && l <= 90,
    },
    {
      name: "Brown",
      minOpacity: 50,
      maxOpacity: 60,
      isColorMatch: (h, s, l) =>
        h >= 0 && h <= 60 && s >= 20 && s <= 100 && l >= 10 && l <= 80,
    },
    {
      name: "Purple",
      minOpacity: 50,
      maxOpacity: 60,
      isColorMatch: (h, s, l) =>
        h >= 270 && h <= 300 && s >= 20 && s <= 100 && l >= 10 && l <= 80,
    },
    {
      name: "Beige",
      minOpacity: 40,
      maxOpacity: 50,
      isColorMatch: (h, s, l) =>
        h >= 20 && h <= 40 && s >= 10 && s <= 60 && l >= 60 && l <= 90,
    },
    {
      name: "Red",
      minOpacity: 30,
      maxOpacity: 40,
      isColorMatch: (h, s, l) =>
        ((h >= 0 && h <= 20) || (h > 340 && h <= 360)) &&
        s >= 20 &&
        s <= 100 &&
        l >= 10 &&
        l <= 90,
    },
    {
      name: "Yellow",
      minOpacity: 20,
      maxOpacity: 30,
      isColorMatch: (h, s, l) =>
        h >= 20 && h <= 60 && s >= 20 && s <= 100 && l >= 10 && l <= 90,
    },
    {
      name: "Orange",
      minOpacity: 10,
      maxOpacity: 20,
      isColorMatch: (h, s, l) =>
        h >= 60 && h <= 120 && s >= 20 && s <= 100 && l >= 10 && l <= 90,
    },
    {
      name: "BlueAdvanced",
      minOpacity: 0,
      maxOpacity: 10,
      isColorMatch: (h, s, l) =>
        h >= 180 && h <= 270 && s >= 20 && s <= 100 && l >= 10 && l <= 90,
    },
    {
      name: "GrayLight",
      minOpacity: 80,
      maxOpacity: 90,
      isColorMatch: (h, s, l) => s <= 10 && l >= 80 && l < 90,
    },
  ];

  const getAlphaFactor = (
    h: number,
    s: number,
    l: number,
    currentOpacity: number
  ): number => {
    for (const range of colorRanges) {
      if (range.isColorMatch(h, s, l)) {
        if (
          currentOpacity >= range.minOpacity &&
          currentOpacity < range.maxOpacity
        ) {
          const rangeSpan = range.maxOpacity - range.minOpacity;
          const opacityWithinRange = currentOpacity - range.minOpacity;
          const factor = opacityWithinRange / rangeSpan;
          return Math.max(0, Math.min(factor, 1));
        } else if (currentOpacity >= range.maxOpacity) {
          return 1;
        } else if (currentOpacity < range.minOpacity) {
          return 0;
        }
      }
    }
    return currentOpacity / 100;
  };

  const [previewDataURL, setPreviewDataURL] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const updatePreview = async () => {
      if (!selectedImage) {
        setPreviewDataURL(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = selectedImage;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      if (canceled) return;

      const maxWidth = 800;
      const scale =
        img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        const { h, s, l } = rgbToHsl(r, g, b);

        const alphaFactor = getAlphaFactor(h, s, l, opacity);

        if (alphaFactor < 1) {
          data[i + 3] = 0;
        } else {
          data[i + 3] = a * alphaFactor;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const dataURL = canvas.toDataURL("image/png");
      if (!canceled) {
        setPreviewDataURL(dataURL);
      }
    };

    updatePreview();

    return () => {
      canceled = true;
    };
  }, [selectedImage, opacity]);

  const getCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!selectedImage) return null;
    return new Promise<File | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = selectedImage;
      img.onload = () => {
        const { x, y, width, height } = cropAreaToOriginal();
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          const { h, s, l } = rgbToHsl(r, g, b);

          const alphaFactor = getAlphaFactor(h, s, l, opacity);

          if (alphaFactor < 1) {
            data[i + 3] = 0;
          } else {
            data[i + 3] = a * alphaFactor;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "signature.png", {
                type: "image/png",
              });
              resolve(file);
            } else {
              resolve(null);
            }
          },
          "image/png",
          1
        );
      };
      img.onerror = () => resolve(null);
    });
  }, [selectedImage, opacity, cropAreaToOriginal]);

  const handleSave = useCallback(async () => {
    const file = await getCroppedImage();
    if (!file) {
      alert("Не удалось обрезать изображение");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await ky
        .post("https://scan-back-production.up.railway.app/api/upload", {
          headers: {
            Authorization: `${token}`,
          },
          body: formData,
        })
        .json<{ path: string }>();

      const newPath = uploadResponse.path;

      if (newPath) {
        await ky.patch(
          `https://scan-back-production.up.railway.app/api/user/${id_user}`,
          {
            headers: {
              Authorization: `${token}`,
              "Content-Type": "application/json",
            },
            json: {
              signatures: signatures ? [...signatures, newPath] : [newPath],
            },
          }
        );
      }

      setSignatures((prev) => (prev ? [...prev, newPath] : [newPath]));
    } catch (err) {
      console.error("Ошибка при сохранении подписи", err);
      alert("Не удалось сохранить подпись.");
    } finally {
      setIsLoading(false);
      handleCancel();
    }
  }, [getCroppedImage, token, id_user, signatures, handleCancel]);

  const getHandleType = useCallback(
    (offsetX: number, offsetY: number): ResizeHandle => {
      const { x, y, width, height } = cropArea;
      const handleSize = 5;

      if (
        Math.abs(offsetX - x) <= handleSize &&
        Math.abs(offsetY - y) <= handleSize
      )
        return "nw";

      if (
        Math.abs(offsetX - (x + width)) <= handleSize &&
        Math.abs(offsetY - y) <= handleSize
      )
        return "ne";

      if (
        Math.abs(offsetX - x) <= handleSize &&
        Math.abs(offsetY - (y + height)) <= handleSize
      )
        return "sw";

      if (
        Math.abs(offsetX - (x + width)) <= handleSize &&
        Math.abs(offsetY - (y + height)) <= handleSize
      )
        return "se";

      return null;
    },
    [cropArea]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !imgRef.current) return;
      if (!isDragging && !isResizing) return;

      const imgRect = imgRef.current.getBoundingClientRect();

      const relativeX = ((clientX - imgRect.left) / imgRect.width) * 100;
      const relativeY = ((clientY - imgRect.top) / imgRect.height) * 100;

      if (isDragging && dragStart) {
        const deltaX = relativeX - dragStart.initialCursorX;
        const deltaY = relativeY - dragStart.initialCursorY;

        let newX = dragStart.initialCropX + deltaX;
        let newY = dragStart.initialCropY + deltaY;

        newX = Math.max(0, Math.min(newX, 100 - cropArea.width));
        newY = Math.max(0, Math.min(newY, 100 - cropArea.height));

        setCropArea((prev) => ({
          ...prev,
          x: newX,
          y: newY,
        }));
      }

      if (isResizing && resizeStart && resizeHandle) {
        const deltaX = relativeX - resizeStart.initialCursorX;
        const deltaY = relativeY - resizeStart.initialCursorY;

        let newX = resizeStart.initialCropX;
        let newY = resizeStart.initialCropY;
        let newWidth = resizeStart.initialCropWidth;
        let newHeight = resizeStart.initialCropHeight;

        const minSize = 5;

        switch (resizeHandle) {
          case "nw":
            newX = resizeStart.initialCropX + deltaX;
            newY = resizeStart.initialCropY + deltaY;
            newWidth = resizeStart.initialCropWidth - deltaX;
            newHeight = resizeStart.initialCropHeight - deltaY;
            break;
          case "ne":
            newY = resizeStart.initialCropY + deltaY;
            newWidth = resizeStart.initialCropWidth + deltaX;
            newHeight = resizeStart.initialCropHeight - deltaY;
            break;
          case "sw":
            newX = resizeStart.initialCropX + deltaX;
            newWidth = resizeStart.initialCropWidth - deltaX;
            newHeight = resizeStart.initialCropHeight + deltaY;
            break;
          case "se":
            newWidth = resizeStart.initialCropWidth + deltaX;
            newHeight = resizeStart.initialCropHeight + deltaY;
            break;
          default:
            break;
        }

        if (newWidth < minSize) {
          if (resizeHandle === "nw" || resizeHandle === "sw") {
            newX =
              resizeStart.initialCropX +
              (resizeStart.initialCropWidth - minSize);
          }
          newWidth = minSize;
        }
        if (newHeight < minSize) {
          if (resizeHandle === "nw" || resizeHandle === "ne") {
            newY =
              resizeStart.initialCropY +
              (resizeStart.initialCropHeight - minSize);
          }
          newHeight = minSize;
        }

        if (resizeHandle === "nw" || resizeHandle === "sw") {
          newX = Math.max(0, newX);
        }
        if (resizeHandle === "nw" || resizeHandle === "ne") {
          newY = Math.max(0, newY);
        }

        if (newX + newWidth > 100) {
          newWidth = 100 - newX;
        }
        if (newY + newHeight > 100) {
          newHeight = 100 - newY;
        }

        setCropArea({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      resizeHandle,
      cropArea.width,
      cropArea.height,
    ]
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    const onPointerUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setIsResizing(false);
      setResizeStart(null);
      setResizeHandle(null);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };
    const onTouchEnd = () => {
      setIsDragging(false);
      setDragStart(null);
      setIsResizing(false);
      setResizeStart(null);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);

      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isDragging, isResizing, handleMove]);

  const handleStartDragOrResize = useCallback(
    (e: PointerEvent | TouchEvent, clientX: number, clientY: number) => {
      if (!containerRef.current || !imgRef.current) return;
      const imgRect = imgRef.current.getBoundingClientRect();

      const relativeX = ((clientX - imgRect.left) / imgRect.width) * 100;
      const relativeY = ((clientY - imgRect.top) / imgRect.height) * 100;

      const hType = getHandleType(relativeX, relativeY);
      if (hType) {
        startAction();
        setIsResizing(true);
        setResizeHandle(hType);
        setResizeStart({
          initialCropX: cropArea.x,
          initialCropY: cropArea.y,
          initialCropWidth: cropArea.width,
          initialCropHeight: cropArea.height,
          initialCursorX: relativeX,
          initialCursorY: relativeY,
        });
      } else {
        const { x, y, width, height } = cropArea;
        if (
          relativeX >= x &&
          relativeX <= x + width &&
          relativeY >= y &&
          relativeY <= y + height
        ) {
          startAction();
          setIsDragging(true);
          setDragStart({
            initialCursorX: relativeX,
            initialCursorY: relativeY,
            initialCropX: cropArea.x,
            initialCropY: cropArea.y,
          });
        }
      }
    },
    [getHandleType, startAction, cropArea]
  );

  const renderHandles = (cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const handleStyle = (
      cursor: string,
      top?: string,
      left?: string,
      right?: string,
      bottom?: string
    ) => ({
      position: "absolute" as const,
      width: "10px",
      height: "10px",
      background: "var(--primary-color)",
      borderRadius: "50%",
      cursor,
      top,
      left,
      right,
      bottom,
      zIndex: 10,
    });

    return (
      <>
        <div
          style={handleStyle("nw-resize", "-5px", "-5px", undefined, undefined)}
        />
        <div
          style={handleStyle("ne-resize", "-5px", undefined, "-5px", undefined)}
        />
        <div
          style={handleStyle("sw-resize", undefined, "-5px", undefined, "-5px")}
        />
        <div
          style={handleStyle("se-resize", undefined, undefined, "-5px", "-5px")}
        />
      </>
    );
  };

  const handleSelectSignature = useCallback(
    async (sig: string) => {
      if (pages.length === 0) {
        alert("Сначала загрузите документ.");
        return;
      }
      const currentId = pages[currentPageIndex].id;

      const img = new Image();
      img.src = sig;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const aspectRatio = img.naturalWidth / img.naturalHeight;

      const newPlaced: PlacedSignature = {
        id: `${Date.now()}-${Math.random()}`,
        signatureId: sig,
        x: 10,
        y: 10,
        width: 30,
        height: 20 / aspectRatio,
        angle: 0,
      };
      setPageSignatures((prev) => {
        const existing = prev[currentId] || [];
        return {
          ...prev,
          [currentId]: [...existing, newPlaced],
        };
      });
    },
    [pages, currentPageIndex]
  );

  const handleDeleteSignature = useCallback(
    async (sig: string) => {
      const confirmDelete = window.confirm(
        "Вы уверены, что хотите удалить подпись?"
      );
      if (confirmDelete) {
        pushToHistory();
        try {
          const updatedSignatures = signatures.filter((s) => s !== sig);

          await ky.patch(
            `https://scan-back-production.up.railway.app/api/user/${id_user}`,
            {
              headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
              },
              json: {
                signatures: updatedSignatures,
              },
            }
          );

          setSignatures(updatedSignatures);
        } catch (err) {
          console.error("Ошибка при удалении подписи", err);
          alert("Не удалось удалить подпись.");
        }
      }
    },
    [signatures, pushToHistory, token, id_user]
  );

  const handleUpdatePlacedSignatures = useCallback(
    (updated: PlacedSignature[]) => {
      const currentId = pages[currentPageIndex]?.id;
      if (!currentId) return;
      setPageSignatures((prev) => ({
        ...prev,
        [currentId]: updated,
      }));
    },
    [pages, currentPageIndex]
  );

  const handleDeletePlacedSignature = useCallback(
    (id: string) => {
      const confirmDelete = window.confirm(
        "Вы уверены, что хотите удалить размещенную подпись?"
      );
      if (confirmDelete) {
        pushToHistory();
        const currentId = pages[currentPageIndex].id;
        const updated = (pageSignatures[currentId] || []).filter(
          (p) => p.id !== id
        );
        setPageSignatures((prev) => ({
          ...prev,
          [currentId]: updated,
        }));
      }
    },
    [pages, currentPageIndex, pageSignatures, pushToHistory]
  );

  const handleAddTextMode = useCallback(() => {
    if (pages.length === 0) {
      alert("Сначала загрузите документ!");
      return;
    }
    setIsAddingText(true);
  }, [pages.length]);

  const handleAddText = useCallback(
    (text: string) => {
      setIsAddingText(false);
      if (!text.trim()) return;
      const currentId = pages[currentPageIndex]?.id;
      if (!currentId) return;

      const newText: PlacedText = {
        id: `${Date.now()}-${Math.random()}`,
        pageId: currentId,
        text: text,
        x: 10,
        y: 10,
        width: 20,
        height: 5,
        angle: 0,
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#000000",
        isBold: false,
        isItalic: false,
        textAlign: "left",
        originalWidth: 20,
        originalFontSize: 16,
      };

      setPageTexts((prev) => {
        const existing = prev[currentId] || [];
        return {
          ...prev,
          [currentId]: [...existing, newText],
        };
      });
    },
    [pages, currentPageIndex]
  );

  const handleUpdatePlacedTexts = useCallback(
    (updated: PlacedText[]) => {
      const currentId = pages[currentPageIndex]?.id;
      if (!currentId) return;
      setPageTexts((prev) => ({
        ...prev,
        [currentId]: updated,
      }));
    },
    [pages, currentPageIndex]
  );

  const handleDeletePlacedText = useCallback(
    (id: string) => {
      const confirmDelete = window.confirm("Удалить этот текст?");
      if (confirmDelete) {
        pushToHistory();
        const currentId = pages[currentPageIndex].id;
        const updated = (pageTexts[currentId] || []).filter((t) => t.id !== id);
        setPageTexts((prev) => ({
          ...prev,
          [currentId]: updated,
        }));
      }
    },
    [pages, currentPageIndex, pageTexts, pushToHistory]
  );

  const handleDeleteDocument = useCallback(() => {
    const confirmDelete = window.confirm("Удалить весь документ?");
    if (confirmDelete) {
      pushToHistory();
      setPages([]);
      setPageSignatures({});
      setPageTexts({});
      setCurrentPageIndex(0);
    }
  }, [pushToHistory]);

  const handleRotate = useCallback(() => {
    pushToHistory();
    setPages((prevPages) =>
      prevPages.map((page, index) =>
        index === currentPageIndex
          ? { ...page, rotation: page.rotation === 0 ? 90 : 0 }
          : page
      )
    );
  }, [currentPageIndex, pushToHistory]);

  const handleApplyToAllPages = useCallback(() => {
    if (pages.length === 0 || !selectedElement) return;
    pushToHistory();

    const newPageSignatures = { ...pageSignatures };
    const newPageTexts = { ...pageTexts };

    if (selectedElement.type === "signature") {
      const selectedSignature = (
        pageSignatures[pages[currentPageIndex].id] || []
      ).find((s) => s.id === selectedElement.id);
      if (!selectedSignature) return;

      for (const page of pages) {
        if (page.id !== pages[currentPageIndex].id) {
          const copiedSignature: PlacedSignature = {
            ...selectedSignature,
            id: `${Date.now()}-${Math.random()}`,
          };
          newPageSignatures[page.id] = [
            ...(newPageSignatures[page.id] || []),
            copiedSignature,
          ];
        }
      }
    }

    if (selectedElement.type === "text") {
      const selectedText = (pageTexts[pages[currentPageIndex].id] || []).find(
        (t) => t.id === selectedElement.id
      );
      if (!selectedText) return;

      for (const page of pages) {
        if (page.id !== pages[currentPageIndex].id) {
          const copiedText: PlacedText = {
            ...selectedText,
            id: `${Date.now()}-${Math.random()}`,
            pageId: page.id,
          };
          newPageTexts[page.id] = [
            ...(newPageTexts[page.id] || []),
            copiedText,
          ];
        }
      }
    }

    setPageSignatures(newPageSignatures);
    setPageTexts(newPageTexts);
    setSelectedElement(null);
  }, [
    pages,
    currentPageIndex,
    pageSignatures,
    pageTexts,
    selectedElement,
    pushToHistory,
  ]);

  const exportRef = useRef<HTMLDivElement | null>(null);
  const hiddenExportRef = useRef<HTMLDivElement | null>(null);

  const handleExportJPG = useCallback(async () => {
    if (!hiddenExportRef.current) {
      alert("Документ не найден для экспорта.");
      return;
    }

    setIsLoading(true);

    try {
      const zip = new JSZip();
      const exportPages =
        hiddenExportRef.current.querySelectorAll(".export-page");

      if (exportPages.length === 0) {
        alert("Нет страниц для экспорта.");
        setIsLoading(false);
        return;
      }

      const promises: Promise<void>[] = [];

      exportPages.forEach((page, index) => {
        const promise = html2canvas(page as HTMLElement, {
          scale: 3,
          useCORS: true,
        }).then((canvas) => {
          const imgData = canvas.toDataURL("image/jpeg", 1.0);
          const imgDataClean = imgData.replace(
            /^data:image\/(png|jpe?g);base64,/,
            ""
          );
          zip.file(`page_${index + 1}.jpg`, imgDataClean, { base64: true });
        });
        promises.push(promise);
      });

      await Promise.all(promises);
      const zipContent = await zip.generateAsync({ type: "blob" });
      saveAs(zipContent, "document_pages.zip");
    } catch (error) {
      console.error("Ошибка при экспорте в JPG:", error);
      alert("Не удалось экспортировать документ в JPG.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!hiddenExportRef.current) {
      alert("Документ не найден для экспорта.");
      return;
    }

    setIsLoading(true);

    try {
      const exportPages =
        hiddenExportRef.current.querySelectorAll(".export-page");

      if (exportPages.length === 0) {
        alert("Нет страниц для экспорта.");
        setIsLoading(false);
        return;
      }

      const pdfPagesData: {
        imgData: string;
        isLandscape: boolean;
      }[] = [];

      for (let i = 0; i < exportPages.length; i++) {
        const pageElement = exportPages[i] as HTMLElement;

        const rotation = parseInt(
          pageElement.getAttribute("data-rotation") || "0",
          10
        );
        const isLandscape = rotation === 90 || rotation === 270;

        const canvas = await html2canvas(pageElement, {
          scale: 3,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        pdfPagesData.push({ imgData, isLandscape });
      }

      if (pdfPagesData.length === 0) {
        alert("Нет данных для создания PDF.");
        setIsLoading(false);
        return;
      }

      const firstPage = pdfPagesData[0];
      const pdf = new jsPDF({
        orientation: firstPage.isLandscape ? "landscape" : "portrait",
        unit: "px",
        format: "a4",
      });

      pdf.addImage(
        firstPage.imgData,
        "JPEG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight()
      );

      for (let i = 1; i < pdfPagesData.length; i++) {
        const page = pdfPagesData[i];
        pdf.addPage(
          [
            page.isLandscape
              ? pdf.internal.pageSize.getHeight()
              : pdf.internal.pageSize.getWidth(),
            page.isLandscape
              ? pdf.internal.pageSize.getWidth()
              : pdf.internal.pageSize.getHeight(),
          ],
          page.isLandscape ? "landscape" : "portrait"
        );
        pdf.addImage(
          page.imgData,
          "JPEG",
          0,
          0,
          pdf.internal.pageSize.getWidth(),
          pdf.internal.pageSize.getHeight()
        );
      }

      pdf.save("document.pdf");
    } catch (error) {
      console.error("Ошибка при экспорте в PDF:", error);
      alert("Не удалось экспортировать документ в PDF.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (imgRef.current && containerRef.current) {
      const updateDisplayedSize = () => {
        const img = imgRef.current;
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerWidth / containerHeight;

        if (imgAspect > containerAspect) {
          setDisplayedImgWidth(containerWidth);
          setDisplayedImgHeight(containerWidth / imgAspect);
        } else {
          setDisplayedImgHeight(containerHeight);
          setDisplayedImgWidth(containerHeight * imgAspect);
        }
      };

      updateDisplayedSize();

      window.addEventListener("resize", updateDisplayedSize);
      return () => {
        window.removeEventListener("resize", updateDisplayedSize);
      };
    }
  }, [selectedImage]);

  return (
    <>
      <input
        type="file"
        style={{ display: "none" }}
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/jpg"
        onChange={onFileChange}
      />

      <Modal isOpen={show} onClose={handleCancel}>
        <div style={{ userSelect: "none" }}>
          <div className={styles.modal}>
            <label className={styles.modal__dropdown}>
              <small>Тип:</small>
              <select
                value={signatureType}
                onChange={(e) =>
                  setSignatureType(e.target.value as "Подпись" | "Печать")
                }
              >
                <option value="Подпись">Подпись</option>
                <option value="Печать">Печать</option>
              </select>
            </label>

            {selectedImage && (
              <div
                ref={containerRef}
                style={{
                  position: "relative",
                  width: "100%",
                  height: `${CONTAINER_HEIGHT}px`,
                  border: "1px solid #ccc",
                  overflow: "hidden",
                  touchAction: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (containerRef.current) {
                    containerRef.current.setPointerCapture(e.pointerId);
                  }
                  handleStartDragOrResize(e, e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (e.touches.length > 0) {
                    const touch = e.touches[0];
                    handleStartDragOrResize(e, touch.clientX, touch.clientY);
                  }
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: `${displayedImgWidth}px`,
                    height: `${displayedImgHeight}px`,
                  }}
                >
                  <img
                    ref={imgRef}
                    src={previewDataURL || selectedImage}
                    alt="Selected"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                    }}
                    onLoad={() => {
                      if (imgRef.current && containerRef.current) {
                        const img = imgRef.current;
                        const container = containerRef.current;
                        const containerWidth = container.clientWidth;
                        const containerHeight = container.clientHeight;

                        const imgAspect = img.naturalWidth / img.naturalHeight;
                        const containerAspect =
                          containerWidth / containerHeight;

                        if (imgAspect > containerAspect) {
                          setDisplayedImgWidth(containerWidth);
                          setDisplayedImgHeight(containerWidth / imgAspect);
                        } else {
                          setDisplayedImgHeight(containerHeight);
                          setDisplayedImgWidth(containerHeight * imgAspect);
                        }
                      }
                    }}
                  />
                  <div
                    ref={cropAreaRef}
                    style={{
                      position: "absolute",
                      top: `${cropArea.y}%`,
                      left: `${cropArea.x}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                      border: "2px dashed var(--primary-color)",
                      boxSizing: "border-box",
                      cursor: resizeHandle ? `${resizeHandle}-resize` : "move",
                    }}
                  >
                    {renderHandles(cropArea)}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.modal__range}>
              <span>Прозрачность: {opacity}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
              />
            </div>

            <div className={styles.modal__buttons}>
              <button onClick={handleCancel} className={styles.modal__button}>
                Отменить
              </button>
              <button onClick={handleSave} className={styles.modal__button}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <div className={styles.body}>
        <Signature
          callSignatureModal={callSignatureModal}
          signatures={signatures}
          onSelectSignature={handleSelectSignature}
          onDeleteSignature={handleDeleteSignature}
          isDocumentLoaded={pages.length > 0}
          isLoading={isLoadingSignatures}
          onAddText={handleAddTextMode}
        />
        <div ref={exportRef}>
          <Field
            pages={pages}
            setPages={setPages}
            currentPageIndex={currentPageIndex}
            setCurrentPageIndex={setCurrentPageIndex}
            onAddPages={handleAddPages}
            onClosePage={handleClosePage}
            handlePageClick={handlePageClick}
            signatures={signatures}
            placedSignatures={pageSignatures[pages[currentPageIndex]?.id] || []}
            onUpdatePlacedSignatures={handleUpdatePlacedSignatures}
            onDeletePlacedSignature={handleDeletePlacedSignature}
            placedTexts={pageTexts[pages[currentPageIndex]?.id] || []}
            onUpdatePlacedTexts={handleUpdatePlacedTexts}
            onDeletePlacedText={handleDeletePlacedText}
            isAddingText={isAddingText}
            onAddText={handleAddText}
            rotation={pages[currentPageIndex]?.rotation || 0}
            startAction={startAction}
            setIsLoading={setIsLoading}
            setSelectedElement={setSelectedElement}
          />
        </div>
        <Actions
          onDeleteDocument={handleDeleteDocument}
          onUndo={undo}
          onRotate={handleRotate}
          isApplyAllEnabled={selectedElement !== null}
          onApplyToAll={handleApplyToAllPages}
          isDocumentLoaded={pages.length > 0}
          onExportJPG={handleExportJPG}
          onExportPDF={handleExportPDF}
        />
      </div>

      <div
        ref={hiddenExportRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
        }}
      >
        {pages.map((page, index) => {
          const rotation = page.rotation;
          const isLandscape = rotation === 90 || rotation === 270;
          const pageHeightValue = "75vh";
          const pageWidthValue = isLandscape
            ? `calc(75vh * (297/210))`
            : `calc(75vh * (210/297))`;

          return (
            <div
              key={page.id}
              className="export-page"
              data-rotation={rotation}
              style={{
                position: "relative",
                width: pageWidthValue,
                height: pageHeightValue,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={page.imageData || ""}
                alt={`page_${index + 1}`}
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  display: "block",
                }}
              />
              {(pageSignatures[page.id] || []).map((ps) => {
                const sig = signatures.find((s) => s === ps.signatureId);
                if (!sig) return null;
                return (
                  <div
                    key={ps.id}
                    style={{
                      position: "absolute",
                      top: `${ps.y}%`,
                      left: `${ps.x}%`,
                      width: `${ps.width}%`,
                      height: `${ps.height}%`,
                      transform: `rotate(${ps.angle}deg)`,
                      transformOrigin: "center center",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={sig}
                      alt="Подпись"
                      style={{
                        width: "auto",
                        height: "auto",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        display: "block",
                      }}
                    />
                  </div>
                );
              })}
              {(pageTexts[page.id] || []).map((t) => (
                <div
                  key={t.id}
                  style={{
                    position: "absolute",
                    top: `${t.y}%`,
                    left: `${t.x}%`,
                    width: `${t.width}%`,
                    height: `${t.height}%`,
                    transform: `rotate(${t.angle}deg)`,
                    transformOrigin: "center center",
                    fontFamily: t.fontFamily,
                    fontSize: t.fontSize,
                    color: t.color,
                    fontWeight: t.isBold ? "bold" : "normal",
                    fontStyle: t.isItalic ? "italic" : "normal",
                    textAlign: t.textAlign,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {t.text}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}></div>
        </div>
      )}
    </>
  );
};

export default HomeComponents;
