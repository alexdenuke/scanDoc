import React, { useState } from "react";
import {
  AllPagesIcon,
  CancelIcon,
  DownloadIcon,
  MoreIcon,
  RotatePageIcon,
  TrashIcon,
} from "@/components/Icons/Icons";
import styles from "./Actions.module.scss";
import ActionsMobile from "@/components/Mobile/Actions/Index";
import DownlaodMobile from "@/components/Mobile/Download/Index";

interface ActionsProps {
  onDeleteDocument: () => void;
  onUndo: () => void;
  onRotate: () => void;
  onApplyToAll: () => void;
  isDocumentLoaded: boolean;
  isApplyAllEnabled: boolean;
  onExportJPG: () => void;
  onExportPDF: () => void;
}

const Actions: React.FC<ActionsProps> = ({
  onDeleteDocument,
  onUndo,
  onRotate,
  onApplyToAll,
  isDocumentLoaded,
  isApplyAllEnabled,
  onExportJPG,
  onExportPDF,
}) => {
  const [showActions, setShowActions] = useState<boolean>(false);
  const [showDownload, setShowDownload] = useState<boolean>(false);
  return (
    <div className={styles.actions}>
      <button onClick={() => setShowActions(!showActions)}>
        <MoreIcon />
      </button>
      <button onClick={() => setShowDownload(!showDownload)}>
        <DownloadIcon />
      </button>
      {showActions && (
        <ActionsMobile
          onDeleteDocument={onDeleteDocument}
          onUndo={onUndo}
          onRotate={onRotate}
          onApplyToAll={onApplyToAll}
          isDocumentLoaded={isDocumentLoaded}
        />
      )}
      {showDownload && (
        <DownlaodMobile onExportJPG={onExportJPG} onExportPDF={onExportPDF} />
      )}
      <div className={styles.actions__content}>
        <button
          className={styles.actions__button}
          onClick={onDeleteDocument}
          disabled={!isDocumentLoaded}
          title={
            !isDocumentLoaded
              ? "Загрузите документ для удаления"
              : "Удалить документ"
          }
        >
          <TrashIcon />
          <span>Удалить документ</span>
        </button>
        <button
          className={styles.actions__button}
          onClick={onUndo}
          disabled={!isDocumentLoaded}
          title={
            !isDocumentLoaded ? "Загрузите документ для отмены" : "Отменить"
          }
        >
          <CancelIcon />
          <span>Отменить</span>
        </button>
        <button
          className={styles.actions__button}
          onClick={onRotate}
          disabled={!isDocumentLoaded}
          title={
            !isDocumentLoaded
              ? "Загрузите документ для поворота"
              : "Повернуть страницу"
          }
        >
          <RotatePageIcon />
          <span>Повернуть страницу</span>
        </button>
        <button
          className={styles.actions__button}
          onClick={onApplyToAll}
          disabled={!isDocumentLoaded || !isApplyAllEnabled} 
          title={
            !isDocumentLoaded
              ? "Загрузите документ для применения"
              : !isApplyAllEnabled
              ? "Выберите элемент для применения"
              : "Применить на все страницы"
          }
        >
          <AllPagesIcon />
          <span>Применить на все страницы</span>
        </button>
      </div>
      <div className={styles.actions__export}>
        <span className={styles.actions__exportText}>Экспортировать в:</span>
        <div className={styles.actions__exportButtons}>
          <button
            className={styles.actions__exportButton}
            disabled={!isDocumentLoaded}
            title={
              !isDocumentLoaded
                ? "Загрузите документ для экспорта"
                : "Экспортировать в JPG"
            }
            onClick={onExportJPG}
          >
            <DownloadIcon />
            <span>JPG</span>
          </button>
          <button
            className={styles.actions__exportButton}
            disabled={!isDocumentLoaded}
            title={
              !isDocumentLoaded
                ? "Загрузите документ для экспорта"
                : "Экспортировать в PDF"
            }
            onClick={onExportPDF}
          >
            <DownloadIcon />
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Actions;
