import styles from "./Field.module.scss";
import FieldPagination from "./FieldPagination/FieldPagination";
import FieldTextConfig from "./FieldTextConfig/FieldTextConfig";
import {
  useRef,
  ChangeEvent,
  DragEvent,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { Page, PlacedSignature, PlacedText } from "..";
import { AddPageIcon, RotateIcon } from "@/components/Icons/Icons";
import Cookies from "js-cookie";
import ky from "ky";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function degreesToRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function getLocalCoords(
  ps: { x: number; y: number; width: number; height: number; angle: number },
  offsetX: number,
  offsetY: number
) {
  const angle = ps.angle || 0;
  const centerX = ps.x + ps.width / 2;
  const centerY = ps.y + ps.height / 2;

  const dx = offsetX - centerX;
  const dy = offsetY - centerY;

  const angleRad = degreesToRadians(angle);
  const cosA = Math.cos(-angleRad);
  const sinA = Math.sin(-angleRad);

  const localX = dx * cosA - dy * sinA;
  const localY = dx * sinA + dy * cosA;

  const localLeft = localX + ps.width / 2;
  const localTop = localY + ps.height / 2;

  return { localX: localLeft, localY: localTop };
}

interface PlacedSignatureExtended extends PlacedSignature {
  aspectRatio?: number;
  isDragging?: boolean;
  dragStart?: { x: number; y: number };
  isResizing?: boolean;
  resizeHandle?: string | null;
  resizeStart?: { x: number; y: number; width: number; height: number };
  isRotating?: boolean;
  rotationStartAngle?: number;
  initialMouseAngle?: number;
}

interface FieldProps {
  pages: Page[];
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  currentPageIndex: number;
  setCurrentPageIndex: React.Dispatch<React.SetStateAction<number>>;
  onAddPages: (newPages: Page[]) => void;
  onClosePage: (pageIndex: number) => void;
  handlePageClick: (pageIndex: number) => void;
  signatures: string[];
  placedSignatures: PlacedSignatureExtended[];
  onUpdatePlacedSignatures: (updated: PlacedSignatureExtended[]) => void;
  onDeletePlacedSignature: (id: string) => void;
  placedTexts: PlacedText[];
  onUpdatePlacedTexts: (updated: PlacedText[]) => void;
  onDeletePlacedText: (id: string) => void;
  isAddingText: boolean;
  onAddText: (text: string) => void;
  rotation: number;
  startAction: () => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedElement: (
    element: { type: "signature" | "text"; id: string } | null
  ) => void;
}

const ALLOWED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const API_BASE_URL = "https://scan-back-production.up.railway.app";

const Field: React.FC<FieldProps> = ({
  pages,
  currentPageIndex,
  onAddPages,
  onClosePage,
  handlePageClick,
  signatures,
  placedSignatures,
  onUpdatePlacedSignatures,
  onDeletePlacedSignature,
  placedTexts,
  onUpdatePlacedTexts,
  onDeletePlacedText,
  isAddingText,
  onAddText,
  rotation,
  startAction,
  setIsLoading,
  setSelectedElement,
}) => {
  const token = Cookies.get("token");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  const [activeSignatureId, setActiveSignatureId] = useState<string | null>(
    null
  );
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(
    null
  );

  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const addingTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentPage = pages[currentPageIndex];

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await ky.post(`${API_BASE_URL}/api/upload`, {
      headers: {
        Authorization: `${token}`,
      },
      timeout: 60000,
      body: formData,
      throwHttpErrors: false,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.path) {
      throw new Error("Upload response does not contain 'path'");
    }

    return data.path;
  };

  const convertToPdf = async (
    path: string,
    fileType: string
  ): Promise<string> => {
    const response = await ky.post(`${API_BASE_URL}/convert`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      timeout: 60000,
      json: { file: path, type: fileType },
      throwHttpErrors: false,
    });

    if (!response.ok) {
      throw new Error(`Conversion failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.files) {
      throw new Error("Conversion response does not contain 'files'");
    }

    return data.files;
  };

  const fetchPdf = async (pdfUrl: string): Promise<Uint8Array> => {
    const response = await ky.get(pdfUrl, {
      headers: {
        Authorization: `${token}`,
      },
      throwHttpErrors: false,
    });

    if (!response.ok) {
      throw new Error(`Fetching PDF failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await handleFiles(files);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    if (
      e.dataTransfer &&
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0
    ) {
      e.preventDefault();
      const files = e.dataTransfer.files;
      await handleFiles(files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (
      e.dataTransfer &&
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0
    ) {
      e.preventDefault();
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setIsLoading(true);
    const newPages: Page[] = [];
    for (const file of Array.from(fileList)) {
      if (!ALLOWED_FORMATS.includes(file.type)) {
        alert(`Формат файла ${file.name} не поддерживается.`);
        continue;
      }

      try {
        const filePages = await parseFileToPages(file);
        newPages.push(...filePages);
      } catch (error: any) {
        alert(`Ошибка при обработке файла ${file.name}: ${error.message}`);
      }
    }

    if (newPages.length > 0) {
      onAddPages(newPages);
    }
    setIsLoading(false);
  };

  const parseFileToPages = async (file: File): Promise<Page[]> => {
    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      const imgData = await fileToDataURL(file);
      return [
        { id: `${Date.now()}-${Math.random()}`, imageData: imgData, rotation },
      ];
    } else if (fileType === "application/pdf") {
      const pdfData = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocument({ data: pdfData }).promise;
      const pdfPages: Page[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 3 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderContext = {
          canvasContext: context,
          viewport,
        };
        await page.render(renderContext).promise;
        const imgData = canvas.toDataURL("image/png");
        pdfPages.push({
          id: `${Date.now()}-${Math.random()}`,
          imageData: imgData,
          rotation,
        });
      }
      return pdfPages;
    } else if (
      fileType === "application/msword" ||
      fileType === "application/vnd.ms-excel" ||
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      const uploadedPath = await uploadFile(file);
      const pdfUrl = await convertToPdf(uploadedPath, fileType);
      const pdfData = await fetchPdf(pdfUrl);

      const pdf = await getDocument({ data: pdfData }).promise;
      const pdfPages: Page[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 3 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderContext = {
          canvasContext: context,
          viewport,
        };
        await page.render(renderContext).promise;
        const imgData = canvas.toDataURL("image/png");
        pdfPages.push({
          id: `${Date.now()}-${Math.random()}`,
          imageData: imgData,
          rotation,
        });
      }
      return pdfPages;
    }

    return [];
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Unable to convert file to base64"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const measureTextDimension = useCallback(
    (t: PlacedText): { widthPercent: number; heightPercent: number } | null => {
      if (!fieldRef.current) return null;
      const fieldRect = fieldRef.current.getBoundingClientRect();

      const measureDiv = document.createElement("div");
      measureDiv.style.position = "absolute";
      measureDiv.style.visibility = "hidden";
      measureDiv.style.pointerEvents = "none";
      measureDiv.style.fontFamily = t.fontFamily || "Arial";
      measureDiv.style.fontSize = t.fontSize || "16px";
      measureDiv.style.fontWeight = t.isBold ? "bold" : "normal";
      measureDiv.style.fontStyle = t.isItalic ? "italic" : "normal";
      measureDiv.style.whiteSpace = "pre-wrap";
      measureDiv.style.lineHeight = "normal";
      measureDiv.style.textAlign = t.textAlign || "left";
      measureDiv.style.width = "auto";
      measureDiv.style.height = "auto";
      measureDiv.style.maxWidth = "9999px";
      measureDiv.style.maxHeight = "9999px";
      measureDiv.textContent = t.text;

      document.body.appendChild(measureDiv);
      const rect = measureDiv.getBoundingClientRect();
      document.body.removeChild(measureDiv);

      const textWidthPx = rect.width;
      const textHeightPx = rect.height;

      const widthPercent = (textWidthPx / fieldRect.width) * 100;
      const heightPercent = (textHeightPx / fieldRect.height) * 100;

      return { widthPercent, heightPercent };
    },
    []
  );

  const finalizeInitialTextInput = useCallback(() => {
    if (!isAddingText || !addingTextAreaRef.current) return;
    const newTextValue = addingTextAreaRef.current.value.trim();
    (addingTextAreaRef.current as HTMLTextAreaElement).blur();

    if (!newTextValue) {
      onAddText("");
      return;
    }

    const tempText: PlacedText = {
      id: `${Date.now()}-${Math.random()}`,
      pageId: pages[currentPageIndex].id,
      text: newTextValue,
      x: 10,
      y: 10,
      width: 10,
      height: 5,
      angle: 0,
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#000000",
      isBold: false,
      isItalic: false,
      textAlign: "left",
      originalFontSize: 16,
      originalWidth: 10,
    };

    const measured = measureTextDimension(tempText);
    if (measured) {
      tempText.width = measured.widthPercent;
      tempText.height = measured.heightPercent;
      tempText.originalWidth = measured.widthPercent;
    }
    onAddText(newTextValue);
    const currentId = pages[currentPageIndex].id;
    const updated = [...placedTexts, tempText];
    onUpdatePlacedTexts(updated);
  }, [
    isAddingText,
    addingTextAreaRef,
    measureTextDimension,
    onAddText,
    placedTexts,
    pages,
    currentPageIndex,
    onUpdatePlacedTexts,
  ]);

  const handlePointerDown = (
    clientX: number,
    clientY: number,
    target: EventTarget | null
  ) => {
    if (
      target instanceof HTMLElement &&
      (target.classList.contains(styles.closeButton) ||
        target.classList.contains(styles.rotate))
    ) {
      return;
    }

    if (isAddingText && addingTextAreaRef.current) {
      if (
        target !== addingTextAreaRef.current &&
        !addingTextAreaRef.current.contains(target as Node)
      ) {
        finalizeInitialTextInput();
        return;
      }
    }

    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const offsetX = ((clientX - rect.left) / rect.width) * 100;
    const offsetY = ((clientY - rect.top) / rect.height) * 100;

    let clickedSignature: PlacedSignatureExtended | null = null;
    let clickedSignatureIndex = -1;
    let clickedText: PlacedText | null = null;
    let clickedTextIndex = -1;

    let resizeHandleType: string | null = null;

    for (let i = placedSignatures.length - 1; i >= 0; i--) {
      const ps = placedSignatures[i];
      const { localX, localY } = getLocalCoords(ps, offsetX, offsetY);

      const handleSize = 5;

      const inSERes =
        localX >= ps.width - handleSize &&
          localX <= ps.width + handleSize &&
          localY >= ps.height - handleSize &&
          localY <= ps.height + handleSize
          ? "se"
          : null;

      if (inSERes) {
        clickedSignature = ps;
        clickedSignatureIndex = i;
        resizeHandleType = inSERes;
        break;
      }

      if (
        localX >= 0 &&
        localX <= ps.width &&
        localY >= 0 &&
        localY <= ps.height
      ) {
        clickedSignature = ps;
        clickedSignatureIndex = i;
        resizeHandleType = "drag";
        break;
      }
    }

    for (let i = placedTexts.length - 1; i >= 0; i--) {
      const t = placedTexts[i];
      const { localX, localY } = getLocalCoords(t, offsetX, offsetY);

      const handleSize = 5;
      const inSEResT =
        localX >= t.width - handleSize &&
          localX <= t.width + handleSize &&
          localY >= t.height - handleSize &&
          localY <= t.height + handleSize
          ? "se"
          : null;

      if (inSEResT) {
        clickedText = t;
        clickedTextIndex = i;
        resizeHandleType = inSEResT;
        break;
      }

      if (
        localX >= 0 &&
        localX <= t.width &&
        localY >= 0 &&
        localY <= t.height
      ) {
        clickedText = t;
        clickedTextIndex = i;
        resizeHandleType = "drag";
        break;
      }
    }

    if (clickedText) {
      clickedSignature = null;
      resizeHandleType = resizeHandleType;
    }

    if (clickedSignature) {
      setSelectedTextId(null);
      setActiveTextId(null);
      setSelectedElement({ type: "signature", id: clickedSignature.id });

      const updated = [...placedSignatures];
      const [selected] = updated.splice(clickedSignatureIndex, 1);
      updated.push(selected);

      setActiveSignatureId(selected.id);
      setSelectedSignatureId(selected.id);

      if (resizeHandleType === "se") {
        startAction();
        selected.isResizing = true;
        selected.resizeHandle = "se";
        selected.resizeStart = {
          x: offsetX,
          y: offsetY,
          width: selected.width,
          height: selected.height,
        };
        onUpdatePlacedSignatures(updated);
        return;
      }

      if (resizeHandleType === "drag") {
        startAction();
        selected.isDragging = true;
        selected.dragStart = {
          x: offsetX - selected.x,
          y: offsetY - selected.y,
        };
        onUpdatePlacedSignatures(updated);
        return;
      }
    } else {
      setSelectedSignatureId(null);
      setActiveSignatureId(null);
      setSelectedElement(null);
    }

    if (clickedText) {
      setSelectedSignatureId(null);
      setActiveSignatureId(null);
      setSelectedElement({ type: "text", id: clickedText.id });

      const updatedT = [...placedTexts];
      const [selectedT] = updatedT.splice(clickedTextIndex, 1);
      updatedT.push(selectedT);

      setActiveTextId(selectedT.id);
      setSelectedTextId(selectedT.id);

      if (resizeHandleType === "se") {
        startAction();
        selectedT.isResizing = true;
        selectedT.resizeHandle = "se";
        selectedT.resizeStart = {
          x: offsetX,
          y: offsetY,
          width: selectedT.width,
          height: selectedT.height,
        };
        onUpdatePlacedTexts(updatedT);
        return;
      }

      if (resizeHandleType === "drag") {
        startAction();
        selectedT.isDragging = true;
        selectedT.dragStart = {
          x: offsetX - selectedT.x,
          y: offsetY - selectedT.y,
        };
        onUpdatePlacedTexts(updatedT);
        return;
      }
    } else {
      setSelectedTextId(null);
      setActiveTextId(null);
      setSelectedElement(null);
    }
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    const onPointerUp = () => {
      releaseObjects();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };
    const onTouchEnd = () => {
      releaseObjects();
    };

    if (activeSignatureId || activeTextId) {
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
  }, [activeSignatureId, activeTextId, placedSignatures, placedTexts]);

  const handleMove = (clientX: number, clientY: number) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const offsetX = ((clientX - rect.left) / rect.width) * 100;
    const offsetY = ((clientY - rect.top) / rect.height) * 100;

    let changed = false;

    if (activeSignatureId) {
      const updated = [...placedSignatures];
      for (let i = 0; i < updated.length; i++) {
        const ps = updated[i];
        if (ps.id === activeSignatureId) {
          const centerX = ps.x + ps.width / 2;
          const centerY = ps.y + ps.height / 2;
          if (
            ps.isRotating &&
            ps.rotationStartAngle !== undefined &&
            ps.initialMouseAngle !== undefined
          ) {
            const dx = offsetX - centerX;
            const dy = offsetY - centerY;
            const currentMouseAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const angleDiff = currentMouseAngle - ps.initialMouseAngle;
            ps.angle = ps.rotationStartAngle + angleDiff;
            changed = true;
          }

          if (
            ps.isDragging &&
            ps.dragStart &&
            !ps.isRotating &&
            !ps.isResizing
          ) {
            let newX = offsetX - ps.dragStart.x;
            let newY = offsetY - ps.dragStart.y;

            newX = Math.max(0, Math.min(newX, 100 - ps.width));
            newY = Math.max(0, Math.min(newY, 100 - ps.height));

            ps.x = newX;
            ps.y = newY;
            changed = true;
          }

          if (
            ps.isResizing &&
            ps.resizeHandle === "se" &&
            ps.resizeStart &&
            !ps.isRotating &&
            ps.aspectRatio
          ) {
            const { x, y, aspectRatio } = ps;
            const dx = offsetX - ps.resizeStart.x;
            const newWidth = ps.resizeStart.width + dx;
            const newHeight = newWidth / aspectRatio;

            const minSize = (5 / rect.width) * 100;
            if (
              newWidth >= minSize &&
              newHeight >= minSize &&
              x + newWidth <= 100 &&
              y + newHeight <= 100
            ) {
              ps.width = newWidth;
              ps.height = newHeight - 10;
              changed = true;
            }
          }
        }
      }
      if (changed) onUpdatePlacedSignatures(updated);
    }

    if (activeTextId) {
      const updatedT = [...placedTexts];
      for (let i = 0; i < updatedT.length; i++) {
        const t = updatedT[i];
        if (t.id === activeTextId) {
          const centerX = t.x + t.width / 2;
          const centerY = t.y + t.height / 2;
          if (
            t.isRotating &&
            t.rotationStartAngle !== undefined &&
            t.initialMouseAngle !== undefined
          ) {
            const dx = offsetX - centerX;
            const dy = offsetY - centerY;
            const currentMouseAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
            const angleDiff = currentMouseAngle - t.initialMouseAngle;
            t.angle = t.rotationStartAngle + angleDiff;
            changed = true;
          }

          if (t.isDragging && t.dragStart && !t.isRotating && !t.isResizing) {
            let newX = offsetX - t.dragStart.x;
            let newY = offsetY - t.dragStart.y;

            newX = Math.max(0, Math.min(newX, 100 - t.width));
            newY = Math.max(0, Math.min(newY, 100 - t.height));

            t.x = newX;
            t.y = newY;
            changed = true;
          }

          if (
            t.isResizing &&
            t.resizeHandle === "se" &&
            t.resizeStart &&
            !t.isRotating
          ) {
            const dx = offsetX - t.resizeStart.x;
            const newWidth = t.resizeStart.width + dx;
            if (t.originalWidth && t.originalFontSize) {
              const scale = newWidth / t.originalWidth;
              const newFontSize = t.originalFontSize * scale;
              t.fontSize = newFontSize.toFixed(0) + "px";
            }

            const minSize = (5 / rect.width) * 100;
            let newHeight =
              t.resizeStart.height * (newWidth / t.resizeStart.width);

            if (
              newWidth >= minSize &&
              newWidth <= 100 - t.x &&
              newHeight <= 100 - t.y
            ) {
              t.width = newWidth;
              t.height = newHeight;
              changed = true;
            }
          }
        }
      }
      if (changed) onUpdatePlacedTexts(updatedT);
    }
  };

  const releaseObjects = () => {
    if (activeSignatureId) {
      const updated = [...placedSignatures];
      for (let i = 0; i < updated.length; i++) {
        const ps = updated[i];
        if (ps.id === activeSignatureId) {
          ps.isDragging = false;
          ps.isResizing = false;
          ps.isRotating = false;
          ps.dragStart = undefined;
          ps.resizeStart = undefined;
          ps.resizeHandle = null;
          ps.rotationStartAngle = undefined;
          ps.initialMouseAngle = undefined;
        }
      }
      onUpdatePlacedSignatures(updated);
      setActiveSignatureId(null);
    }

    if (activeTextId) {
      const updatedT = [...placedTexts];
      for (let i = 0; i < updatedT.length; i++) {
        const t = updatedT[i];
        if (t.id === activeTextId) {
          t.isDragging = false;
          t.isResizing = false;
          t.isRotating = false;
          t.dragStart = undefined;
          t.resizeStart = undefined;
          t.resizeHandle = null;
          t.rotationStartAngle = undefined;
          t.initialMouseAngle = undefined;
        }
      }
      onUpdatePlacedTexts(updatedT);
      setActiveTextId(null);
    }
  };

  const startRotation = (
    e: React.PointerEvent | React.MouseEvent | React.TouchEvent,
    elementType: "signature" | "text",
    id: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    startAction();
    if (elementType === "signature") {
      const updated = [...placedSignatures];
      const index = updated.findIndex((ps) => ps.id === id);
      if (index !== -1) {
        const ps = updated[index];
        ps.isRotating = true;
        ps.rotationStartAngle = ps.angle;
        const rect = fieldRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX =
            ((ps.x + ps.width / 2) / 100) * rect.width + rect.left;
          const centerY =
            ((ps.y + ps.height / 2) / 100) * rect.height + rect.top;
          const dx = (e.nativeEvent as any).clientX - centerX;
          const dy = (e.nativeEvent as any).clientY - centerY;
          ps.initialMouseAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          onUpdatePlacedSignatures(updated);
          setActiveSignatureId(ps.id);
          setSelectedSignatureId(ps.id);
        }
      }
    } else if (elementType === "text") {
      const updatedT = [...placedTexts];
      const index = updatedT.findIndex((tt) => tt.id === id);
      if (index !== -1) {
        const t = updatedT[index];
        t.isRotating = true;
        t.rotationStartAngle = t.angle;
        const rect = fieldRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = ((t.x + t.width / 2) / 100) * rect.width + rect.left;
          const centerY = ((t.y + t.height / 2) / 100) * rect.height + rect.top;
          const dx = (e.nativeEvent as any).clientX - centerX;
          const dy = (e.nativeEvent as any).clientY - centerY;
          t.initialMouseAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          onUpdatePlacedTexts(updatedT);
          setActiveTextId(t.id);
          setSelectedTextId(t.id);
        }
      }
    }
  };

  const renderPlacedSignatures = () => {
    return placedSignatures.map((ps) => {
      const sig = signatures.find((s) => s === ps.signatureId);
      if (!sig) return null;

      const isSelected = ps.id === selectedSignatureId;

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
            border: isSelected ? "2px dashed #00f" : "1px solid transparent",
            boxSizing: "border-box",
            cursor:
              ps.isDragging || ps.isResizing || ps.isRotating
                ? "grabbing"
                : "grab",
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            handlePointerDown(e.clientX, e.clientY, e.target);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              handlePointerDown(touch.clientX, touch.clientY, e.target);
            }
          }}
        >
          <img
            src={sig}
            alt="Подпись"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              if (!ps.aspectRatio) {
                const updated = placedSignatures.map((signature) =>
                  signature.id === ps.id
                    ? { ...signature, aspectRatio }
                    : signature
                );
                onUpdatePlacedSignatures(updated);
              }
            }}
          />
          {isSelected && (
            <>
              <div
                className={styles.rotate}
                onPointerDown={(e) => startRotation(e, "signature", ps.id)}
                onTouchStart={(e) => startRotation(e, "signature", ps.id)}
                style={{
                  position: "absolute",
                  top: "-27px",
                  left: "-27px",
                  cursor: "grab",
                  zIndex: 10,
                }}
              >
                <RotateIcon />
              </div>
              <div
                style={{
                  position: "absolute",
                  width: "10px",
                  height: "10px",
                  background: "#00f",
                  bottom: "-5px",
                  right: "-5px",
                  cursor: "se-resize",
                  borderRadius: "50%",
                }}
              ></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlacedSignature(ps.id);
                }}
                className={styles.closeButton}
                title="Удалить размещенную подпись"
                style={{ zIndex: 9999 }}
              ></button>
            </>
          )}
        </div>
      );
    });
  };

  const updateTextAndMeasure = useCallback(
    (id: string, updatedProps: Partial<PlacedText>) => {
      const updatedT = placedTexts.map((pt) => {
        if (pt.id === id) {
          const newText = { ...pt, ...updatedProps };
          const measured = measureTextDimension(newText);
          if (measured) {
            newText.width = measured.widthPercent;
            newText.height = measured.heightPercent;
            if (pt.originalWidth) {
              newText.originalWidth = measured.widthPercent;
            }
          }
          return newText;
        }
        return pt;
      });
      onUpdatePlacedTexts(updatedT);
    },
    [placedTexts, measureTextDimension, onUpdatePlacedTexts]
  );

  const renderPlacedTexts = () => {
    return placedTexts.map((t) => {
      const isSelected = t.id === selectedTextId;

      const fontWeight = t.isBold ? "bold" : "normal";
      const fontStyle = t.isItalic ? "italic" : "normal";

      return (
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
            border: isSelected ? "2px dashed #00f" : "1px solid transparent",
            boxSizing: "border-box",
            cursor:
              t.isDragging || t.isResizing || t.isRotating
                ? "grabbing"
                : "grab",
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            handlePointerDown(e.clientX, e.clientY, e.target);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              handlePointerDown(touch.clientX, touch.clientY, e.target);
            }
          }}
          onDoubleClick={() => {
            const updated = placedTexts.map((pt) =>
              pt.id === t.id ? { ...pt, isEditing: true } : pt
            );
            onUpdatePlacedTexts(updated);
          }}
        >
          {t.isEditing ? (
            <textarea
              defaultValue={t.text}
              autoFocus
              style={{
                width: "100%",
                height: "100%",
                border: "1px solid #ccc",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                fontFamily: t.fontFamily,
                fontSize: t.fontSize,
                fontWeight: fontWeight,
                fontStyle: fontStyle,
                color: t.color,
                textAlign: t.textAlign,
                background: "#fff",
                overflow: "hidden",
              }}
              onBlur={(e) => {
                const newText = e.target.value;
                updateTextAndMeasure(t.id, { text: newText, isEditing: false });
              }}
              onInput={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = "auto";
                textarea.style.height = textarea.scrollHeight + "px";
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                fontFamily: t.fontFamily,
                fontSize: t.fontSize,
                color: t.color,
                fontWeight: fontWeight,
                fontStyle: fontStyle,
                textAlign: t.textAlign,
                whiteSpace: "pre-wrap",
                overflow: "hidden",
              }}
            >
              {t.text}
            </div>
          )}

          {isSelected && !t.isEditing && (
            <>
              <div
                className={styles.rotate}
                onPointerDown={(e) => startRotation(e, "text", t.id)}
                onTouchStart={(e) => startRotation(e, "text", t.id)}
                style={{
                  position: "absolute",
                  top: "-27px",
                  left: "-27px",
                  cursor: "grab",
                  zIndex: 10,
                }}
              >
                <RotateIcon />
              </div>
              <div
                style={{
                  position: "absolute",
                  width: "10px",
                  height: "10px",
                  background: "#00f",
                  bottom: "-5px",
                  right: "-5px",
                  cursor: "se-resize",
                  borderRadius: "50%",
                }}
              ></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlacedText(t.id);
                }}
                className={styles.closeButton}
                title="Удалить текст"
                style={{ zIndex: 9999 }}
              ></button>
            </>
          )}
        </div>
      );
    });
  };

  const handleConfigUpdate = useCallback(
    (updatedProps: Partial<PlacedText>) => {
      if (selectedTextId) {
        updateTextAndMeasure(selectedTextId, updatedProps);
      }
    },
    [selectedTextId, updateTextAndMeasure]
  );

  return (
    <>
      {selectedTextId && (
        <FieldTextConfig
          text={
            placedTexts.find((pt) => pt.id === selectedTextId) ||
            ({} as PlacedText)
          }
          onUpdate={handleConfigUpdate}
        />
      )}
      <div
        className={styles.field}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        ref={fieldRef}
        style={{
          position: "relative",
          touchAction: "none",
          height: "75vh",
          width:
            rotation === 90
              ? `calc(75vh * (297/210))`
              : `calc(75vh * (210/297))`,
        }}
        onPointerDown={(e) => {
          if (pages.length > 0 && currentPage?.imageData) {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            handlePointerDown(e.clientX, e.clientY, e.target);
          }
        }}
        onTouchStart={(e) => {
          if (pages.length > 0 && currentPage?.imageData) {
            e.preventDefault();
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              handlePointerDown(touch.clientX, touch.clientY, e.target);
            }
          }
        }}
      >
        {pages.length === 0 && (
          <div
            className={styles.field__content}
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            <AddPageIcon />
            <div className={styles.field__info}>
              <div className={styles.field__infoText}>
                <h4>Загрузить документы</h4>
                <p>Можете их загрузить кликнув на поле для выбора файла</p>
              </div>
              <p className={styles.field__infoFormats}>
                JPG, JPEG, PNG, PDF, DOCX, DOC, XLS, XLSX
              </p>
            </div>
          </div>
        )}
        {pages.length > 0 && currentPage && currentPage.imageData && (
          <div
            className={`${styles.field__file} page`}
            data-rotation={currentPage.rotation}
            style={{ position: "relative" }}
          >
            <button
              className={styles.closeButton}
              onClick={() => onClosePage(currentPageIndex)}
              title="Удалить текущую страницу"
            ></button>
            <div
              style={{ position: "relative", width: "100%", height: "100%" }}
            >
              <img
                src={currentPage.imageData}
                alt="page"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
              {renderPlacedSignatures()}
              {renderPlacedTexts()}
              {isAddingText && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    background: "#fff",
                    border: "1px solid #ccc",
                    zIndex: 9999,
                  }}
                >
                  <textarea
                    ref={addingTextAreaRef}
                    autoFocus
                    placeholder="Введите текст (клик вне поля для завершения)"
                    style={{
                      width: "150px",
                      height: "auto",
                      minHeight: "50px",
                      resize: "none",
                      border: "1px solid #ccc",
                      fontFamily: "Arial",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                    onInput={(e) => {
                      const textarea = e.target as HTMLTextAreaElement;
                      textarea.style.height = "auto";
                      textarea.style.height = textarea.scrollHeight + "px";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {pages.length > 0 && (
        <FieldPagination
          totalPages={pages.length}
          currentPageIndex={currentPageIndex}
          onPageClick={handlePageClick}
          onAddClick={() => fileInputRef.current?.click()}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.docx,.doc,.xls,.xlsx"
        onChange={handleFileChange}
      />
    </>
  );
};

export default Field;
