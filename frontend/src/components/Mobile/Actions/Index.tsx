import {
  AllPagesIcon,
  CancelIcon,
  RotatePageIcon,
  TrashIcon,
} from "@/components/Icons/Icons";
import React from "react";
interface ActionsProps {
  onDeleteDocument: () => void;
  onUndo: () => void;
  onRotate: () => void;
  onApplyToAll: () => void;
  isDocumentLoaded: boolean;
}
import styles from "./style.module.scss";

export default function ActionsMobile({
  onDeleteDocument,
  onUndo,
  onRotate,
  onApplyToAll,
  isDocumentLoaded,
}: ActionsProps) {
  return (
    <div className={styles.actions__content}>
      <button
        className={styles.actions__button}
        onClick={onDeleteDocument}
        disabled={!isDocumentLoaded}
      >
        <TrashIcon />
        <span>Удалить документ</span>
      </button>
      <button
        className={styles.actions__button}
        onClick={onUndo}
        disabled={!isDocumentLoaded}
      >
        <CancelIcon />
        <span>Отменить</span>
      </button>
      <button
        className={styles.actions__button}
        onClick={onRotate}
        disabled={!isDocumentLoaded}
      >
        <RotatePageIcon />
        <span>Повернуть страницу</span>
      </button>
      <button
        className={styles.actions__button}
        onClick={onApplyToAll}
        disabled={!isDocumentLoaded}
      >
        <AllPagesIcon />
        <span>Применить на все страницы</span>
      </button>
    </div>
  );
}
